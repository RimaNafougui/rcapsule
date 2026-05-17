import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start for free with unlimited uploads and outfit planning. Upgrade to Rcapsule Premium for AI outfit generation, background removal, and weather-smart suggestions.",
  openGraph: {
    title: "Pricing | Rcapsule",
    description:
      "Start for free with unlimited uploads and outfit planning. Upgrade to Rcapsule Premium for AI outfit generation, background removal, and weather-smart suggestions.",
    url: "https://rcapsule.com/pricing",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rcapsule Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Rcapsule",
    description:
      "Start for free with unlimited uploads and outfit planning. Upgrade to Rcapsule Premium for AI outfit generation, background removal, and weather-smart suggestions.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/pricing" },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
