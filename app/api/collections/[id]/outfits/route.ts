import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { outfitIds } = await req.json();

    if (!Array.isArray(outfitIds) || outfitIds.length === 0)
      return NextResponse.json({ error: "outfitIds required" }, { status: 400 });

    const supabase = getSupabaseServer();

    // Verify collection ownership
    const { data: wardrobe } = await supabase
      .from("Wardrobe")
      .select("id")
      .eq("id", id)
      .eq("userId", session.user.id)
      .maybeSingle();

    if (!wardrobe)
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });

    // Verify all outfits belong to the user
    const { data: outfits } = await supabase
      .from("Outfit")
      .select("id")
      .in("id", outfitIds)
      .eq("userId", session.user.id);

    const validIds = (outfits || []).map((o) => o.id);

    if (validIds.length === 0)
      return NextResponse.json({ error: "No valid outfits" }, { status: 400 });

    const rows = validIds.map((outfitId) => ({ wardrobeId: id, outfitId }));

    const { error } = await supabase
      .from("WardrobeOutfit")
      .upsert(rows, { onConflict: "wardrobeId,outfitId", ignoreDuplicates: true });

    if (error) throw error;

    return NextResponse.json({ added: validIds.length });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Failed to add outfits" }, { status: 500 });
  }
}
