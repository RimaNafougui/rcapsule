import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

// Browser extensions send a chrome-extension:// origin; allow the app origin too
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ...(process.env.ALLOWED_EXTENSION_ORIGIN
    ? [process.env.ALLOWED_EXTENSION_ORIGIN]
    : []),
]);

function corsHeaders(origin: string) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "";

  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) });
}

const MAX_BATCH_SIZE = 50;

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "";

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    // Admin-only: only admins can bulk-import to GlobalProduct
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: only admins can bulk-import to the catalog" },
        { status: 403, headers: corsHeaders(origin) },
      );
    }

    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty products array" },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    if (products.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const supabase = getSupabaseServer();
    const results: Array<{
      url: string;
      success: boolean;
      error?: string;
      duplicate?: boolean;
    }> = [];

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of products) {
      const {
        name,
        brand,
        price,
        imageUrl,
        link,
        category,
        materials,
        description,
      } = item;

      if (!name) {
        results.push({
          url: link || "",
          success: false,
          error: "Missing name",
        });
        errors++;
        continue;
      }

      try {
        const finalCategory = category || "Uncategorized";

        // Deduplication: check if GlobalProduct with this retaillink already exists
        if (link) {
          const { data: existingProduct } = await supabase
            .from("GlobalProduct")
            .select("id")
            .eq("retaillink", link)
            .single();

          if (existingProduct) {
            results.push({ url: link, success: true, duplicate: true });
            duplicates++;
            continue;
          }
        }

        // Insert into GlobalProduct only
        const { error: gpError } = await supabase.from("GlobalProduct").insert({
          name,
          brand: brand || "Unknown",
          category: finalCategory,
          description: description || null,
          retaillink: link || null,
          imageurl: imageUrl || null,
          colors: [],
          materials: materials || null,
          originalprice: price ? parseFloat(price) : null,
          source: link ? new URL(link).hostname.replace("www.", "") : null,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        if (gpError) {
          results.push({
            url: link || "",
            success: false,
            error: gpError.message,
          });
          errors++;
        } else {
          results.push({ url: link || "", success: true });
          imported++;
        }
      } catch (itemError) {
        results.push({
          url: link || "",
          success: false,
          error: String(itemError),
        });
        errors++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        imported,
        duplicates,
        errors,
        total: products.length,
        results,
      },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server Exception", details: String(error) },
      { status: 500, headers: corsHeaders(req.headers.get("origin") || "") },
    );
  }
}
