"use client";

import { motion } from "framer-motion";
import {
  SparklesIcon,
  TagIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  SwatchIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/card";
import { DSButton } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/components/ui/motion";

const features = [
  {
    title: "Auto-Import",
    desc: "Paste a product link from your favorite store. We scrape the image, brand, and price automatically.",
    icon: CloudArrowDownIcon,
  },
  {
    title: "Smart Taxonomy",
    desc: "Organize by Category, Season, and Occasion. Filter your entire wardrobe in milliseconds.",
    icon: TagIcon,
  },
  {
    title: "Color Analysis",
    desc: "Visualize your color palette. See which shades dominate your style and identify gaps.",
    icon: SwatchIcon,
  },
  {
    title: "Cost Per Wear",
    desc: "Track purchase dates and usage (coming soon) to understand the real value of your investments.",
    icon: ChartBarIcon,
  },
  {
    title: "Digital Styling",
    desc: "Plan outfits from your phone. No more digging through piles of clothes on the floor.",
    icon: DevicePhoneMobileIcon,
  },
  {
    title: "Wishlist Integration",
    desc: "Keep track of items you own vs. items you covet in one unified interface.",
    icon: SparklesIcon,
  },
];

export default function FeaturesPage() {
  return (
    <Container className="py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-2">
          The Operating System <br /> For Your Closet
        </h1>
        <p className="text-default-500 uppercase tracking-widest text-sm">
          Built for the modern collector
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        initial="hidden"
        variants={staggerContainer}
        viewport={{ once: true }}
        whileInView="visible"
      >
        {features.map((f, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <FeatureCard
              className="h-full"
              description={f.desc}
              icon={<f.icon className="w-8 h-8 text-foreground stroke-1" />}
              title={f.title}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center">
        <DSButton as={Link} href="/signup" size="lg" variant="primary">
          Start Digitizing
        </DSButton>
      </div>
    </Container>
  );
}
