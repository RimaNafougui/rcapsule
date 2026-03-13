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
  },
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="mb-20">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] mb-8">
          Fashion is Chaos. <br /> We bring Order.
        </h1>
        <p className="text-xl md:text-2xl font-light text-default-600 max-w-3xl">
          We believe a great wardrobe isn't about having more clothes—it's about
          knowing exactly what you have, where it is, and how to wear it.
        </p>
      </section>

      <Divider className="my-12" />

      {/* The Problem */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-default-400 mb-4">
            The Reality
          </h2>
          <div className="text-8xl font-black text-foreground mb-2">20%</div>
          <p className="text-lg font-medium">
            The average person wears only 20% of their closet 80% of the time.
          </p>
        </div>
        <div className="text-default-500 leading-relaxed space-y-4">
          <p>
            Clothes get buried in drawers, tags get forgotten, and impulse buys
            pile up in the back of the closet. We end up buying duplicates
            because we can't see what we already own.
          </p>
          <p>
            We built this tool to shift the paradigm from "consumption" to
            "curation." By digitizing your collection, you regain control over
            your style and your spending.
          </p>
        </div>
      </section>

      {/* The Mission */}
      <section className="bg-content2 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">
          Our Philosophy
        </h2>
        <p className="max-w-2xl mx-auto text-default-600 mb-8">
          Buy less, choose well, and make it last. We provide the data layer for
          your physical life.
        </p>
      </section>
    </div>
  );
}
