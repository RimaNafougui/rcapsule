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

  // Dynamic public user profile pages
  let profileRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: users } = await supabase
      .from("User")
      .select("username, updatedAt")
      .eq("profilePublic", true)
      .not("username", "is", null);

    profileRoutes = (users || []).map(
      (user: { username: string; updatedAt: string }) => ({
        url: `${baseUrl}/u/${user.username}`,
        lastModified: user.updatedAt ? new Date(user.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }),
    );
  } catch {
    // Non-fatal — sitemap still works without profile routes
  }

  return [...baseRoutes, ...navRoutes, ...staticRoutes, ...profileRoutes];
}
