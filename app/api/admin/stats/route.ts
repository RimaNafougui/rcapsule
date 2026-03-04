import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(_req: Request) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  try {
    const supabase = getSupabaseServer();

    const [
      { count: totalUsers },
      { count: totalItems },
      { count: catalogSize },
      { count: pendingReports },
    ] = await Promise.all([
      supabase.from("User").select("*", { count: "exact", head: true }),
      supabase.from("Clothes").select("*", { count: "exact", head: true }),
      supabase
        .from("GlobalProduct")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("Report")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    // Top 5 brands by item count
    const { data: brandRows } = await supabase
      .from("Clothes")
      .select("brand")
      .not("brand", "is", null);

    const brandMap: Record<string, number> = {};

    for (const row of brandRows ?? []) {
      if (row.brand) {
        brandMap[row.brand] = (brandMap[row.brand] ?? 0) + 1;
      }
    }
    const topBrands = Object.entries(brandMap)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Item count by category
    const { data: categoryRows } = await supabase
      .from("Clothes")
      .select("category")
      .not("category", "is", null);

    const categoryMap: Record<string, number> = {};

    for (const row of categoryRows ?? []) {
      if (row.category) {
        categoryMap[row.category] = (categoryMap[row.category] ?? 0) + 1;
      }
    }
    const itemsByCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Daily signups for last 30 days
    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: signupRows } = await supabase
      .from("User")
      .select("createdAt")
      .gte("createdAt", thirtyDaysAgo.toISOString());

    const signupMap: Record<string, number> = {};

    for (const row of signupRows ?? []) {
      const day = row.createdAt?.slice(0, 10);

      if (day) {
        signupMap[day] = (signupMap[day] ?? 0) + 1;
      }
    }
    const signupTrend = Object.entries(signupMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalItems: totalItems ?? 0,
      catalogSize: catalogSize ?? 0,
      pendingReports: pendingReports ?? 0,
      signupTrend,
      topBrands,
      itemsByCategory,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
