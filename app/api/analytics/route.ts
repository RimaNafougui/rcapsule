// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { cacheGet, cacheSet, analyticsKey, ANALYTICS_TTL } from "@/lib/redis";

interface ClothesItem {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  category: string;
  price?: number;
  originalPrice?: number;
  colors?: string[];
  season?: string[];
  style?: string;
  condition?: string;
  purchaseType?: string;
  purchaseDate?: string;
  timesworn?: number;
  createdAt: string;
  sustainability?: string;
  [key: string]: any;
}

interface Outfit {
  id: string;
  timesWorn?: number;
  [key: string]: any;
}

interface WearLog {
  id: string;
  [key: string]: any;
}

export async function GET(_req: Request) {
  return await Sentry.startSpan(
    { op: "analytics.calculate", name: "Calculate Wardrobe Analytics" },
    async (span) => {
      try {
        const session = await auth();

        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // ── Cache check ──────────────────────────────────────────────────
        const cached = await cacheGet<ReturnType<typeof calculateAnalytics>>(
          analyticsKey(userId),
        );

        if (cached) {
          span?.setAttribute("cache", "hit");

          return NextResponse.json(cached);
        }

        span?.setAttribute("cache", "miss");

        const supabase = getSupabaseServer();

        // Fetch only the columns required by calculateAnalytics to reduce
        // data transfer and serialization overhead.
        const [clothesRes, outfitsRes, wearLogsRes] = await Promise.all([
          supabase
            .from("Clothes")
            .select(
              "id,name,brand,category,price,colors,season,style,condition,purchaseType,purchaseDate,timesworn,sustainability",
            )
            .eq("userId", userId)
            .or("status.eq.owned,status.is.null"),
          supabase.from("Outfit").select("id,timesWorn").eq("userId", userId),
          supabase.from("WearLog").select("id").eq("userId", userId),
        ]);

        const clothes = (clothesRes.data || []) as ClothesItem[];
        const outfits = (outfitsRes.data || []) as Outfit[];
        const wearLogs = (wearLogsRes.data || []) as WearLog[];

        // Calculate comprehensive analytics
        const analytics = calculateAnalytics(clothes, outfits, wearLogs);

        // Persist to cache – non-fatal on failure
        await cacheSet(analyticsKey(userId), analytics, ANALYTICS_TTL);

        span?.setAttribute("total_items", clothes.length);
        span?.setAttribute("total_outfits", outfits.length);

        return NextResponse.json(analytics);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { api_route: "/api/analytics", method: "GET" },
        });

        return NextResponse.json(
          { error: "Failed to calculate analytics" },
          { status: 500 },
        );
      }
    },
  );
}

function calculateAnalytics(
  clothes: ClothesItem[],
  outfits: Outfit[],
  _wearLogs: WearLog[],
) {
  // 1. FINANCIAL METRICS
  const totalValue = clothes.reduce((sum, item) => sum + (item.price || 0), 0);
  const avgPrice = clothes.length > 0 ? totalValue / clothes.length : 0;
  const totalOriginalValue = clothes.reduce(
    (sum, item) => sum + (item.originalPrice || item.price || 0),
    0,
  );
  const savings = totalOriginalValue - totalValue;

  // 2. WEAR ANALYTICS
  const totalWears = clothes.reduce(
    (sum, item) => sum + (item.timesworn || 0),
    0,
  );
  const avgWearsPerItem = clothes.length > 0 ? totalWears / clothes.length : 0;

  // Cost per wear
  const itemsWithCPW = clothes
    .filter((item) => item.price && item.timesworn && item.timesworn > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price!,
      timesworn: item.timesworn!,
      costPerWear: item.price! / item.timesworn!,
    }))
    .sort((a, b) => a.costPerWear - b.costPerWear);

  const avgCostPerWear =
    itemsWithCPW.length > 0
      ? itemsWithCPW.reduce((sum, item) => sum + item.costPerWear, 0) /
        itemsWithCPW.length
      : 0;

  const bestValueItems = itemsWithCPW.slice(0, 5);
  const worstValueItems = itemsWithCPW.slice(-5).reverse();

  // 3. CATEGORY BREAKDOWN
  const categoryBreakdown: Record<
    string,
    { count: number; value: number; wears: number }
  > = {};

  clothes.forEach((item) => {
    const cat = item.category || "Uncategorized";

    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { count: 0, value: 0, wears: 0 };
    }
    categoryBreakdown[cat].count++;
    categoryBreakdown[cat].value += item.price || 0;
    categoryBreakdown[cat].wears += item.timesworn || 0;
  });

  const categories = Object.entries(categoryBreakdown)
    .map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      wears: data.wears,
      avgPrice: data.count > 0 ? data.value / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. COLOR ANALYSIS
  const colorCounts: Record<string, number> = {};

  clothes.forEach((item) => {
    if (Array.isArray(item.colors)) {
      item.colors.forEach((color: string) => {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });
    }
  });

  const topColors = Object.entries(colorCounts)
    .map(([color, count]) => ({
      color,
      count,
      percentage:
        clothes.length > 0 ? Math.round((count / clothes.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 5. BRAND ANALYSIS
  const brandBreakdown: Record<string, { count: number; value: number }> = {};

  clothes.forEach((item) => {
    if (item.brand) {
      if (!brandBreakdown[item.brand]) {
        brandBreakdown[item.brand] = { count: 0, value: 0 };
      }
      brandBreakdown[item.brand].count++;
      brandBreakdown[item.brand].value += item.price || 0;
    }
  });

  const topBrands = Object.entries(brandBreakdown)
    .map(([name, data]) => ({ name, count: data.count, value: data.value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 6. UNDERUTILIZED ITEMS
  const underutilizedItems = clothes
    .filter((item) => {
      if (!item.purchaseDate) return false;
      const purchaseDate = new Date(item.purchaseDate);
      const daysSincePurchase = Math.floor(
        (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return daysSincePurchase > 30 && (item.timesworn || 0) < 3;
    })
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      timesworn: item.timesworn || 0,
    }));

  // 7. SEASON DISTRIBUTION
  const seasonDistribution: Record<string, number> = {};

  clothes.forEach((item) => {
    if (Array.isArray(item.season)) {
      item.season.forEach((s: string) => {
        seasonDistribution[s] = (seasonDistribution[s] || 0) + 1;
      });
    }
  });

  // 8. STYLE BREAKDOWN
  const styleDistribution: Record<string, number> = {};

  clothes.forEach((item) => {
    if (item.style) {
      styleDistribution[item.style] = (styleDistribution[item.style] || 0) + 1;
    }
  });

  // 9. CONDITION ANALYSIS
  const conditionBreakdown: Record<string, number> = {};

  clothes.forEach((item) => {
    const condition = item.condition || "excellent";

    conditionBreakdown[condition] = (conditionBreakdown[condition] || 0) + 1;
  });

  // 10. PURCHASE TYPE ANALYSIS
  const purchaseTypeBreakdown: Record<string, number> = {};

  clothes.forEach((item) => {
    if (item.purchaseType) {
      purchaseTypeBreakdown[item.purchaseType] =
        (purchaseTypeBreakdown[item.purchaseType] || 0) + 1;
    }
  });

  // 11. SUSTAINABILITY SCORE
  const sustainableItems = clothes.filter(
    (item) =>
      item.purchaseType === "thrift" ||
      item.purchaseType === "vintage" ||
      item.purchaseType === "secondhand" ||
      item.sustainability,
  ).length;
  const sustainabilityScore =
    clothes.length > 0
      ? Math.round((sustainableItems / clothes.length) * 100)
      : 0;

  // 12. MOST/LEAST WORN
  const mostWornItems = clothes
    .filter((item) => item.timesworn && item.timesworn > 0)
    .sort((a, b) => (b.timesworn || 0) - (a.timesworn || 0))
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      timesworn: item.timesworn,
    }));

  const neverWorn = clothes.filter(
    (item) => !item.timesworn || item.timesworn === 0,
  );

  // 13. OUTFIT INSIGHTS
  const avgOutfitWears =
    outfits.length > 0
      ? outfits.reduce((sum, o) => sum + (o.timesWorn || 0), 0) / outfits.length
      : 0;

  // 14. INSIGHTS
  const insights = generateInsights(clothes, outfits, {
    underutilizedCount: underutilizedItems.length,
    neverWornCount: neverWorn.length,
    sustainabilityScore,
    avgCostPerWear,
  });

  return {
    overview: {
      totalItems: clothes.length,
      totalOutfits: outfits.length,
      totalValue,
      avgPrice,
      savings,
      sustainabilityScore,
    },
    wear: {
      totalWears,
      avgWearsPerItem,
      avgCostPerWear,
      mostWornItems,
      neverWorn: neverWorn.length,
      neverWornItems: neverWorn.slice(0, 10).map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
      })),
    },
    value: {
      bestValueItems,
      worstValueItems,
    },
    categories,
    colors: topColors,
    brands: topBrands,
    underutilized: underutilizedItems,
    seasonDistribution,
    styleDistribution,
    conditionBreakdown,
    purchaseTypeBreakdown,
    outfits: {
      total: outfits.length,
      avgWears: avgOutfitWears,
    },
    insights,
  };
}

function generateInsights(
  clothes: ClothesItem[],
  outfits: Outfit[],
  metrics: {
    underutilizedCount: number;
    neverWornCount: number;
    sustainabilityScore: number;
    avgCostPerWear: number;
  },
) {
  const insights: Array<{
    type: string;
    category: string;
    message: string;
  }> = [];

  if (metrics.avgCostPerWear < 10 && metrics.avgCostPerWear > 0) {
    insights.push({
      type: "positive",
      category: "value",
      message: `Excellent value! Your average cost per wear is $${metrics.avgCostPerWear.toFixed(2)}`,
    });
  }

  if (metrics.sustainabilityScore > 50) {
    insights.push({
      type: "positive",
      category: "sustainability",
      message: `Great job! ${metrics.sustainabilityScore}% of your wardrobe is sustainable`,
    });
  } else if (metrics.sustainabilityScore < 20) {
    insights.push({
      type: "tip",
      category: "sustainability",
      message:
        "Consider adding more thrifted or secondhand pieces to improve sustainability",
    });
  }

  if (metrics.neverWornCount > 5) {
    insights.push({
      type: "warning",
      category: "utilization",
      message: `You have ${metrics.neverWornCount} unworn items. Try creating outfits with them!`,
    });
  }

  if (metrics.underutilizedCount > 0) {
    insights.push({
      type: "tip",
      category: "utilization",
      message: `${metrics.underutilizedCount} items haven't been worn much since purchase`,
    });
  }

  if (outfits.length < 5 && clothes.length > 20) {
    insights.push({
      type: "tip",
      category: "styling",
      message:
        "You have lots of clothes but few saved outfits. Try creating some combinations!",
    });
  }

  return insights;
}
