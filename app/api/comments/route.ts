import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, publicLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

const createSchema = z.object({
  targetType: z.enum(["outfit", "wardrobe"]),
  targetId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const identifier = getIdentifier(req);
  const { success, reset } = await publicLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing targetType or targetId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: comments, error, count } = await supabase
      .from("Comment")
      .select(`
        id,
        content,
        "parentId",
        "likeCount",
        "isEdited",
        "createdAt",
        author:User!userId(id, username, name, image, "isVerified")
      `, { count: "exact" })
      .eq("targetType", targetType)
      .eq("targetId", targetId)
      .eq("isHidden", false)
      .order("createdAt", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ comments: comments || [], total: count || 0 });
  } catch (error) {
    console.error("Error fetching comments:", error);

    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const body = await req.json();
    const result = createSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { targetType, targetId, content, parentId } = result.data;
    const supabase = getSupabaseServer();

    // Verify target exists and allows comments
    const tableName = targetType === "outfit" ? "Outfit" : "Wardrobe";
    const { data: target } = await supabase
      .from(tableName)
      .select("userId, allowComments, isPublic")
      .eq("id", targetId)
      .single();

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    if (!target.allowComments) {
      return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
    }

    if (!target.isPublic && target.userId !== session.user.id) {
      return NextResponse.json({ error: "Target is private" }, { status: 403 });
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("Comment")
      .insert({
        userId: session.user.id,
        targetType,
        targetId,
        content,
        parentId: parentId || null,
      })
      .select(`
        id,
        content,
        "parentId",
        "likeCount",
        "isEdited",
        "createdAt",
        author:User!userId(id, username, name, image, "isVerified")
      `)
      .single();

    if (commentError) throw commentError;

    // Create notification for target owner (if not self-commenting)
    if (target.userId !== session.user.id) {
      const notifType = parentId ? "comment_reply" : "comment";

      await supabase.from("Notification").insert({
        userId: target.userId,
        type: notifType,
        actorId: session.user.id,
        targetType,
        targetId,
        message: null,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);

    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
