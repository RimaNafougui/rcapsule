import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; outfitId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { success, reset } = await apiLimiter().limit(
      `user:${session.user.id}`,
    );

    if (!success) return rateLimitResponse(reset);

    const { id, outfitId } = await params;
    const supabase = getSupabaseServer();

    // Verify collection ownership
    const { data: wardrobe } = await supabase
      .from("Wardrobe")
      .select("id")
      .eq("id", id)
      .eq("userId", session.user.id)
      .maybeSingle();

    if (!wardrobe)
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );

    const { error } = await supabase
      .from("WardrobeOutfit")
      .delete()
      .eq("wardrobeId", id)
      .eq("outfitId", outfitId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to remove outfit" },
      { status: 500 },
    );
  }
}
