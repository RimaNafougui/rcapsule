// app/api/collections/[id]/clothes/route.ts
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(
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

    const { id: wardrobeId } = await params;
    const { clothesIds } = await req.json();
    const supabase = getSupabaseServer();

    const { data: wardrobe, error: wardrobeError } = await supabase
      .from("Wardrobe")
      .select("id, userId")
      .eq("id", wardrobeId)
      .single();

    if (wardrobeError || !wardrobe || wardrobe.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Wardrobe not found" },
        { status: 404 },
      );
    }

    // Add clothes to wardrobe (using upsert to avoid duplicates)
    const entries = clothesIds.map((clothesId: string) => ({
      wardrobeId,
      clothesId,
    }));

    const { data, error } = await supabase
      .from("WardrobeClothes")
      .upsert(entries, { onConflict: "wardrobeId,clothesId" })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding clothes to wardrobe:", error);

    return NextResponse.json(
      { error: "Failed to add clothes" },
      { status: 500 },
    );
  }
}
