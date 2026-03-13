import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

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

    const { data: outfit, error } = await supabase
      .from("Outfit")
      .select(
        `
        *,
        OutfitClothes (
          id,
          layer,
          clothes:Clothes (*)
        ),
        WardrobeOutfit (
          id,
          addedAt,
          notes,
          wardrobe:Wardrobe (
            id,
            title,
            coverImage
          )
        )
      `,
      )
      .eq("id", id)
      .eq("userId", session.user.id)
      .single();

    if (error || !outfit) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    // Transform data
    const clothesList = (outfit.OutfitClothes || [])
      .sort((a: any, b: any) => (a.layer || 0) - (b.layer || 0))
      .map((oc: any) => ({
        ...oc.clothes,
        outfitClothesId: oc.id,
        layer: oc.layer,
      }))
      .filter(Boolean);

    // Calculate Total Outfit Cost
    const totalValue = clothesList.reduce((sum: number, item: any) => {
      return sum + (item.price || 0);
    }, 0);

    const transformedOutfit = {
      ...outfit,
      clothes: clothesList,
      wardrobes: (outfit.WardrobeOutfit || [])
        .map((wo: any) => ({
          ...wo.wardrobe,
          wardrobeOutfitId: wo.id,
          addedAt: wo.addedAt,
          notes: wo.notes,
        }))
        .filter((w: any) => w.id),
      stats: {
        totalValue: parseFloat(totalValue.toFixed(2)),
        itemCount: clothesList.length,
      },
    };

    delete transformedOutfit.OutfitClothes;
    delete transformedOutfit.WardrobeOutfit;

    return NextResponse.json(transformedOutfit);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch outfit" },
      { status: 500 },
    );
  }
}

// ... PUT and DELETE handlers remain unchanged ...
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
    const data = await req.json();
    const supabase = getSupabaseServer();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("Outfit")
      .select("userId")
      .eq("id", id)
      .single();

    if (fetchError || !existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    // Update outfit basic info
    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined)
      updatePayload.description = data.description;
    if (data.season !== undefined) updatePayload.season = data.season;
    if (data.occasion !== undefined) updatePayload.occasion = data.occasion;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl;
    if (data.isFavorite !== undefined)
      updatePayload.isFavorite = data.isFavorite;
    if (data.timesWorn !== undefined) updatePayload.timesWorn = data.timesWorn;
    if (data.lastWornAt !== undefined)
      updatePayload.lastWornAt = data.lastWornAt;

    const { data: outfit, error: updateError } = await supabase
      .from("Outfit")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update clothes if provided
    if (data.clothesIds !== undefined) {
      // Remove existing clothes
      await supabase.from("OutfitClothes").delete().eq("outfitId", id);

      // Add new clothes
      if (data.clothesIds.length > 0) {
        const outfitClothes = data.clothesIds.map(
          (clothesId: string, index: number) => ({
            outfitId: id,
            clothesId,
            layer: index,
          }),
        );

        await supabase.from("OutfitClothes").insert(outfitClothes);
      }
    }

    // Update wardrobes if provided
    if (data.wardrobeIds !== undefined) {
      // Remove existing wardrobe associations
      await supabase.from("WardrobeOutfit").delete().eq("outfitId", id);

      // Add new wardrobe associations
      if (data.wardrobeIds.length > 0) {
        const wardrobeOutfits = data.wardrobeIds.map((wardrobeId: string) => ({
          wardrobeId,
          outfitId: id,
        }));

        await supabase.from("WardrobeOutfit").insert(wardrobeOutfits);
      }
    }

    return NextResponse.json(outfit);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update outfit" },
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("Outfit")
      .select("userId")
      .eq("id", id)
      .single();

    if (fetchError || !existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    // Delete related records
    await supabase.from("OutfitClothes").delete().eq("outfitId", id);
    await supabase.from("WardrobeOutfit").delete().eq("outfitId", id);

    // Delete outfit
    const { error: deleteError } = await supabase
      .from("Outfit")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete outfit" },
      { status: 500 },
    );
  }
}
