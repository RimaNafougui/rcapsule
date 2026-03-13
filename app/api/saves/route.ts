import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId, collectionName, notes } = await req.json();

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    // Check if already saved
    const { data: existing } = await supabase
      .from("Save")
      .select("id")
      .eq("userId", session.user.id)
      .eq("targetType", targetType)
      .eq("targetId", targetId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already saved" }, { status: 400 });
    }

    // Add save
    const { error: saveError } = await supabase.from("Save").insert({
      userId: session.user.id,
      targetType,
      targetId,
      collectionName: collectionName || "Inspiration",
      notes: notes || null,
    });

    if (saveError) throw saveError;

    // Increment save count if applicable
    if (targetType === "wardrobe" || targetType === "outfit") {
      const tableName = targetType === "wardrobe" ? "Wardrobe" : "Outfit";
      const { data: target } = await supabase
        .from(tableName)
        .select("saveCount")
        .eq("id", targetId)
        .single();

      await supabase
        .from(tableName)
        .update({ saveCount: (target?.saveCount || 0) + 1 })
        .eq("id", targetId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId } = await req.json();

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    // Remove save
    const { error: deleteError } = await supabase
      .from("Save")
      .delete()
      .eq("userId", session.user.id)
      .eq("targetType", targetType)
      .eq("targetId", targetId);

    if (deleteError) throw deleteError;

    // Decrement save count if applicable
    if (targetType === "wardrobe" || targetType === "outfit") {
      const tableName = targetType === "wardrobe" ? "Wardrobe" : "Outfit";
      const { data: target } = await supabase
        .from(tableName)
        .select("saveCount")
        .eq("id", targetId)
        .single();

      await supabase
        .from(tableName)
        .update({ saveCount: Math.max(0, (target?.saveCount || 0) - 1) })
        .eq("id", targetId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to unsave" }, { status: 500 });
  }
}
