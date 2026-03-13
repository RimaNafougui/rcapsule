import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a feature request, found a bug, or just want to say hi? Get in touch with the Rcapsule team.",
  openGraph: {
    title: "Contact | Rcapsule",
    description:
      "Have a feature request, found a bug, or just want to say hi? Get in touch with the Rcapsule team.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
