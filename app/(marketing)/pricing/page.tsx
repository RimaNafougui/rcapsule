"use client";
import { useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  CloudIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { useUser } from "@/lib/contexts/UserContext";
import { Container } from "@/components/ui/container";
import { DSButton } from "@/components/ui/button";
import { DSBadge } from "@/components/ui/badge";
import { DSCard } from "@/components/ui/card";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [isLoading, setIsLoading] = useState(false);

  const monthlyPrice = 6.99;
  const yearlyPrice = 59.0;
  const savingsPercent = Math.round(
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100,
  );
  const { user } = useUser();

  const handleSubscribe = async (plan: "free" | "premium") => {
    if (plan === "free") {
      router.push(user ? "/closet" : "/signup");

      return;
    }

    if (!user) {
      router.push("/login?callbackUrl=/pricing");

      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle, userId: user?.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data.error, data.detail ?? "");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does the AI work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our AI analyzes your clothing items, local weather data, and style preferences to generate cohesive outfits. It learns what you like the more you log your daily looks.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! You can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.",
        },
      },
      {
        "@type": "Question",
        name: "Can I export my data?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You own your data. You can export your entire wardrobe catalog and usage logs at any time from your account settings.",
        },
      },
      {
        "@type": "Question",
        name: "What's your refund policy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a 7-day money-back guarantee. If you're not satisfied with premium features, contact us within 7 days for a full refund.",
        },
      },
    ],
  };

  return (
    <Container className="min-h-screen py-16">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <header className="text-center mb-16 pt-8">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-2">
          The Membership
        </h1>
        <div className="text-xs uppercase tracking-widest text-default-500">
          Stop guessing. Start wearing.
        </div>
      </header>

      {/* Billing toggle */}
      <div className="flex justify-center items-center gap-6 mb-16">
        <span
          className={`text-xs uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
            billingCycle === "monthly"
              ? "text-foreground font-bold"
              : "text-default-400"
          }`}
          role="button"
          tabIndex={0}
          onClick={() => setBillingCycle("monthly")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setBillingCycle("monthly");
            }
          }}
        >
          Monthly
        </span>

        <div
          className="w-14 h-8 bg-default-100 p-1 cursor-pointer flex items-center relative border border-default-200"
          role="button"
          tabIndex={0}
          onClick={() =>
            setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setBillingCycle(
                billingCycle === "monthly" ? "yearly" : "monthly",
              );
            }
          }}
        >
          <motion.div
            layout
            animate={{ x: billingCycle === "monthly" ? 0 : 24 }}
            className="w-6 h-6 bg-foreground"
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
              billingCycle === "yearly"
                ? "text-foreground font-bold"
                : "text-default-400"
            }`}
            role="button"
            tabIndex={0}
            onClick={() => setBillingCycle("yearly")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setBillingCycle("yearly");
              }
            }}
          >
            Annually
          </span>
          <DSBadge>Save {savingsPercent}%</DSBadge>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative items-start">
        {/* Free plan */}
        <DSCard
          className="p-10 hover:border-default-400 transition-colors duration-200"
          variant="bordered"
        >
          <div className="mb-10 text-center md:text-left">
            <span className="font-bold uppercase tracking-widest text-xs mb-2 block text-default-500">
              The Digital Closet
            </span>
            <h2 className="font-display italic text-3xl font-light">
              Organized
            </h2>
          </div>

          <div className="mb-10 h-16 flex items-baseline justify-center md:justify-start">
            <span className="text-5xl font-light tracking-tighter">$0</span>
            <span className="text-default-400 text-xs ml-3 uppercase tracking-widest">
              / Forever
            </span>
          </div>

          <DSButton
            fullWidth
            className="mb-10"
            variant="outline"
            onPress={() => handleSubscribe("free")}
          >
            Start Curating
          </DSButton>

          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-default-400 mb-4 block">
              Core Features
            </span>
            <div className="space-y-4">
              <FeatureItem included text="Unlimited Item Uploads" />
              <FeatureItem included text="Manual Outfit Canvas" />
              <FeatureItem included text="Basic Wardrobe Stats" />
              <FeatureItem included text="Calendar Log" />
              <div className="h-px w-full bg-default-200 my-2" />
              <FeatureItem included={false} text="AI Outfit Generator" />
              <FeatureItem included={false} text="Magic Background Removal" />
              <FeatureItem included={false} text="Weather-Smart Suggestions" />
            </div>
          </div>
        </DSCard>

        {/* Premium plan */}
        <DSCard className="p-10 md:-translate-y-4 shadow-xl" variant="stat">
          <div className="absolute top-0 right-0 p-6">
            <SparklesIcon className="w-5 h-5 animate-pulse" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <span className="font-bold uppercase tracking-widest text-xs mb-2 block opacity-60">
              The Pocket Stylist
            </span>
            <h2 className="font-display italic text-3xl font-light">
              Effortless
            </h2>
          </div>

          <div className="mb-10 h-16 flex items-baseline justify-center md:justify-start overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={billingCycle}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-light tracking-tighter"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
              >
                $
                {billingCycle === "yearly"
                  ? Math.round((yearlyPrice / 12) * 100) / 100
                  : monthlyPrice}
              </motion.span>
            </AnimatePresence>
            <span className="opacity-40 text-xs ml-3 uppercase tracking-widest">
              / month
            </span>
            {billingCycle === "yearly" && (
              <span className="opacity-40 text-xs ml-2 uppercase tracking-widest">
                (billed annually)
              </span>
            )}
          </div>

          <DSButton
            fullWidth
            className="mb-10 bg-background text-foreground hover:opacity-90"
            isLoading={isLoading}
            variant="primary"
            onPress={() => handleSubscribe("premium")}
          >
            {isLoading ? "Redirecting to Checkout..." : "Upgrade Membership"}
          </DSButton>

          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 block">
              Styling Suite
            </span>
            <div className="space-y-4">
              <li className="flex items-start gap-4">
                <SparklesIcon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-sm font-bold block mb-1">
                    AI Outfit Generator
                  </span>
                  <span className="text-xs opacity-60 font-light">
                    Daily looks curated for your weather & events.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <CameraIcon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-sm font-bold block mb-1">
                    Magic Edit
                  </span>
                  <span className="text-xs opacity-60 font-light">
                    One-click background removal for a clean, pro look.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <CloudIcon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-sm font-bold block mb-1">
                    Weather Intelligence
                  </span>
                  <span className="text-xs opacity-60 font-light">
                    Never be too cold or too hot again.
                  </span>
                </div>
              </li>

              <div className="h-px w-full bg-current opacity-20 my-2" />

              <li className="flex items-center gap-3 text-sm font-light">
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span className="font-medium">Unlimited Collections</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-light">
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span className="font-medium">Cost-Per-Wear Analytics</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-light">
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span>Priority Support</span>
              </li>
            </div>
          </div>
        </DSCard>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-24 text-center pb-20">
        <p className="font-display italic text-2xl mb-6">
          &ldquo;It&apos;s like having a stylist in your pocket.&rdquo;
        </p>
        <div className="h-px w-20 bg-default-300 mx-auto mb-12" />

        <Accordion
          itemClasses={{
            title: "text-sm uppercase tracking-widest font-bold text-center",
            content: "text-default-500 font-light text-sm pb-8 text-center",
            trigger: "py-4",
          }}
          variant="light"
        >
          <AccordionItem
            key="1"
            aria-label="how-it-works"
            title="How does the AI work?"
          >
            Our AI analyzes your clothing items, local weather data, and style
            preferences to generate cohesive outfits. It learns what you like
            the more you log your daily looks.
          </AccordionItem>
          <AccordionItem
            key="2"
            aria-label="cancel"
            title="Can I cancel anytime?"
          >
            Yes! You can cancel your subscription at any time. You&apos;ll
            continue to have access to premium features until the end of your
            billing period.
          </AccordionItem>
          <AccordionItem
            key="3"
            aria-label="export"
            title="Can I export my data?"
          >
            Yes. You own your data. You can export your entire wardrobe catalog
            and usage logs at any time from your account settings.
          </AccordionItem>
          <AccordionItem
            key="4"
            aria-label="refund"
            title="What's your refund policy?"
          >
            We offer a 7-day money-back guarantee. If you&apos;re not satisfied
            with premium features, contact us within 7 days for a full refund.
          </AccordionItem>
        </Accordion>
      </div>
    </Container>
  );
}

function FeatureItem({ included, text }: { included: boolean; text: string }) {
  return (
    <li
      className={`flex items-center gap-3 text-sm font-light ${
        !included ? "text-default-300 line-through decoration-default-300" : ""
      }`}
    >
      {included ? (
        <CheckIcon className="w-4 h-4 shrink-0" />
      ) : (
        <XMarkIcon className="w-4 h-4 shrink-0 text-default-300" />
      )}
      <span>{text}</span>
    </li>
  );
}
