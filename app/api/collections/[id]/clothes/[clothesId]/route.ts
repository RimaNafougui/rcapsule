// app/api/collections/[id]/clothes/[clothesId]/route.ts
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; clothesId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: wardrobeId, clothesId } = await params;
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

    const { error } = await supabase
      .from("WardrobeClothes")
      .delete()
      .eq("wardrobeId", wardrobeId)
      .eq("clothesId", clothesId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing clothes from wardrobe:", error);

    return NextResponse.json(
      { error: "Failed to remove clothes" },
      { status: 500 },
    );
  }
}
