import { Metadata } from "next";

import { getSupabaseServer } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ username: string; slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const supabase = getSupabaseServer();

  const { data: user } = await supabase
    .from("User")
    .select("id")
    .eq("username", username)
    .single();

  if (!user) {
    return {
      title: "Collection Not Found | Rcapsule",
      description: "This collection doesn't exist or is private.",
    };
  }

  const { data: collection } = await supabase
    .from("Wardrobe")
    .select("title, description, coverImage, styleTags")
    .eq("slug", slug)
    .eq("userId", user.id)
    .eq("isPublic", true)
    .single();

  if (!collection) {
    return {
      title: "Collection Not Found | Rcapsule",
      description: "This collection doesn't exist or is private.",
    };
  }

  const title = `${collection.title} | Rcapsule`;
  const description =
    collection.description ||
    `Explore ${collection.title} curated by @${username} on Rcapsule.`;
  const ogImage = collection.coverImage || "/og-default.png";

  return {
    title,
    description,
    keywords: [
      "wardrobe",
      "fashion",
      "style",
      "outfits",
      ...(collection.styleTags || []),
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://rcapsule.com/u/${username}/collections/${slug}`,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: collection.title },
      ],
      siteName: "Rcapsule",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://rcapsule.com/u/${username}/collections/${slug}`,
    },
  };
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
