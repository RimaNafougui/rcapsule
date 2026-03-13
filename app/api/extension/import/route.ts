import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

// Browser extensions send a chrome-extension:// origin; allow the app origin too
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // chrome-extension origins are added at runtime via env var, e.g.:
  // ALLOWED_EXTENSION_ORIGIN=chrome-extension://abcdefghijklmnopabcdefghijklmnop
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

    const body = await req.json();
    const {
      name,
      brand,
      price,
      imageUrl,
      link,
      size,
      category,
      status,
      materials,
      description,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing name" },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const supabase = getSupabaseServer();
    const finalCategory = category || "Uncategorized";
    const finalStatus = status || "owned";
    const finalDate =
      finalStatus === "wishlist"
        ? null
        : new Date().toISOString().split("T")[0];

    // 1. Upsert into GlobalProduct catalog
    let globalProductId: string | null = null;

    if (link) {
      const { data: existingProduct } = await supabase
        .from("GlobalProduct")
        .select("id")
        .eq("retaillink", link)
        .single();

      if (existingProduct) {
        globalProductId = existingProduct.id;
      } else {
        const { data: newProduct, error: gpError } = await supabase
          .from("GlobalProduct")
          .insert({
            name,
            brand: brand || "Unknown",
            category: finalCategory,
            description: description || null,
            retaillink: link,
            imageurl: imageUrl || null,
            colors: [],
            materials: materials || null,
            originalprice: price ? parseFloat(price) : null,
            source: new URL(link).hostname.replace("www.", ""),
          })
          .select("id")
          .single();

        if (gpError) {
          // Non-blocking — still save the clothing item
        } else {
          globalProductId = newProduct.id;
        }
      }
    }

    // 2. Insert into user's Clothes
    const { error } = await supabase
      .from("Clothes")
      .insert({
        userId: session.user.id,
        name,
        brand: brand || null,
        price: price ? parseFloat(price) : null,
        imageUrl: imageUrl || null,
        link: link || null,
        category: finalCategory,
        size: size || null,
        status: finalStatus,
        purchaseDate: finalDate,
        colors: [],
        placesToWear: [],
        materials: materials || null,
        description: description || null,
        globalproductid: globalProductId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Database Error", details: error.message },
        { status: 500, headers: corsHeaders(origin) },
      );
    }

    return NextResponse.json(
      { success: true, message: "Imported successfully", globalProductId },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server Exception", details: String(error) },
      { status: 500, headers: corsHeaders(req.headers.get("origin") || "") },
    );
  }
}
