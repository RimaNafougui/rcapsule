"use client";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { LogIn, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[80vh] gap-8 py-20 px-6 text-center">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-2 border border-primary/20">
            <Sparkles size={16} /> Now with AI Outfit Suggestions
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-display font-light tracking-normal mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground-500">
          Your Closet, <br />
          <span className="text-primary">Perfectly Organized.</span>
        </h1>

        <p className="text-xl text-default-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop wondering what to wear. Join thousands of users who have
          digitized their wardrobes to save time and look their best every day.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            as={Link}
            className="font-bold px-8 h-14 text-lg shadow-lg shadow-primary/20"
            color="primary"
            endContent={<UserPlus size={20} />}
            href="/signup"
            size="lg"
          >
            Get Started for Free
          </Button>
          <Button
            as={Link}
            className="font-bold px-8 h-14 text-lg"
            href="/login"
            size="lg"
            startContent={<LogIn size={20} />}
            variant="bordered"
          >
            Sign In
          </Button>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl mt-10 rounded-2xl border border-default-200 bg-content1 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.4, duration: 1 }}
      >
        <div className="aspect-video bg-[url('/images/previewCloset.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-content1 via-transparent to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
