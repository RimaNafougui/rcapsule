import { Metadata } from "next";

import { getSupabaseServer } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ username: string; id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, id } = await params;
  const supabase = getSupabaseServer();

  const { data: user } = await supabase
    .from("User")
    .select("id, name, username, profilePublic")
    .eq("username", username)
    .single();

  if (!user || !user.profilePublic) {
    return {
      title: "Look Not Found | Rcapsule",
      description: "This outfit doesn't exist or the profile is private.",
    };
  }

  const { data: outfit } = await supabase
    .from("Outfit")
    .select(`id, name, "imageUrl", season, occasion, "styleTags"`)
    .eq("id", id)
    .eq("userId", user.id)
    .single();

  if (!outfit) {
    return {
      title: "Look Not Found | Rcapsule",
      description: "This outfit doesn't exist or the profile is private.",
    };
  }

  const displayName = user.name || `@${user.username}`;
  const title = `${outfit.name} by ${displayName}`;
  const description = [outfit.occasion, outfit.season]
    .filter(Boolean)
    .join(" · ")
    .concat(` — outfit by ${displayName} on Rcapsule`);

  const ogImage = outfit.imageUrl || "/opengraph-image";
  const url = `https://rcapsule.com/u/${username}/looks/${id}`;

  return {
    title,
    description,
    keywords: ["outfit", "fashion", "style", ...(outfit.styleTags || [])],
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: outfit.name }],
      siteName: "Rcapsule",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: `@${username}`,
    },
    alternates: { canonical: url },
  };
}

export default function LookLayout({ children }: Props) {
  return <>{children}</>;
}
