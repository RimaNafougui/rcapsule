//app/api/collections/[id]/route.ts
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";
import { generateUniqueSlug } from "@/lib/utils/slug";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success, reset } = await apiLimiter().limit(
      `user:${session.user.id}`,
    );

    if (!success) return rateLimitResponse(reset);

    const { id } = await params;
    const supabase = getSupabaseServer();

    const WARDROBE_SELECT = `
      *,
      WardrobeClothes (
        addedAt,
        notes,
        clothes:Clothes (*)
      ),
      WardrobeOutfit (
        addedAt,
        notes,
        outfit:Outfit (id, name, imageUrl, occasion, season, timesWorn, createdAt)
      )
    `;

    // Try by ID first, then fall back to slug
    let { data: wardrobeRaw } = await supabase
      .from("Wardrobe")
      .select(WARDROBE_SELECT)
      .eq("id", id)
      .eq("userId", session.user.id)
      .maybeSingle();

    if (!wardrobeRaw) {
      ({ data: wardrobeRaw } = await supabase
        .from("Wardrobe")
        .select(WARDROBE_SELECT)
        .eq("slug", id)
        .eq("userId", session.user.id)
        .maybeSingle());
    }

    if (!wardrobeRaw) {
      return NextResponse.json(
        { error: "Wardrobe not found" },
        { status: 404 },
      );
    }

    // 1. Process Outfits List
    const outfits = (wardrobeRaw.WardrobeOutfit || [])
      .map((wo: any) => {
        if (!wo.outfit) return null;

        return { ...wo.outfit, addedToCollectionAt: wo.addedAt };
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.addedToCollectionAt).getTime() -
          new Date(a.addedToCollectionAt).getTime(),
      );

    // 2. Process Clothes List
    const clothes = (wardrobeRaw.WardrobeClothes || [])
      .map((wc: any) => {
        if (!wc.clothes) return null;

        return {
          ...wc.clothes,
          addedToWardrobeAt: wc.addedAt,
          wardrobeNotes: wc.notes,
        };
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.addedToWardrobeAt).getTime() -
          new Date(a.addedToWardrobeAt).getTime(),
      );

    // 2. Calculate Stats
    let totalValue = 0;
    const colorCounts: Record<string, number> = {};
    let totalColorTags = 0;

    clothes.forEach((item: any) => {
      if (item.price) totalValue += item.price;

      if (Array.isArray(item.colors)) {
        item.colors.forEach((color: string) => {
          const normalizedColor = color.toLowerCase().trim();

          colorCounts[normalizedColor] =
            (colorCounts[normalizedColor] || 0) + 1;
          totalColorTags++;
        });
      }
    });

    const colorAnalysis = Object.entries(colorCounts)
      .map(([color, count]) => ({
        color,
        count,
        percentage:
          totalColorTags > 0 ? Math.round((count / totalColorTags) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const wardrobe = {
      ...wardrobeRaw,
      clothes,
      outfits,
      stats: {
        totalValue: parseFloat(totalValue.toFixed(2)),
        itemCount: clothes.length,
        colorAnalysis,
      },
    };

    delete wardrobe.WardrobeClothes;
    delete wardrobe.WardrobeOutfit;

    return NextResponse.json(wardrobe);
  } catch (error) {
    console.error("Error fetching wardrobe:", error);

    return NextResponse.json(
      { error: "Failed to fetch wardrobe" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success, reset } = await apiLimiter().limit(
      `user:${session.user.id}`,
    );

    if (!success) return rateLimitResponse(reset);

    const { id } = await params;
    const data = await req.json();
    const supabase = getSupabaseServer();
    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.title !== undefined) {
      updatePayload.title = data.title;
      updatePayload.slug = await generateUniqueSlug(
        supabase,
        session.user.id,
        data.title,
        id,
      );
    }

    if (data.description !== undefined)
      updatePayload.description = data.description;
    if (data.isPublic !== undefined) updatePayload.isPublic = data.isPublic;
    if (data.coverImage !== undefined)
      updatePayload.coverImage = data.coverImage;

    const { data: wardrobe, error } = await supabase
      .from("Wardrobe")
      .update(updatePayload)
      .eq("id", id)
      .eq("userId", session.user.id)
      .select()
      .single();

    if (error || !wardrobe) {
      return NextResponse.json(
        { error: "Wardrobe not found or update failed" },
        { status: 404 },
      );
    }

    return NextResponse.json(wardrobe);
  } catch (error) {
    console.error("Error updating wardrobe:", error);

    return NextResponse.json(
      { error: "Failed to update wardrobe" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success, reset } = await apiLimiter().limit(
      `user:${session.user.id}`,
    );

    if (!success) return rateLimitResponse(reset);

    const { id } = await params;
    const supabase = getSupabaseServer();

    const { data: existing, error: fetchError } = await supabase
      .from("Wardrobe")
      .select("id, userId")
      .eq("id", id)
      .single();

    if (fetchError || !existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Wardrobe not found" },
        { status: 404 },
      );
    }

    await supabase.from("WardrobeClothes").delete().eq("wardrobeId", id);
    await supabase.from("WardrobeOutfit").delete().eq("wardrobeId", id);

    const { error: deleteError } = await supabase
      .from("Wardrobe")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wardrobe:", error);

    return NextResponse.json(
      { error: "Failed to delete wardrobe" },
      { status: 500 },
    );
  }
}
