import { Metadata } from "next";

import { getSupabaseServer } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = getSupabaseServer();

  const { data: user } = await supabase
    .from("User")
    .select(
      `
      username,
      name,
      bio,
      image,
      "coverImage",
      "profilePublic",
      "followerCount",
      "styleTags"
    `,
    )
    .eq("username", username)
    .eq("profilePublic", true)
    .single();

  if (!user) {
    return {
      title: "Profile Not Found | Rcapsule",
      description: "This profile doesn't exist or is private.",
    };
  }

  const displayName = user.name || `@${user.username}`;
  const title = `${displayName} | Rcapsule`;
  const description =
    user.bio ||
    `Check out ${displayName}'s wardrobe and outfit inspiration on Rcapsule.`;

  const ogImage = user.coverImage || user.image || "/og-default.png";

  return {
    title,
    description,
    keywords: [
      "wardrobe",
      "fashion",
      "style",
      "outfits",
      ...(user.styleTags || []),
    ],
    authors: [{ name: displayName }],
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://rcapsule.com/u/${username}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${displayName}'s profile`,
        },
      ],
      siteName: "Rcapsule",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: `@${username}`,
    },
    alternates: {
      canonical: `https://rcapsule.com/u/${username}`,
    },
  };
}

export default function PublicProfileLayout({ children }: Props) {
  return <>{children}</>;
}
