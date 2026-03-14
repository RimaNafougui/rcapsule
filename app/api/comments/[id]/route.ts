import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

const editSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { id } = await params;
    const body = await req.json();
    const result = editSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    // Verify ownership
    const { data: comment } = await supabase
      .from("Comment")
      .select("userId")
      .eq("id", id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("Comment")
      .update({
        content: result.data.content,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        id,
        content,
        "parentId",
        "likeCount",
        "isEdited",
        "createdAt",
        author:User!userId(id, username, name, image, "isVerified")
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { id } = await params;
    const supabase = getSupabaseServer();

    // Verify ownership
    const { data: comment } = await supabase
      .from("Comment")
      .select("userId")
      .eq("id", id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("Comment").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}
