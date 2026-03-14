import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

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
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("Notification")
      .update({ isRead: true })
      .eq("id", id)
      .eq("userId", session.user.id); // ownership check

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
