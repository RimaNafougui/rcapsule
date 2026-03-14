import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { clothesPutSchema } from "@/lib/validations/schemas";
import { cacheDel, analyticsKey, ownedClothesKey } from "@/lib/redis";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();

    const { data: clothing, error } = await supabase
      .from("Clothes")
      .select(
        `
        *,
        wardrobes:WardrobeClothes(
          wardrobeId,
          addedAt,
          notes,
          wardrobe:Wardrobe(
            id,
            title,
            description,
            isPublic,
            coverImage
          )
        )
      `,
      )
      .eq("id", id)
      .eq("userId", session.user.id)
      .single();

    if (error || !clothing) {
      return NextResponse.json(
        { error: "Clothing not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(clothing);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch clothing" },
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

    const { id } = await params;
    const body = await req.json();

    const result = clothesPutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;
    const supabase = getSupabaseServer();
    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    // Basic fields
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.brand !== undefined) updatePayload.brand = data.brand || null;
    if (data.price !== undefined)
      updatePayload.price =
        data.price != null ? parseFloat(String(data.price)) : null;
    if (data.purchaseDate !== undefined)
      updatePayload.purchaseDate = data.purchaseDate || null;
    if (data.colors !== undefined) updatePayload.colors = data.colors || [];
    if (data.placesToWear !== undefined)
      updatePayload.placesToWear = data.placesToWear || [];
    if (data.season !== undefined) updatePayload.season = data.season || [];
    if (data.size !== undefined) updatePayload.size = data.size || null;
    if (data.link !== undefined) updatePayload.link = data.link || null;
    if (data.imageUrl !== undefined)
      updatePayload.imageUrl = data.imageUrl || null;

    // New fields
    if (data.materials !== undefined)
      updatePayload.materials = data.materials || null;
    if (data.careInstructions !== undefined)
      updatePayload.careInstructions = data.careInstructions || null;
    if (data.sustainability !== undefined)
      updatePayload.sustainability = data.sustainability || null;
    if (data.condition !== undefined)
      updatePayload.condition = data.condition || "excellent";
    if (data.tags !== undefined) updatePayload.tags = data.tags || [];
    if (data.silhouette !== undefined)
      updatePayload.silhouette = data.silhouette || null;
    if (data.style !== undefined) updatePayload.style = data.style || null;
    if (data.neckline !== undefined)
      updatePayload.neckline = data.neckline || null;
    if (data.pattern !== undefined)
      updatePayload.pattern = data.pattern || null;
    if (data.length !== undefined) updatePayload.length = data.length || null;
    if (data.fit !== undefined) updatePayload.fit = data.fit || null;
    if (data.purchaseLocation !== undefined)
      updatePayload.purchaseLocation = data.purchaseLocation || null;
    if (data.originalPrice !== undefined)
      updatePayload.originalPrice =
        data.originalPrice != null
          ? parseFloat(String(data.originalPrice))
          : null;
    if (data.purchaseType !== undefined)
      updatePayload.purchaseType = data.purchaseType || null;
    if (data.purchaseCurrency !== undefined)
      updatePayload.purchaseCurrency = data.purchaseCurrency || "CAD";
    if (data.description !== undefined)
      updatePayload.description = data.description || null;
    if (data.status !== undefined)
      updatePayload.status = data.status || "owned";

    const { data: updatedClothing, error } = await supabase
      .from("Clothes")
      .update(updatePayload)
      .eq("id", id)
      .eq("userId", session.user.id)
      .select();

    if (error || !updatedClothing || updatedClothing.length === 0) {
      return NextResponse.json(
        { error: "Clothing not found or unauthorized" },
        { status: 404 },
      );
    }

    if (data.wardrobeIds !== undefined) {
      await supabase.from("WardrobeClothes").delete().eq("clothesId", id);
      if (data.wardrobeIds && data.wardrobeIds.length > 0) {
        const wardrobeEntries = data.wardrobeIds.map((wardrobeId: string) => ({
          wardrobeId,
          clothesId: id,
        }));

        await supabase.from("WardrobeClothes").insert(wardrobeEntries);
      }
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
      .eq("id", id)
      .single();

    // Invalidate caches — price/category/wear data affects analytics
    await cacheDel(
      analyticsKey(session.user.id),
      ownedClothesKey(session.user.id),
    );

    return NextResponse.json(clothingWithWardrobes || updatedClothing[0]);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update clothing" },
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

    const { id } = await params;
    const supabase = getSupabaseServer();

    await supabase.from("WardrobeClothes").delete().eq("clothesId", id);
    await supabase.from("OutfitClothes").delete().eq("clothesId", id);

    const { data: deletedClothing, error } = await supabase
      .from("Clothes")
      .delete()
      .eq("id", id)
      .eq("userId", session.user.id)
      .select();

    if (error || !deletedClothing || deletedClothing.length === 0) {
      return NextResponse.json(
        { error: "Clothing not found or unauthorized" },
        { status: 404 },
      );
    }

    await cacheDel(
      analyticsKey(session.user.id),
      ownedClothesKey(session.user.id),
    );

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete clothing" },
      { status: 500 },
    );
  }
}
