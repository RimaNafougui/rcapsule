import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Browse thousands of curated clothing items from top brands. Add pieces directly to your wardrobe and track cost-per-wear.",
  openGraph: {
    title: "Catalogue | Rcapsule",
    description:
      "Browse thousands of curated clothing items from top brands. Add pieces directly to your wardrobe and track cost-per-wear.",
    url: "https://rcapsule.com/catalogue",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rcapsule Catalogue" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalogue | Rcapsule",
    description:
      "Browse thousands of curated clothing items from top brands. Add pieces directly to your wardrobe and track cost-per-wear.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/catalogue" },
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
