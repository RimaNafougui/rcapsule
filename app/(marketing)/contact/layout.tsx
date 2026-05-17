import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a feature request, found a bug, or just want to say hi? Get in touch with the Rcapsule team.",
  openGraph: {
    title: "Contact | Rcapsule",
    description:
      "Have a feature request, found a bug, or just want to say hi? Get in touch with the Rcapsule team.",
    url: "https://rcapsule.com/contact",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Contact Rcapsule" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | Rcapsule",
    description:
      "Have a feature request, found a bug, or just want to say hi? Get in touch with the Rcapsule team.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
