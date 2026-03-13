import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { publicLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; id: string }> },
) {
  const identifier = getIdentifier(req);
  const { success, reset } = await publicLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { username, id } = await params;
    const session = await auth();
    const supabase = getSupabaseServer();

    // Look up user by username
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, username, name, image, bio, followerCount, isVerified, profilePublic")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwnProfile = session?.user?.id === user.id;

    if (!user.profilePublic && !isOwnProfile) {
      return NextResponse.json({ error: "Profile is private" }, { status: 404 });
    }

    // Fetch outfit by id or slug, verify ownership
    const { data: outfit, error: outfitError } = await supabase
      .from("Outfit")
      .select(`
        id,
        name,
        "imageUrl",
        slug,
        season,
        occasion,
        "styleTags",
        "likeCount",
        "saveCount",
        "viewCount",
        rating,
        "allowComments",
        "isPublic",
        "createdAt",
        userId,
        clothes:OutfitClothes(
          id,
          clothesId,
          layer,
          clothes:Clothes(id, name, brand, category, "imageUrl", price, "purchaseCurrency", colors)
        )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .eq("userId", user.id)
      .single();

    if (outfitError || !outfit) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    if (!outfit.isPublic && !isOwnProfile) {
      return NextResponse.json({ error: "Outfit is private" }, { status: 404 });
    }

    // Increment view count (fire and forget)
    supabase
      .from("Outfit")
      .update({ viewCount: (outfit.viewCount || 0) + 1 })
      .eq("id", outfit.id)
      .then(() => {});

    // Check if current user has liked/saved this outfit
    let isLiked = false;
    let isSaved = false;
    let isFollowing = false;

    if (session?.user?.id && session.user.id !== user.id) {
      const [likeResult, saveResult, followResult] = await Promise.all([
        supabase
          .from("Like")
          .select("id")
          .eq("userId", session.user.id)
          .eq("targetType", "outfit")
          .eq("targetId", outfit.id)
          .single(),
        supabase
          .from("Save")
          .select("id")
          .eq("userId", session.user.id)
          .eq("targetType", "outfit")
          .eq("targetId", outfit.id)
          .single(),
        supabase
          .from("Follow")
          .select("id")
          .eq("followerId", session.user.id)
          .eq("followingId", user.id)
          .single(),
      ]);

      isLiked = !!likeResult.data;
      isSaved = !!saveResult.data;
      isFollowing = !!followResult.data;
    }

    return NextResponse.json({
      outfit: {
        ...outfit,
        viewCount: (outfit.viewCount || 0) + 1,
      },
      author: {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        bio: user.bio,
        followerCount: user.followerCount,
        isVerified: user.isVerified,
      },
      isLiked,
      isSaved,
      isFollowing,
      isOwnProfile,
    });
  } catch (error) {
    console.error("Error fetching look:", error);

    return NextResponse.json({ error: "Failed to fetch look" }, { status: 500 });
  }
}
