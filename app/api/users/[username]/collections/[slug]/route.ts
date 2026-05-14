import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  try {
    const { username, slug } = await params;
    const session = await auth();
    const supabase = getSupabaseServer();

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, username, name, image, profilePublic")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get wardrobe by slug
    const { data: wardrobe, error: wardrobeError } = await supabase
      .from("Wardrobe")
      .select(
        `
        id,
        userId,
        title,
        description,
        coverImage,
        slug,
        likeCount,
        saveCount,
        viewCount,
        isPublic,
        styleTags,
        season,
        occasion,
        createdAt,
        updatedAt
      `,
      )
      .eq("userId", user.id)
      .eq("slug", slug)
      .single();

    if (wardrobeError || !wardrobe) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const isOwnCollection = session?.user?.id === wardrobe.userId;

    // Check if collection is public
    if (!wardrobe.isPublic && !isOwnCollection) {
      return NextResponse.json(
        { error: "Collection is private" },
        { status: 403 },
      );
    }

    // Get clothes in wardrobe
    const { data: wardrobeClothes, error: clothesError } = await supabase
      .from("WardrobeClothes")
      .select(
        `
        addedAt,
        notes,
        clothes:Clothes (
          id,
          name,
          brand,
          category,
          price,
          colors,
          season,
          size,
          imageUrl,
          status,
          condition,
          timesworn,
          createdAt
        )
      `,
      )
      .eq("wardrobeId", wardrobe.id)
      .order("addedAt", { ascending: false });

    if (clothesError) {
      console.error("Error fetching clothes:", clothesError);
    }

    const clothes = (wardrobeClothes || [])
      .map((wc: any) => {
        if (!wc.clothes) return null;

        return {
          ...wc.clothes,
          addedToWardrobeAt: wc.addedAt,
          wardrobeNotes: wc.notes,
        };
      })
      .filter(Boolean);

    // Get outfits in collection
    const { data: wardrobeOutfits } = await supabase
      .from("WardrobeOutfit")
      .select(
        `
        addedAt,
        outfit:Outfit (
          id,
          name,
          imageUrl,
          occasion,
          season,
          timesWorn
        )
      `,
      )
      .eq("wardrobeId", wardrobe.id)
      .order("addedAt", { ascending: false });

    const outfits = (wardrobeOutfits || [])
      .map((wo: any) => (wo.outfit ? { ...wo.outfit, addedToCollectionAt: wo.addedAt } : null))
      .filter(Boolean);

    // Check if current user has liked/saved this collection
    let isLiked = false;
    let isSaved = false;

    if (session?.user?.id) {
      const { data: likeData } = await supabase
        .from("Like")
        .select("id")
        .eq("userId", session.user.id)
        .eq("targetType", "wardrobe")
        .eq("targetId", wardrobe.id)
        .single();

      isLiked = !!likeData;

      const { data: saveData } = await supabase
        .from("Save")
        .select("id")
        .eq("userId", session.user.id)
        .eq("targetType", "wardrobe")
        .eq("targetId", wardrobe.id)
        .single();

      isSaved = !!saveData;
    }

    // Increment view count (only if not own collection)
    if (!isOwnCollection) {
      await supabase
        .from("Wardrobe")
        .update({ viewCount: (wardrobe.viewCount || 0) + 1 })
        .eq("id", wardrobe.id);
    }

    return NextResponse.json({
      collection: {
        ...wardrobe,
        itemCount: clothes.length,
        outfitCount: outfits.length,
      },
      owner: {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
      },
      clothes,
      outfits,
      isLiked,
      isSaved,
      isOwnCollection,
    });
  } catch (error) {
    console.error("Error fetching public collection:", error);

    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
}
