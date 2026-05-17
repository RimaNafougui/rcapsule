import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";

import { Providers } from "./providers";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { fontSans, fontDisplay, fontMono } from "@/lib/config/fonts";
import ScrollToTop from "@/components/ui/ScrollToTop";

// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://rcapsule.com"),
  title: {
    default: "Rcapsule",
    template: `%s | Rcapsule`,
  },
  description:
    "Rcapsule is a wardrobe management and fashion community. Catalogue your clothes, build outfits, track wear, and discover looks from real people.",
  icons: {
    icon: [
      {
        url: "/rcapsuleFavicon/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/rcapsuleFavicon/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/rcapsuleFavicon/apple-touch-icon.png",
    other: [{ rel: "manifest", url: "/manifest.json" }],
  },
  openGraph: {
    title: "Rcapsule",
    description:
      "Rcapsule is a wardrobe management and fashion community. Catalogue your clothes, build outfits, track wear, and discover looks from real people.",
    url: "https://rcapsule.com",
    siteName: "Rcapsule",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rcapsule — Your digital wardrobe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rcapsule",
    description:
      "Rcapsule is a wardrobe management and fashion community. Catalogue your clothes, build outfits, track wear, and discover looks from real people.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://rcapsule.com",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://rcapsule.com/#website",
      url: "https://rcapsule.com",
      name: "Rcapsule",
      description: "Organize your wardrobe and plan outfits with ease.",
    },
    {
      "@type": "Organization",
      "@id": "https://rcapsule.com/#organization",
      name: "Rcapsule",
      url: "https://rcapsule.com",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script
          async
          defer
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        />
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
      </head>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          fontSans.variable,
          fontDisplay.variable,
          fontMono.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 w-full">
              {children}
              <Toaster richColors position="top-right" />
              <Analytics />
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
