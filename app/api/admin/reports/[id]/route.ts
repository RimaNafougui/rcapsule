import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["reviewed", "resolved", "dismissed"];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "status must be one of: reviewed, resolved, dismissed" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("Report")
      .update({
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating report:", error);

    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 },
    );
  }
}
