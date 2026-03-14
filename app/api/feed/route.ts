import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import {
  publicLimiter,
  apiLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { cacheGet, cacheSet } from "@/lib/redis";

const FEED_TTL = 60; // 60 seconds for trending/recent

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);

  const sort = searchParams.get("sort") || "trending"; // trending | recent | following
  const tags = searchParams.get("tags") || "";
  const season = searchParams.get("season") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
  const offset = parseInt(searchParams.get("offset") || "0");

  const isFollowingFeed = sort === "following";

  // Require auth for following feed
  if (isFollowingFeed && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session?.user?.id);
  const limiter = session?.user?.id ? apiLimiter() : publicLimiter();
  const { success, reset } = await limiter.limit(identifier);

  if (!success) return rateLimitResponse(reset);

  // Cache key for non-personalized feeds
  const cacheKey =
    !isFollowingFeed && offset === 0
      ? `feed:v1:${sort}:${tags}:${season}`
      : null;

  if (cacheKey) {
    const cached = await cacheGet<object>(cacheKey);

    if (cached) return NextResponse.json(cached);
  }

  try {
    const supabase = getSupabaseServer();

    let query = supabase
      .from("Outfit")
      .select(
        `
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
        "createdAt",
        author:User!userId(id, username, name, image, "isVerified")
      `,
      )
      .eq("isPublic", true);

    // Filter: style tags
    if (tags) {
      const tagList = tags.split(",").filter(Boolean);

      if (tagList.length > 0) {
        query = query.overlaps("styleTags", tagList);
      }
    }

    // Filter: season
    if (season) {
      query = query.eq("season", season);
    }

    // Following feed: filter by users the current user follows
    if (isFollowingFeed && session?.user?.id) {
      const { data: follows } = await supabase
        .from("Follow")
        .select("followingId")
        .eq("followerId", session.user.id);

      const followingIds = (follows || []).map((f: any) => f.followingId);

      if (followingIds.length === 0) {
        return NextResponse.json({ outfits: [], total: 0 });
      }

      query = query.in("userId", followingIds);
    }

    // Sorting
    if (sort === "trending") {
      // Trending: high likes in last 30 days
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      query = query
        .gte("createdAt", thirtyDaysAgo)
        .order("likeCount", { ascending: false })
        .order("createdAt", { ascending: false });
    } else {
      // recent or following — newest first
      query = query.order("createdAt", { ascending: false });
    }

    const {
      data: outfits,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const result = { outfits: outfits || [], total: count || 0 };

    if (cacheKey) {
      await cacheSet(cacheKey, result, FEED_TTL);
    }

    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 },
    );
  }
}
