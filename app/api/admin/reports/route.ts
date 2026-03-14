import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("Report")
      .select(
        `
        id,
        reporterId,
        targetType,
        targetId,
        reason,
        description,
        status,
        reviewedBy,
        reviewedAt,
        createdAt,
        reporter:User!Report_reporterId_fkey(id, name, email, image)
      `,
        { count: "exact" },
      )
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    } else {
      // Default: pending first
      query = query.order("status", { ascending: true });
    }

    const { data: reports, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      reports: reports ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
