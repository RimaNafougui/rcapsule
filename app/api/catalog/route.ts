import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { cacheGet, cacheSet } from "@/lib/redis";
import {
  publicLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/ratelimit";

type SortOption = "popularity" | "newest" | "price-asc" | "price-desc" | "name";

export async function GET(req: Request) {
  const { success, reset } = await publicLimiter().limit(getIdentifier(req));

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const filterType = searchParams.get("filter") || "all"; // all, product, brand, category
    const sort = (searchParams.get("sort") || "popularity") as SortOption;
    const categoryFilter = searchParams.get("category") || "";
    const brandFilter = searchParams.get("brand") || "";
    const inStockOnly = searchParams.get("inStock") === "true";
    const limit = parseInt(searchParams.get("limit") || "24");
    const offset = parseInt(searchParams.get("offset") || "0");
    const suggestions = searchParams.get("suggestions") === "true";

    const supabase = getSupabaseServer();

    // Check cache for non-suggestion requests
    const cacheKey = `catalog:${query}:${sort}:${filterType}:${categoryFilter}:${brandFilter}:${inStockOnly}:${limit}:${offset}`;

    if (!suggestions) {
      const cached = await cacheGet<{
        products: unknown[];
        total: number;
        limit: number;
        offset: number;
        availableBrands?: string[];
        availableCategories?: string[];
      }>(cacheKey);

      if (cached) {
        return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
      }
    }

    // If requesting suggestions (top 10 by popularity)
    if (suggestions && query) {
      const { data: products, error } = await supabase
        .from("GlobalProduct")
        .select(
          `
          *,
          clothes:Clothes(count)
        `,
        )
        .or(
          `name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`,
        )
        .limit(50);

      if (error) throw error;

      const sortedProducts = (products || [])
        .map((p: any) => ({
          ...p,
          popularityCount: p.clothes?.[0]?.count || 0,
          clothes: undefined,
        }))
        .sort((a: any, b: any) => b.popularityCount - a.popularityCount)
        .slice(0, 10);

      return NextResponse.json({
        products: sortedProducts,
        total: sortedProducts.length,
        type: "suggestions",
      });
    }

    // Parse comma-separated filter values
    const categories = categoryFilter
      ? categoryFilter.split(",").map((s) => s.trim())
      : [];
    const brands = brandFilter
      ? brandFilter.split(",").map((s) => s.trim())
      : [];

    // For popularity sort, we can't use Supabase .order() on a joined aggregate,
    // so we fetch a larger batch, sort in JS, and slice for pagination.
    if (sort === "popularity") {
      // Build the query for counting total matches
      let countQuery = supabase
        .from("GlobalProduct")
        .select("id", { count: "exact", head: true });

      let dataQuery = supabase.from("GlobalProduct").select(
        `
          *,
          clothes:Clothes(count)
        `,
      );

      // Apply search
      if (query) {
        const searchFilter = buildSearchFilter(query, filterType);

        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Apply category/brand/inStock filters
      if (categories.length > 0) {
        countQuery = countQuery.in("category", categories);
        dataQuery = dataQuery.in("category", categories);
      }
      if (brands.length > 0) {
        countQuery = countQuery.in("brand", brands);
        dataQuery = dataQuery.in("brand", brands);
      }
      if (inStockOnly) {
        countQuery = countQuery.eq("inStock", true);
        dataQuery = dataQuery.eq("inStock", true);
      }

      // Fetch all matching products (limited to a reasonable max for sorting)
      const fetchLimit = Math.min(offset + limit + 500, 2000);

      dataQuery = dataQuery.limit(fetchLimit);

      const [
        { count: totalCount, error: countError },
        { data: products, error: dataError },
      ] = await Promise.all([countQuery, dataQuery]);

      if (countError) throw countError;
      if (dataError) throw dataError;

      // Sort by popularity in JS
      const sorted = (products || [])
        .map((p: any) => ({
          ...p,
          popularityCount: p.clothes?.[0]?.count || 0,
          clothes: undefined,
        }))
        .sort((a: any, b: any) => b.popularityCount - a.popularityCount);

      const paginatedProducts = sorted.slice(offset, offset + limit);

      const responseBody: any = {
        products: paginatedProducts,
        total: totalCount || 0,
        limit,
        offset,
      };

      // On first page, include metadata for filters
      if (offset === 0) {
        const metadata = await fetchFilterMetadata(supabase);

        responseBody.availableBrands = metadata.availableBrands;
        responseBody.availableCategories = metadata.availableCategories;
      }

      await cacheSet(cacheKey, responseBody, 300);

      return NextResponse.json(responseBody, {
        headers: { "X-Cache": "MISS" },
      });
    }

    // Non-popularity sorts — use Supabase .order() + .range()
    let dbQuery = supabase.from("GlobalProduct").select(
      `
        *,
        clothes:Clothes(count)
      `,
      { count: "exact" },
    );

    // Apply sort
    switch (sort) {
      case "newest":
        dbQuery = dbQuery.order("createdat", { ascending: false });
        break;
      case "price-asc":
        dbQuery = dbQuery.order("originalprice", {
          ascending: true,
          nullsFirst: false,
        });
        break;
      case "price-desc":
        dbQuery = dbQuery.order("originalprice", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "name":
        dbQuery = dbQuery.order("name", { ascending: true });
        break;
    }

    // Apply search
    if (query) {
      switch (filterType) {
        case "product":
          dbQuery = dbQuery.ilike("name", `%${query}%`);
          break;
        case "brand":
          dbQuery = dbQuery.ilike("brand", `%${query}%`);
          break;
        case "category":
          dbQuery = dbQuery.ilike("category", `%${query}%`);
          break;
        case "all":
        default:
          dbQuery = dbQuery.or(
            `name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`,
          );
          break;
      }
    }

    // Apply filters
    if (categories.length > 0) {
      dbQuery = dbQuery.in("category", categories);
    }
    if (brands.length > 0) {
      dbQuery = dbQuery.in("brand", brands);
    }
    if (inStockOnly) {
      dbQuery = dbQuery.eq("inStock", true);
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: products, error, count } = await dbQuery;

    if (error) throw error;

    const productsWithPopularity = (products || []).map((p: any) => ({
      ...p,
      popularityCount: p.clothes?.[0]?.count || 0,
      clothes: undefined,
    }));

    const responseBody: any = {
      products: productsWithPopularity,
      total: count || 0,
      limit,
      offset,
    };

    // On first page, include metadata for filters
    if (offset === 0) {
      const metadata = await fetchFilterMetadata(supabase);

      responseBody.availableBrands = metadata.availableBrands;
      responseBody.availableCategories = metadata.availableCategories;
    }

    await cacheSet(cacheKey, responseBody, 300);

    return NextResponse.json(responseBody, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error("Error fetching catalog:", error);

    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 },
    );
  }
}

function buildSearchFilter(query: string, filterType: string): string {
  switch (filterType) {
    case "product":
      return `name.ilike.%${query}%`;
    case "brand":
      return `brand.ilike.%${query}%`;
    case "category":
      return `category.ilike.%${query}%`;
    case "all":
    default:
      return `name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`;
  }
}

async function fetchFilterMetadata(
  supabase: ReturnType<typeof getSupabaseServer>,
) {
  const [{ data: brandsData }, { data: catsData }] = await Promise.all([
    supabase.from("GlobalProduct").select("brand").not("brand", "is", null),
    supabase
      .from("GlobalProduct")
      .select("category")
      .not("category", "is", null),
  ]);

  const availableBrands = [
    ...new Set((brandsData || []).map((r: any) => r.brand as string)),
  ].sort();
  const availableCategories = [
    ...new Set((catsData || []).map((r: any) => r.category as string)),
  ].sort();

  return { availableBrands, availableCategories };
}
