import { Metadata } from "next";
import { Divider } from "@heroui/react";

export const metadata: Metadata = {
  title: "About",
  description:
    "We believe a great wardrobe isn't about having more clothes — it's about knowing exactly what you have, where it is, and how to wear it.",
  openGraph: {
    title: "About | Rcapsule",
    description:
      "We believe a great wardrobe isn't about having more clothes — it's about knowing exactly what you have, where it is, and how to wear it.",
    url: "https://rcapsule.com/about",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "About Rcapsule",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Rcapsule",
    description:
      "We believe a great wardrobe isn't about having more clothes — it's about knowing exactly what you have, where it is, and how to wear it.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://rcapsule.com/about" },
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="mb-20">
        <h1 className="font-display font-light text-[clamp(32px,6vw,80px)] tracking-tight leading-none mb-8">
          Fashion is Chaos. <br /> We bring Order.
        </h1>
        <p className="text-xl md:text-2xl font-light text-stone max-w-3xl">
          We believe a great wardrobe isn&apos;t about having more
          clothes—it&apos;s about knowing exactly what you have, where it is,
          and how to wear it.
        </p>
      </section>

      <Divider className="my-12" />

      {/* The Problem */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="eyebrow text-stone mb-4">The Reality</h2>
          <div className="font-display font-light text-[clamp(56px,8vw,96px)] tracking-tight leading-none mb-2">
            <span className="num">20%</span>
          </div>
          <p className="text-lg font-medium">
            The average person wears only 20% of their closet 80% of the time.
          </p>
        </div>
        <div className="text-stone leading-relaxed space-y-4">
          <p>
            Clothes get buried in drawers, tags get forgotten, and impulse buys
            pile up in the back of the closet. We end up buying duplicates
            because we can&apos;t see what we already own.
          </p>
          <p>
            We built this tool to shift the paradigm from
            &quot;consumption&quot; to &quot;curation.&quot; By digitizing your
            collection, you regain control over your style and your spending.
          </p>
        </div>
      </section>

      {/* The Mission */}
      <section className="bg-soft border border-default-200 p-8 md:p-12 text-center">
        <h2 className="font-display font-light text-2xl md:text-3xl tracking-tight mb-4">
          Our Philosophy
        </h2>
        <p className="max-w-2xl mx-auto text-stone mb-8">
          Buy less, choose well, and make it last. We provide the data layer for
          your physical life.
        </p>
      </section>
    </div>
  );
}
