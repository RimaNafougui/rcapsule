import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start for free with unlimited uploads and outfit planning. Upgrade to Rcapsule Premium for AI outfit generation, background removal, and weather-smart suggestions.",
  openGraph: {
    title: "Pricing | Rcapsule",
    description:
      "Start for free with unlimited uploads and outfit planning. Upgrade to Rcapsule Premium for AI outfit generation, background removal, and weather-smart suggestions.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
