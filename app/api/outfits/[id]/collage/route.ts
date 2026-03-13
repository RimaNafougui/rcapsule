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

    // Fetch outfit with all clothes
    const { data: outfit, error } = await supabase
      .from("Outfit")
      .select(
        `
        *,
        OutfitClothes (
          id,
          layer,
          clothes:Clothes (
            id,
            name,
            imageUrl
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

    // Extract and sort clothing items by layer
    const clothes = (outfit.OutfitClothes || [])
      .sort((a: any, b: any) => (a.layer || 0) - (b.layer || 0))
      .map((oc: any) => ({
        id: oc.clothes.id,
        name: oc.clothes.name,
        url: oc.clothes.imageUrl,
        layer: oc.layer,
      }))
      .filter((item: any) => item.url); // Only include items with images

    if (clothes.length === 0) {
      return NextResponse.json(
        { error: "No images found in outfit" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      outfitId: id,
      outfitName: outfit.name,
      clothes: clothes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch outfit data" },
      { status: 500 },
    );
  }
}
