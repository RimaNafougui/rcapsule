import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Explore outfits and style inspiration from the Rcapsule community. See what people are wearing, trending looks, and follow your favorite stylists.",
  openGraph: {
    title: "Discover | Rcapsule",
    description:
      "Explore outfits and style inspiration from the Rcapsule community. See what people are wearing, trending looks, and follow your favorite stylists.",
    url: "https://rcapsule.com/discover",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Discover on Rcapsule",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover | Rcapsule",
    description:
      "Explore outfits and style inspiration from the Rcapsule community. See what people are wearing, trending looks, and follow your favorite stylists.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/discover" },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
