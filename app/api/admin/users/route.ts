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
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const subscription = searchParams.get("subscription") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("User")
      .select(
        "id, name, email, image, role, subscription_status, isVerified, isFeatured, createdAt, followerCount",
        { count: "exact" },
      )
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (subscription) {
      query = query.eq("subscription_status", subscription);
    }

    const { data: users, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      users: users ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
