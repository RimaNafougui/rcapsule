"use client";

import { motion } from "framer-motion";
import {
  PuzzlePieceIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { FeatureCard } from "@/components/ui/card";
import { DSButton } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/components/ui/motion";

const STORE_URL =
  "https://chromewebstore.google.com/detail/wardrobe-import/hcakhbfdhndjcihacgbfiflkmlffknbp";

const steps = [
  {
    number: "01",
    title: "Install the extension",
    desc: "Add Wardrobe Import to Chrome in one click. No account needed for installation.",
  },
  {
    number: "02",
    title: "Browse any store",
    desc: "Open any fashion retailer — Aritzia, ASOS, Zara, or anywhere else you shop.",
  },
  {
    number: "03",
    title: "Open the panel",
    desc: 'Click the extension icon or press Cmd+Shift+W. The panel slides in on the right side of the page.',
  },
  {
    number: "04",
    title: "Scan & save",
    desc: "Hit Scan. The extension reads the product name, brand, price, and image automatically. Review, adjust, and save to your closet.",
  },
];

const capabilities = [
  {
    title: "Auto-detection",
    desc: "Opens on any product page and extracts name, brand, price, size, and image — no copy-pasting required.",
    icon: CursorArrowRaysIcon,
  },
  {
    title: "Image preview",
    desc: "Pulls the product photo directly. Paste an image URL manually if you want a different angle.",
    icon: PhotoIcon,
  },
  {
    title: "Works everywhere",
    desc: "Compatible with all major fashion retailers. Falls back to smart heuristics on unknown sites.",
    icon: ShoppingBagIcon,
  },
  {
    title: "Instant closet sync",
    desc: "Items land directly in your Rcapsule closet. No importing, no CSV, no friction.",
    icon: CheckCircleIcon,
  },
];

export default function ExtensionPage() {
  return (
    <Container className="py-16">
      {/* Hero */}
      <motion.div
        className="text-center max-w-2xl mx-auto mb-20"
        initial="hidden"
        variants={staggerContainer}
        viewport={{ once: true }}
        whileInView="visible"
      >
        <motion.div variants={fadeInUp}>
          <p className="eyebrow text-stone mb-4">Chrome Extension</p>
          <h1 className="font-display font-light text-[clamp(32px,5vw,64px)] tracking-tight leading-tight mb-6">
            Add clothes from any store.
            <br /> In seconds.
          </h1>
          <p className="text-lg text-default-500 font-light leading-relaxed mb-8 max-w-xl mx-auto">
            Browse a product page, press a shortcut, and it lands in your
            wardrobe. No manual entry, no screenshots, no switching tabs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <DSButton
              as="a"
              href={STORE_URL}
              rel="noopener noreferrer"
              size="lg"
              target="_blank"
              variant="primary"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Add to Chrome — it&apos;s free
            </DSButton>
            <DSButton as={Link} href="/signup" size="lg" variant="secondary">
              Create your wardrobe
            </DSButton>
          </div>
        </motion.div>
      </motion.div>

      {/* How it works */}
      <section className="mb-20">
        <h2 className="eyebrow text-stone mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="flex flex-col gap-3"
              initial="hidden"
              transition={{ delay: i * 0.08 }}
              variants={fadeInUp}
              viewport={{ once: true }}
              whileInView="visible"
            >
              <span className="font-mono text-xs text-default-300 tracking-widest">
                {step.number}
              </span>
              <div className="h-px bg-default-200 w-12" />
              <h3 className="font-medium text-sm">{step.title}</h3>
              <p className="text-sm text-default-500 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What it does */}
      <section className="mb-20">
        <h2 className="eyebrow text-stone mb-8">What it does</h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          {capabilities.map((c, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <FeatureCard
                className="h-full"
                description={c.desc}
                icon={<c.icon className="w-8 h-8 text-foreground stroke-1" />}
                title={c.title}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Keyboard shortcut callout */}
      <section className="bg-soft border border-default-200 p-8 md:p-12 mb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow text-stone mb-2">Keyboard shortcut</p>
            <h3 className="font-display font-light text-2xl md:text-3xl tracking-tight">
              Open the panel without touching your mouse.
            </h3>
            <p className="text-default-500 mt-2 text-sm">
              Works on any tab, any time — even when you&apos;re not on a
              product page.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {["⌘", "Shift", "W"].map((key) => (
                <kbd
                  key={key}
                  className="font-mono text-sm bg-background border border-default-300 px-3 py-1.5 shadow-sm text-foreground"
                >
                  {key}
                </kbd>
              ))}
            </div>
            <p className="text-xs text-default-400 font-mono">
              Ctrl+Shift+W on Windows
            </p>
          </div>
        </div>
      </section>

      {/* Permissions note */}
      <section className="mb-20">
        <h2 className="eyebrow text-stone mb-6">Permissions & privacy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-default-500 leading-relaxed">
          <div className="space-y-1">
            <p className="font-medium text-foreground">activeTab</p>
            <p>
              Reads the page you&apos;re currently viewing to extract product
              details. Only runs when you open the panel.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">storage</p>
            <p>
              Stores your session state locally so the panel remembers its
              position and last scan.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">No browsing history</p>
            <p>
              The extension never reads your history, tracks visited sites, or
              sends data without your action.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center text-center gap-4">
        <PuzzlePieceIcon className="w-8 h-8 text-default-300 stroke-1" />
        <h2 className="font-display font-light text-2xl md:text-3xl tracking-tight">
          Ready to stop manually adding clothes?
        </h2>
        <p className="text-default-500 text-sm max-w-sm">
          Install once. Use it every time you shop online.
        </p>
        <DSButton
          as="a"
          className="mt-2"
          href={STORE_URL}
          rel="noopener noreferrer"
          size="lg"
          target="_blank"
          variant="primary"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Add to Chrome
        </DSButton>
      </div>
    </Container>
  );
}
