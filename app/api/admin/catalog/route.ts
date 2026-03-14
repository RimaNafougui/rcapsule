import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("GlobalProduct")
      .select("*", { count: "exact" })
      .order("createdat", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`,
      );
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (brand) {
      query = query.eq("brand", brand);
    }

    const { data: products, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      products: products ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success: ok, reset: rst } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!ok) return rateLimitResponse(rst);

  try {
    const body = await req.json();

    const {
      name,
      brand,
      category,
      description,
      imageurl,
      retaillink,
      originalprice,
      inStock,
      currency,
      slug,
      sku,
      materials,
      sustainability,
      colors,
      source,
      externalId,
      scrapingStatus,
    } = body;

    if (!name || !brand || !category) {
      return NextResponse.json(
        { error: "name, brand, and category are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("GlobalProduct")
      .insert({
        name,
        brand,
        category,
        description: description ?? null,
        imageurl: imageurl ?? null,
        retaillink: retaillink ?? null,
        originalprice: originalprice ?? null,
        inStock: inStock ?? true,
        currency: currency ?? "CAD",
        slug: slug ?? null,
        sku: sku ?? null,
        materials: materials ?? null,
        sustainability: sustainability ?? null,
        colors: colors ?? [],
        source: source ?? null,
        externalId: externalId ?? null,
        scrapingStatus: scrapingStatus ?? null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
