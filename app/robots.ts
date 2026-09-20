// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/settings",
        "/profile",
        "/closet",
        "/outfits",
        "/wishlist",
        "/collections",
        "/studio",
        "/checkout",
        "/notifications",
      ],
    },
    sitemap: "https://rcapsule.com/sitemap.xml",
  };
}
