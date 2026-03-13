// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import { siteConfig } from "@/lib/config/site";

const baseUrl = "https://rcapsule.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only public-facing marketing pages — never auth-protected routes
  const now = new Date();

  const navRoutes = siteConfig.marketingNavItems.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: item.href === "/pricing" ? 0.9 : 0.7,
  }));

  const staticRoutes = [
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/refund-policy",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "/about" || path === "/contact" ? 0.6 : 0.4,
  }));

  const baseRoutes = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ];

  // Dynamic public user profile pages and brand pages
  let profileRoutes: MetadataRoute.Sitemap = [];
  let brandRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const [usersResult, brandsResult] = await Promise.all([
      supabase
        .from("User")
        .select("username, updatedAt")
        .eq("profilePublic", true)
        .not("username", "is", null),
      supabase.from("GlobalProduct").select("brand").not("brand", "is", null),
    ]);

    profileRoutes = (usersResult.data || []).map(
      (user: { username: string; updatedAt: string }) => ({
        url: `${baseUrl}/u/${user.username}`,
        lastModified: user.updatedAt ? new Date(user.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }),
    );

    const distinctBrands = [
      ...new Set(
        (brandsResult.data || [])
          .map((p: { brand: string }) => p.brand)
          .filter(Boolean),
      ),
    ] as string[];

    brandRoutes = distinctBrands.map((brand) => ({
      url: `${baseUrl}/catalog/brand/${encodeURIComponent(brand)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // Non-fatal — sitemap still works without dynamic routes
  }

  return [
    ...baseRoutes,
    ...navRoutes,
    ...staticRoutes,
    ...profileRoutes,
    ...brandRoutes,
  ];
}
