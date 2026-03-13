import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { clothesPostSchema } from "@/lib/validations/schemas";
import { cacheDel, analyticsKey, ownedClothesKey } from "@/lib/redis";

export async function GET(req: Request) {
  return await Sentry.startSpan(
    {
      op: "db.query",
      name: "Fetch User Clothes",
    },
    async (span) => {
      try {
        const session = await auth();

        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const wardrobeId = searchParams.get("wardrobeId");
        const statusFilter = searchParams.get("status");
        const limit = Math.min(
          parseInt(searchParams.get("limit") || "200"),
          200,
        );
        const offset = parseInt(searchParams.get("offset") || "0");
        const supabase = getSupabaseServer();

        if (wardrobeId) {
          const { data: wardrobeClothes, error } = await supabase
            .from("WardrobeClothes")
            .select(
              `
              addedAt,
              notes,
              clothes:Clothes(*)
            `,
            )
            .eq("wardrobeId", wardrobeId)
            .order("addedAt", { ascending: false });

          if (error) throw error;

          const clothes =
            wardrobeClothes?.map((wc: any) => ({
              ...wc.clothes,
              addedToWardrobeAt: wc.addedAt,
              wardrobeNotes: wc.notes,
            })) || [];

          span?.setAttribute("result_count", clothes.length);
          span?.setAttribute("query_type", "wardrobe");
          span?.setAttribute("wardrobe_id", wardrobeId);

          return NextResponse.json(clothes);
        } else {
          // 2. FETCHING ALL CLOTHES (Main Closet / Wishlist)
          let query = supabase
            .from("Clothes")
            .select(
              `
              *,
              wardrobes:WardrobeClothes(
                wardrobeId,
                addedAt,
                wardrobe:Wardrobe(id, title)
              )
            `,
            )
            .eq("userId", userId)
            .order("createdAt", { ascending: false });

          // --- NEW FILTERING LOGIC ---
          if (statusFilter) {
            if (statusFilter === "owned") {
              // owned: Includes explicit 'owned' AND legacy items (null)
              query = query.or("status.eq.owned,status.is.null");
            } else {
              // wishlist: Strict equality
              query = query.eq("status", statusFilter);
            }
          }
          // ---------------------------

          const { data: clothes, error } = await query.range(
            offset,
            offset + limit - 1,
          );

          if (error) throw error;

          span?.setAttribute("result_count", clothes?.length || 0);
          span?.setAttribute("query_type", "all_clothes");
          span?.setAttribute("status_filter", statusFilter || "all");

          return NextResponse.json(clothes || []);
        }
      } catch (error) {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const wardrobeId = searchParams.get("wardrobeId");
        const statusFilter = searchParams.get("status");

        Sentry.captureException(error, {
          tags: { api_route: "/api/clothes", method: "GET" },
          extra: {
            userId: session?.user?.id,
            wardrobeId: wardrobeId,
            statusFilter: statusFilter,
          },
        });

        return NextResponse.json(
          { error: "Failed to fetch clothes" },
          { status: 500 },
        );
      }
    },
  );
}
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const result = clothesPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;
    const supabase = getSupabaseServer();

    if (data.wardrobeIds && data.wardrobeIds.length > 0) {
      const { data: wardrobes, error } = await supabase
        .from("Wardrobe")
        .select("id, userId")
        .in("id", data.wardrobeIds);

      if (error || !wardrobes) {
        return NextResponse.json(
          { error: "Failed to validate wardrobes" },
          { status: 400 },
        );
      }

      const invalidWardrobes = wardrobes.filter(
        (w: any) => w.userId !== userId,
      );

      if (invalidWardrobes.length > 0) {
        return NextResponse.json(
          { error: "Invalid wardrobe access" },
          { status: 403 },
        );
      }
    }

    const clothingPayload = {
      userId: userId,
      name: data.name,
      brand: data.brand || null,
      category: data.category,
      price: data.price != null ? parseFloat(String(data.price)) : null,
      status: data.status || "owned", // Default to owned
      purchaseDate:
        data.status === "wishlist" ? null : data.purchaseDate || null,

      colors: Array.isArray(data.colors) ? data.colors : [],
      season: data.season || null,
      size: data.size || null,
      link: data.link || null,
      imageUrl: data.imageUrl || null,
      placesToWear: Array.isArray(data.placesToWear) ? data.placesToWear : [],
      materials: data.materials || null,
      description: data.description || null,
      condition: data.condition || null,
      globalproductid: data.globalproductid || null,
    };

    const { data: clothing, error: createError } = await supabase
      .from("Clothes")
      .insert(clothingPayload)
      .select()
      .single();

    if (createError) throw createError;

    // Link to Wardrobes if IDs provided
    if (data.wardrobeIds && data.wardrobeIds.length > 0) {
      const wardrobeEntries = data.wardrobeIds.map((wardrobeId: string) => ({
        wardrobeId,
        clothesId: clothing.id,
      }));

      const { error: junctionError } = await supabase
        .from("WardrobeClothes")
        .insert(wardrobeEntries);

      if (junctionError) { /* error is non-critical; wardrobe association failed */ }
    }

    const { data: clothingWithWardrobes } = await supabase
      .from("Clothes")
      .select(
        `
        *,
        wardrobes:WardrobeClothes(
          wardrobeId,
          addedAt,
          wardrobe:Wardrobe(id, title)
        )
      `,
      )
      .eq("id", clothing.id)
      .single();

    // Invalidate analytics and owned-clothes caches so the next read
    // reflects the new item immediately.
    await cacheDel(analyticsKey(userId), ownedClothesKey(userId));

    return NextResponse.json(clothingWithWardrobes || clothing, {
      status: 201,
    });
  } catch (error) {
    const session = await auth();

    Sentry.captureException(error, {
      tags: { api_route: "/api/clothes", method: "POST" },
      extra: {
        userId: session?.user?.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to create clothing" },
      { status: 500 },
    );
  }
}
