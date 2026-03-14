import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("Notification")
      .select(
        `
        id,
        type,
        "isRead",
        message,
        "targetType",
        "targetId",
        "createdAt",
        actor:User!actorId(id, username, name, image)
      `,
        { count: "exact" },
      )
      .eq("userId", session.user.id)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("isRead", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) throw error;

    // Get unread count separately
    const { count: unreadCount } = await supabase
      .from("Notification")
      .select("*", { count: "exact", head: true })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const supabase = getSupabaseServer();

    await supabase
      .from("Notification")
      .update({ isRead: true })
      .eq("userId", session.user.id)
      .eq("isRead", false);

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
