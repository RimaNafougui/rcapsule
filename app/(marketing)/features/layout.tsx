import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Auto-import from any store, smart taxonomy, color analysis, cost-per-wear tracking, and AI-powered outfit planning — all in one wardrobe app.",
  openGraph: {
    title: "Features | Rcapsule",
    description:
      "Auto-import from any store, smart taxonomy, color analysis, cost-per-wear tracking, and AI-powered outfit planning — all in one wardrobe app.",
    url: "https://rcapsule.com/features",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rcapsule Features" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | Rcapsule",
    description:
      "Auto-import from any store, smart taxonomy, color analysis, cost-per-wear tracking, and AI-powered outfit planning — all in one wardrobe app.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/features" },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
