import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function POST(req: Request) {
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

    // Check if already liked
    const { data: existing } = await supabase
      .from("Like")
      .select("id")
      .eq("userId", session.user.id)
      .eq("targetType", targetType)
      .eq("targetId", targetId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Add like
    const { error: likeError } = await supabase.from("Like").insert({
      userId: session.user.id,
      targetType,
      targetId,
    });

    if (likeError) throw likeError;

    // Increment like count
    const tableName =
      targetType === "wardrobe"
        ? "Wardrobe"
        : targetType === "outfit"
          ? "Outfit"
          : "Clothes";
    const { data: target } = await supabase
      .from(tableName)
      .select("likeCount")
      .eq("id", targetId)
      .single();

    await supabase
      .from(tableName)
      .update({ likeCount: (target?.likeCount || 0) + 1 })
      .eq("id", targetId);

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to like" }, { status: 500 });
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

    // Remove like
    const { error: deleteError } = await supabase
      .from("Like")
      .delete()
      .eq("userId", session.user.id)
      .eq("targetType", targetType)
      .eq("targetId", targetId);

    if (deleteError) throw deleteError;

    // Decrement like count
    const tableName =
      targetType === "wardrobe"
        ? "Wardrobe"
        : targetType === "outfit"
          ? "Outfit"
          : "Clothes";
    const { data: target } = await supabase
      .from(tableName)
      .select("likeCount")
      .eq("id", targetId)
      .single();

    await supabase
      .from(tableName)
      .update({ likeCount: Math.max(0, (target?.likeCount || 0) - 1) })
      .eq("id", targetId);

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
  }
}
