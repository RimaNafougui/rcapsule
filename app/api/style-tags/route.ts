import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { publicLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const identifier = getIdentifier(req);
  const { success, reset } = await publicLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const supabase = getSupabaseServer();

    const { data: tags, error } = await supabase
      .from("StyleTag")
      .select("id, name, slug, category, usageCount")
      .order("usageCount", { ascending: false });

    if (error) throw error;

    // Group by category
    const grouped: Record<string, typeof tags> = {};

    for (const tag of tags || []) {
      const cat = tag.category || "other";

      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(tag);
    }

    return NextResponse.json({ tags: tags || [], grouped });
  } catch (error) {
    console.error("Error fetching style tags:", error);

    return NextResponse.json({ error: "Failed to fetch style tags" }, { status: 500 });
  }
}
