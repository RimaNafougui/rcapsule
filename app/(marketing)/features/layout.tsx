import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Auto-import from any store, smart taxonomy, color analysis, cost-per-wear tracking, and AI-powered outfit planning — all in one wardrobe app.",
  openGraph: {
    title: "Features | Rcapsule",
    description:
      "Auto-import from any store, smart taxonomy, color analysis, cost-per-wear tracking, and AI-powered outfit planning — all in one wardrobe app.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
