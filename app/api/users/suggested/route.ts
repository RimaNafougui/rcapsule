import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const session = await auth();
  const identifier = getIdentifier(req, session?.user?.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const tagsParam = searchParams.get("tags");
    const userStyleTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

    const supabase = getSupabaseServer();

    let query = supabase
      .from("User")
      .select(
        "id, username, name, image, bio, styleTags, followerCount, isVerified",
      )
      .eq("profilePublic", true)
      .not("username", "is", null)
      .order("followerCount", { ascending: false })
      .limit(8);

    // Exclude current user
    if (session?.user?.id) {
      query = query.neq("id", session.user.id);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // If style tags provided, sort by overlap count client-side (Supabase doesn't support array overlap ordering)
    let result = users || [];

    if (userStyleTags.length > 0) {
      result = result
        .map((u) => ({
          ...u,
          _overlap: (u.styleTags || []).filter((t: string) =>
            userStyleTags.includes(t),
          ).length,
        }))
        .sort((a, b) => b._overlap - a._overlap)
        .map(({ _overlap: _, ...u }) => u);
    }

    return NextResponse.json({ users: result.slice(0, 8) });
  } catch (error) {
    console.error("Error fetching suggested users:", error);

    return NextResponse.json(
      { error: "Failed to fetch suggested users" },
      { status: 500 },
    );
  }
}
