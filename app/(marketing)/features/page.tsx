"use client";

import { motion } from "framer-motion";
import {
  SparklesIcon,
  TagIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  SwatchIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/card";
import { DSButton } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/components/ui/motion";

const communityFeatures = [
  {
    title: "Discover Looks",
    desc: "Browse a curated feed of real outfits from real people. Filter by style, season, and occasion to find inspiration that fits your life.",
    icon: MagnifyingGlassIcon,
  },
  {
    title: "Follow & Connect",
    desc: "Follow the people whose taste you love. Build a feed that feels personal — not algorithmic noise.",
    icon: UsersIcon,
  },
  {
    title: "Share Your Style",
    desc: "Publish your outfits publicly, collect likes, and inspire others. Your wardrobe is worth showing off.",
    icon: HeartIcon,
  },
];

const toolFeatures = [
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
    desc: "Track purchase dates and usage to understand the real value of every piece you own.",
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
          Built for the Community. <br /> Powered by the Technology.
        </h1>
        <p className="text-default-500 uppercase tracking-widest text-sm">
          Fashion meets social — finally done right
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-default-400 mb-6">
          Community
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          {communityFeatures.map((f, i) => (
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
      </div>

      <div className="mb-16">
        <h2 className="text-xs font-bold uppercase tracking-widest text-default-400 mb-6">
          Tools
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          {toolFeatures.map((f, i) => (
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
      </div>

      <div className="flex justify-center">
        <DSButton as={Link} href="/signup" size="lg" variant="primary">
          Join the Community
        </DSButton>
      </div>
    </Container>
  );
}
