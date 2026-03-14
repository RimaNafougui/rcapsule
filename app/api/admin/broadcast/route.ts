import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { heavyLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await heavyLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  try {
    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    // Fetch all user IDs
    const { data: users, error: usersError } = await supabase
      .from("User")
      .select("id");

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // Build notification rows
    const notifications = users.map((u) => ({
      userId: u.id,
      type: "system",
      actorId: session.user.id,
      message: `${title}: ${message}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase.from("Notification").insert(batch);

      if (error) throw error;
      inserted += batch.length;
    }

    return NextResponse.json({ sent: inserted });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 },
    );
  }
}
