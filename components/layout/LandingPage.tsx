"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Design tokens — garment swatch palette                              */
/* ------------------------------------------------------------------ */
const TONE_COLORS: Record<string, string> = {
  charcoal: "#3d3d3d",
  cream: "#f5f0e8",
  denim: "#5c7a9b",
  sand: "#c9b99a",
  ink: "#1a1a1a",
  bone: "#e8e4d5",
  olive: "#6b7c45",
  ecru: "#eee8d5",
  navy: "#2c3e5a",
  rust: "#9b4a2c",
  paper: "#f8f6f0",
  moss: "#5a6b3c",
  smoke: "#8a8a8a",
  plum: "#6b3b5c",
  rose: "#c9a0a0",
  ash: "#a8a8a0",
};

const MOTION_TAGS: Record<string, React.ComponentType<any>> = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  section: motion.section,
};

/* ------------------------------------------------------------------ */
/* Utilities                                                            */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = "",
  fade = false,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  fade?: boolean;
  as?: string;
}) {
  const Tag = MOTION_TAGS[as] || motion.div;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: fade ? 0 : 16 }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay: delay / 1000,
      }}
      viewport={{ once: true, margin: "-8% 0px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </Tag>
  );
}

function Container({
  children,
  className = "",
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`w-full mx-auto ${wide ? "max-w-[1480px]" : "max-w-[1320px]"} px-6 md:px-10 lg:px-14 ${className}`}
    >
      {children}
    </div>
  );
}

function Garment({ tone }: { tone: string }) {
  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor: TONE_COLORS[tone] ?? "#e0ddd5" }}
    />
  );
}

function CTAButton({
  children,
  href,
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "dark" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-3 h-[52px] px-7 text-[13px] font-mono uppercase tracking-[0.16em] transition-colors";

  return (
    <Link
      className={`${base} ${variant === "dark" ? "lp-btn-dark" : "lp-btn-ghost"} ${className}`}
      href={href}
    >
      {children}
      <span className="translate-y-px">→</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Section 1 — Hero                                                     */
/* ------------------------------------------------------------------ */

interface CatalogueStats {
  itemCount: number;
  categoryCount: number;
  brandCount: number;
}

function Hero({ stats }: { stats: CatalogueStats }) {
  const today = new Date();
  const date = today
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();

  const SPECIMEN_TONES = [
    "charcoal",
    "cream",
    "denim",
    "sand",
    "ink",
    "bone",
    "olive",
    "ecru",
    "navy",
    "rust",
    "paper",
    "moss",
    "smoke",
    "plum",
    "rose",
    "charcoal",
  ];

  return (
    <section
      className="relative pt-16 md:pt-20 pb-16 md:pb-24 overflow-hidden bg-paper"
      id="top"
    >
      <Container>
        {/* Top meta strip */}
        <Reveal fade className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <div className="col-span-6 md:col-span-3 eyebrow text-stone">
            № 001 / Pre-launch
          </div>
          <div className="col-span-6 md:col-span-3 eyebrow text-stone md:text-left text-right">
            {date}
          </div>
          <div className="hidden md:block col-span-3 eyebrow text-stone">
            Live now
          </div>
          <div className="hidden md:block col-span-3 eyebrow text-stone text-right">
            {stats.itemCount.toLocaleString("en-US")} items catalogued
          </div>
        </Reveal>

        {/* Headline */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10">
            <Reveal
              as="h1"
              className="lp-display text-[clamp(56px,11vw,196px)]"
            >
              <span className="block">Your wardrobe</span>
              <span className="block">deserves an</span>
              <span className="block font-display italic font-normal text-stone">
                audience.
              </span>
            </Reveal>
          </div>
        </div>

        {/* Subhead + CTAs */}
        <div className="grid grid-cols-12 gap-6 mt-14 md:mt-20">
          <Reveal
            className="col-span-12 md:col-span-5 lg:col-span-4"
            delay={120}
          >
            <div className="eyebrow text-stone mb-4">What rcapsule is</div>
            <p className="text-[18px] md:text-[20px] leading-snug font-light text-ink/90 max-w-md">
              catalogue what you own. Build outfits. Curate collections for any
              chapter of your life. Then share your style — with the people who
              actually want to see it.
            </p>
          </Reveal>

          <div className="col-span-12 md:col-span-7 lg:col-span-7 md:col-start-6 lg:col-start-6 flex flex-col">
            <Reveal className="flex flex-wrap items-center gap-4" delay={220}>
              <CTAButton href="/signup">Build your closet</CTAButton>
              <CTAButton href="/discover" variant="ghost">
                Explore wardrobes
              </CTAButton>
            </Reveal>
            <Reveal className="mt-5 eyebrow text-stone" delay={320}>
              Free · No credit card · Web app, live today
            </Reveal>
          </div>
        </div>

        {/* Specimen row */}
        <Reveal className="mt-20 md:mt-28" delay={420}>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 flex items-center justify-between mb-2">
              <span className="eyebrow text-stone">
                Specimen — Founder closet, partial
              </span>
              <span className="eyebrow text-stone hidden md:inline">
                Live today
              </span>
            </div>
            <div className="col-span-12">
              <div className="border-t border-b hairline-strong py-3 overflow-hidden">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
                >
                  {SPECIMEN_TONES.map((tone, i) => (
                    <div key={i} className="aspect-[3/4]">
                      <Garment tone={tone} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-12 flex items-center justify-between mt-2">
              <span className="num text-[11px] text-stone">
                {stats.itemCount.toLocaleString("en-US")} ITEMS · {stats.categoryCount} CATEGORIES · {stats.brandCount} BRANDS
              </span>
              <span className="eyebrow text-stone">↓ scroll</span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — The Social Layer (replaces Problem)                     */
/* ------------------------------------------------------------------ */

function SocialLayer() {
  return (
    <section className="py-28 md:py-44 border-t hairline bg-paper">
      <Container>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">02 · Why rcapsule</div>
          </Reveal>

          <div className="col-span-12 md:col-span-9">
            <Reveal
              as="h2"
              className="lp-display text-[clamp(40px,6.5vw,104px)]"
            >
              Style inspiration should
              <br />
              come from real wardrobes,
              <br />
              <span className="font-display italic font-normal text-stone">
                not brand campaigns.
              </span>
            </Reveal>

            <div className="mt-20 md:mt-28 grid grid-cols-12 gap-6 items-start">
              <Reveal className="col-span-12 md:col-span-5" delay={120}>
                <p className="text-[18px] md:text-[20px] leading-snug font-light text-ink/90">
                  Instagram shows outfits. Pinterest shows mood boards. Neither
                  shows you the actual wardrobe — the pieces, the decisions, the
                  real context behind the look.
                </p>
                <p className="mt-6 text-[18px] md:text-[20px] leading-snug font-light text-ink/90">
                  rcapsule does.
                </p>
              </Reveal>

              <Reveal
                className="col-span-12 md:col-span-5 md:col-start-7"
                delay={220}
              >
                <div className="space-y-8">
                  {[
                    {
                      label: "Real pieces",
                      body: "Every item in a public profile is something that person actually owns — photographed, tagged, and searchable.",
                    },
                    {
                      label: "Real outfits",
                      body: "Outfits built from pieces they own, saved to their profile, shared because someone asked to see them.",
                    },
                    {
                      label: "Real collections",
                      body: "Capsules curated for real occasions — a trip, a season, a new chapter. Not editorial. Lived.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="border-t hairline pt-6">
                      <div className="eyebrow text-ink mb-2">{item.label}</div>
                      <p className="text-[15px] font-light text-stone leading-snug">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — Discover (dark, replaces Cost-per-wear)                 */
/* ------------------------------------------------------------------ */

function Discover() {
  const profiles = [
    {
      user: "maren_o",
      loc: "Copenhagen",
      items: 142,
      tones: ["charcoal", "cream", "denim", "olive", "bone", "ink"],
    },
    {
      user: "tobias.k",
      loc: "Berlin",
      items: 118,
      tones: ["ink", "ash", "smoke", "charcoal", "navy", "plum"],
    },
    {
      user: "inea",
      loc: "Stockholm",
      items: 63,
      tones: ["ecru", "bone", "paper", "sand", "cream", "rose"],
    },
    {
      user: "fairwell",
      loc: "Brooklyn",
      items: 201,
      tones: ["olive", "rust", "sand", "ecru", "moss", "smoke"],
    },
  ];

  return (
    <section
      className="bg-ink text-paper py-24 md:py-36 relative overflow-hidden"
      id="discover"
    >
      <Container wide>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-mist">03 · Discover</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="lp-display text-paper text-[clamp(40px,6vw,96px)]">
              Follow the wardrobes
              <br />
              <span className="font-display italic font-normal text-mist">
                that actually inspire you.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-mist text-[16px] md:text-[18px] font-light leading-snug">
              Discover is a feed of real closets. Not brand partnerships. Not
              gifted hauls. People sharing what they own, how they wear it, and
              the collections they&rsquo;ve built for their real lives.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-20 md:mt-28" delay={140}>
          <div className="border border-mist/20">
            {/* Header strip */}
            <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-mist/20">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-paper" />
                <span className="eyebrow text-mist">
                  Sample profiles · real format
                </span>
              </div>
              <span className="eyebrow text-mist hidden md:inline">
                /discover
              </span>
            </div>

            {/* Profile grid */}
            <div className="grid grid-cols-1 md:grid-cols-4">
              {profiles.map((p, i) => (
                <div
                  key={p.user}
                  className={`p-6 ${i < 3 ? "md:border-r border-mist/20" : ""} border-b md:border-b-0 border-mist/20`}
                >
                  <div className="grid grid-cols-3 grid-rows-2 gap-1 aspect-[4/3] mb-4">
                    {p.tones.map((t, j) => (
                      <Garment key={j} tone={t} />
                    ))}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[15px] font-light text-paper">
                        @{p.user}
                      </div>
                      <div className="eyebrow text-mist mt-1">{p.loc}</div>
                    </div>
                    <div className="text-right">
                      <div className="num text-[16px] text-paper">
                        {p.items}
                      </div>
                      <div className="eyebrow text-mist mt-1">pieces</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom strip */}
            <div className="px-6 md:px-10 py-5 border-t border-mist/20 flex items-center justify-between">
              <span className="font-display italic text-[clamp(18px,2vw,28px)] text-paper leading-snug">
                Find your people. Follow their closets.
              </span>
              <Link
                className="eyebrow text-mist underline underline-offset-4 hidden md:inline"
                href="/discover"
              >
                Open /discover →
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — Core features                                            */
/* ------------------------------------------------------------------ */

function CatalogueMockup() {
  return (
    <div className="w-full h-full border hairline p-3 flex flex-col gap-2">
      {[
        {
          tone: "charcoal",
          label: "Wool overcoat",
          brand: "Toteme",
          count: "12×",
        },
        {
          tone: "navy",
          label: "Straight trousers",
          brand: "COS",
          count: "28×",
        },
        { tone: "cream", label: "Silk blouse", brand: "Max Mara", count: "7×" },
      ].map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 py-1.5 border-b hairline last:border-b-0"
        >
          <div
            className="w-8 h-10 flex-shrink-0"
            style={{ backgroundColor: TONE_COLORS[item.tone] }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium truncate">{item.label}</div>
            <div className="eyebrow text-stone">{item.brand}</div>
          </div>
          <div className="num text-[11px] text-stone">{item.count}</div>
        </div>
      ))}
    </div>
  );
}

function OutfitsMockup() {
  const outfits = [
    { tones: ["charcoal", "cream", "bone"], label: "Office Thursday" },
    { tones: ["navy", "ecru", "sand"], label: "Weekend" },
    { tones: ["ink", "olive", "cream"], label: "Travel day" },
  ];

  return (
    <div className="w-full h-full flex gap-4">
      {outfits.map((o) => (
        <div key={o.label} className="flex-1 flex flex-col gap-1">
          {o.tones.map((t, j) => (
            <div
              key={j}
              className="w-full border hairline"
              style={{ height: 28, backgroundColor: TONE_COLORS[t] }}
            />
          ))}
          <div className="eyebrow text-stone mt-2">{o.label}</div>
        </div>
      ))}
    </div>
  );
}

function CollectionsMockup() {
  const collections = [
    {
      label: "Lisbon, May",
      count: 11,
      tones: ["cream", "sand", "bone", "ecru"],
    },
    {
      label: "Winter capsule",
      count: 18,
      tones: ["charcoal", "navy", "ink", "smoke"],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {collections.map((c) => (
        <div key={c.label} className="border hairline p-3 flex-1 flex flex-col">
          <div className="flex gap-1 flex-1 min-h-0">
            {c.tones.map((t, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: TONE_COLORS[t] }}
              />
            ))}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-[12px] font-light">{c.label}</div>
            <div className="num text-[11px] text-stone">{c.count} pieces</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialMockup() {
  const profiles = [
    { tones: ["charcoal", "ink", "bone"], user: "@m.k", loc: "Copenhagen" },
    { tones: ["ecru", "sand", "cream"], user: "@inea", loc: "Stockholm" },
    { tones: ["navy", "olive", "smoke"], user: "@tobias", loc: "Berlin" },
    { tones: ["rust", "sand", "paper"], user: "@ren", loc: "Melbourne" },
  ];

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2">
      {profiles.map((p) => (
        <div key={p.user} className="border hairline p-2">
          <div className="flex gap-0.5 mb-1">
            {p.tones.map((t, i) => (
              <div
                key={i}
                className="flex-1 h-7"
                style={{ backgroundColor: TONE_COLORS[t] }}
              />
            ))}
          </div>
          <div className="eyebrow text-stone">{p.user}</div>
          <div className="eyebrow text-stone/60">{p.loc}</div>
        </div>
      ))}
    </div>
  );
}

function Features() {
  const tiles = [
    {
      n: "01",
      tag: "catalogue",
      title: "Everything you own, in one place",
      body: "Add pieces by photo, link, or receipt. Tag by brand, season, colour, occasion. Your whole wardrobe — searchable and shareable.",
      mock: <CatalogueMockup />,
    },
    {
      n: "02",
      tag: "Outfits",
      title: "Build and share looks from your wardrobe",
      body: "Compose outfits from pieces you already own. Save them, share individual looks, or make your full outfit library public.",
      mock: <OutfitsMockup />,
    },
    {
      n: "03",
      tag: "Collections",
      title: "Curate for every chapter",
      body: "A trip to Lisbon. Your winter capsule. A new work rotation. Group your pieces into themed collections for any occasion or season.",
      mock: <CollectionsMockup />,
    },
    {
      n: "04",
      tag: "Discover",
      title: "Follow real closets that inspire you",
      body: "Discover public profiles of real wardrobes. Follow the people whose actual style — not their filtered feed — you want to see more of.",
      mock: <SocialMockup />,
    },
  ];

  return (
    <section
      className="py-28 md:py-40 border-t hairline bg-paper"
      id="features"
    >
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">03 · What you can do</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="lp-display text-[clamp(40px,6.5vw,104px)]">
              Four things.
              <br />
              <span className="font-display italic font-normal text-stone">
                One wardrobe.
              </span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l hairline">
          {tiles.map((t, i) => (
            <Reveal
              key={t.n}
              className="border-r border-b hairline"
              delay={i * 90}
            >
              <div className="p-7 md:p-9 flex flex-col h-full min-h-[440px] md:min-h-[520px]">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-stone">{t.n}</span>
                  <span className="eyebrow text-stone">{t.tag}</span>
                </div>
                <div className="mt-6">
                  <h3 className="text-[28px] md:text-[34px] leading-[1.05] font-light font-display tracking-tight max-w-[18ch]">
                    {t.title}
                  </h3>
                  <p className="mt-4 text-[15px] text-stone leading-snug max-w-[42ch] font-light">
                    {t.body}
                  </p>
                </div>
                <div className="mt-auto pt-8">
                  <div className="aspect-[16/9] w-full">{t.mock}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 5 — How it works                                             */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      label: "Add",
      title: "Add your pieces",
      body: "Photograph what you own, paste a link, or scan a receipt. Your wardrobe, catalogued and organized.",
    },
    {
      n: "02",
      label: "Create",
      title: "Build outfits & collections",
      body: "Compose looks from pieces you own. Curate themed collections — a trip, a season, a recurring rotation. Keep it for yourself or share it.",
    },
    {
      n: "03",
      label: "Share",
      title: "Share your style",
      body: "Make your closet, your outfits, or specific collections public. Choose the depth. Let the people who care, in.",
    },
  ];

  return (
    <section className="py-28 md:py-40 border-t hairline bg-paper">
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">04 · How it works</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="lp-display text-[clamp(40px,6.5vw,104px)]">
              Three moves.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t hairline-strong">
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              className={`pt-10 md:pt-14 pb-12 ${i < 2 ? "md:border-r hairline" : ""}`}
              delay={i * 120}
            >
              <div className="px-2">
                <div className="flex items-baseline justify-between">
                  <span className="num text-[64px] md:text-[88px] font-thin leading-none tracking-tight">
                    {s.n}
                  </span>
                  <span className="eyebrow text-stone">{s.label}</span>
                </div>
                <div className="mt-10 max-w-sm pr-6">
                  <h3 className="text-[28px] md:text-[34px] leading-tight font-light font-display tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-snug text-stone font-light">
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 6 — Collections + Wishlist                                   */
/* ------------------------------------------------------------------ */

function CollectionCard({
  name,
  season,
  count,
  tones,
}: {
  name: string;
  season: string;
  count: number;
  tones: string[];
}) {
  return (
    <div className="border hairline p-5 bg-paper hover:border-ink transition-colors">
      <div className="grid grid-cols-4 gap-1 mb-4">
        {tones.slice(0, 8).map((tone, i) => (
          <div key={i} className="aspect-[3/4]">
            <Garment tone={tone} />
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <div>
          <div className="text-[15px] font-light">{name}</div>
          <div className="eyebrow text-stone mt-1">{season}</div>
        </div>
        <div className="text-right">
          <div className="num text-[16px]">{count}</div>
          <div className="eyebrow text-stone mt-1">pieces</div>
        </div>
      </div>
    </div>
  );
}

function CollectionsSection() {
  const cols = [
    {
      name: "Winter capsule",
      season: "Dec — Feb",
      count: 18,
      tones: [
        "charcoal",
        "ink",
        "smoke",
        "olive",
        "plum",
        "navy",
        "ecru",
        "bone",
      ],
    },
    {
      name: "Lisbon, May",
      season: "Travel",
      count: 11,
      tones: [
        "cream",
        "sand",
        "paper",
        "ecru",
        "bone",
        "rust",
        "smoke",
        "denim",
      ],
    },
    {
      name: "Office, rotating",
      season: "Year-round",
      count: 14,
      tones: [
        "navy",
        "charcoal",
        "paper",
        "bone",
        "olive",
        "denim",
        "smoke",
        "ink",
      ],
    },
  ];

  return (
    <section className="py-28 md:py-40 bg-soft border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-20">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">05 · Collections</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="lp-display text-[clamp(40px,6.5vw,104px)]">
              Curate for any chapter,{" "}
              <span className="font-display italic font-normal text-stone">
                from what you own.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] md:text-[18px] font-light leading-snug text-ink/85">
              Collections are themed groups of pieces from your wardrobe. Pack
              for a trip, map out a season, lock in a recurring rotation. Share
              the whole collection or keep it private — the choice is yours.
            </p>
          </Reveal>
        </div>

        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cols.map((c, i) => (
            <CollectionCard key={i} {...c} />
          ))}
        </Reveal>

        {/* Sharing callout */}
        <Reveal className="mt-16 md:mt-20" delay={120}>
          <div className="border hairline-strong p-8 md:p-12 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 md:col-span-7">
              <div className="eyebrow text-stone mb-4">Sharing is optional</div>
              <h3 className="lp-display text-[clamp(28px,3.5vw,52px)]">
                Your closet, your rules.
                <br />
                <span className="font-display italic font-normal text-stone">
                  Share what you want.
                </span>
              </h3>
            </div>
            <div className="col-span-12 md:col-span-5">
              <p className="text-[16px] font-light text-stone leading-snug">
                Make your full profile public, share specific collections with a
                link, or keep everything private. rcapsule works as a personal
                wardrobe tool first — the community layer is there when you want
                it.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 7 — Community                                                */
/* ------------------------------------------------------------------ */

function Community() {
  const profiles = [
    {
      user: "maren_o",
      loc: "Copenhagen",
      items: 142,
      tones: ["charcoal", "cream", "denim", "olive", "bone", "ink"],
      style: "Workwear · raw",
    },
    {
      user: "tobias.k",
      loc: "Berlin",
      items: 118,
      tones: ["ink", "ash", "smoke", "charcoal", "navy", "plum"],
      style: "Black on black",
    },
    {
      user: "inea",
      loc: "Stockholm",
      items: 63,
      tones: ["ecru", "bone", "paper", "sand", "cream", "rose"],
      style: "Slow neutrals",
    },
    {
      user: "fairwell",
      loc: "Brooklyn",
      items: 201,
      tones: ["olive", "rust", "sand", "ecru", "moss", "smoke"],
      style: "Field & function",
    },
    {
      user: "koja",
      loc: "Kyoto",
      items: 47,
      tones: ["ink", "charcoal", "navy", "bone", "smoke", "paper"],
      style: "Tailored minimum",
    },
    {
      user: "ren.k",
      loc: "Melbourne",
      items: 92,
      tones: ["sand", "cream", "rust", "bone", "ecru", "rose"],
      style: "Sun-bleached",
    },
  ];

  return (
    <section
      className="py-28 md:py-40 border-t hairline bg-paper"
      id="community"
    >
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-20">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">07 · Community</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="lp-display text-[clamp(40px,6.5vw,104px)]">
              Real closets.
              <br />
              <span className="font-display italic font-normal text-stone">
                Real people.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] md:text-[18px] font-light leading-snug text-ink/85">
              Every public profile is someone&rsquo;s actual wardrobe. The
              pieces they own, the outfits they&rsquo;ve built, the collections
              they&rsquo;ve curated for their real life. Follow the people whose
              closet resonates — not the ones with the best lighting.
            </p>
          </Reveal>
        </div>

        <Reveal className="grid grid-cols-1 md:grid-cols-3 border-t border-l hairline">
          {profiles.map((p) => (
            <div
              key={p.user}
              className="border-r border-b hairline p-5 hover:bg-soft transition-colors"
            >
              <div className="aspect-[4/3] grid grid-cols-3 grid-rows-2 gap-1">
                {p.tones.map((t, j) => (
                  <Garment key={j} tone={t} />
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <div className="text-[16px] font-light">@{p.user}</div>
                  <div className="eyebrow text-stone mt-1">
                    {p.loc} · {p.style}
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[18px]">{p.items}</div>
                  <div className="eyebrow text-stone mt-1">pieces</div>
                </div>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal
          className="mt-12 flex items-center justify-between border-t hairline-strong pt-6"
          delay={160}
        >
          <div className="eyebrow text-stone">
            Profiles are fictional in this preview. Real ones coming with
            launch.
          </div>
          <Link
            className="eyebrow text-stone underline underline-offset-4"
            href="/discover"
          >
            Open /discover →
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 8 — Founder note                                             */
/* ------------------------------------------------------------------ */

function Founder({ stats }: { stats: CatalogueStats }) {
  return (
    <section className="py-28 md:py-44 border-t hairline bg-paper" id="founder">
      <Container>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">08 · Founder note</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-8">
            <p className="font-display italic text-[clamp(28px,3.6vw,52px)] leading-[1.18] text-ink">
              &ldquo;The most interesting style I&rsquo;ve ever seen is in real
              wardrobes — friends&rsquo; closets, people I spotted on the
              street, strangers whose taste I wanted to understand. Not runway.
              Not a campaign. Not what they&rsquo;d staged for a photo.
              <br />
              <br />
              I wanted a place where that kind of style is visible and
              discoverable — where you can follow someone&rsquo;s actual
              wardrobe, see the outfits they really wear, and explore the
              collections they&rsquo;ve built for their real life.
              <br />
              <br />
              <span className="not-italic font-light text-stone text-[clamp(18px,1.4vw,22px)] leading-snug block mt-6">
                I built rcapsule for that. Right now I&rsquo;m the only user —
                {stats.itemCount.toLocaleString("en-US")} items, {stats.categoryCount} categories, all the pieces that make up my
                actual wardrobe. If you have a closet worth sharing — and you do
                — come build it here.&rdquo;
              </span>
            </p>
            <div className="mt-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-ink" />
              <div>
                <div className="text-[14px]">The founder</div>
                <div className="eyebrow text-stone mt-1">
                  rcapsule · solo build · 2026
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 9 — Final CTA                                                */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section
      className="bg-ink text-paper py-28 md:py-48 relative overflow-hidden"
      id="signup"
    >
      {/* Faint vertical guides */}
      <div className="absolute inset-0 pointer-events-none">
        <Container>
          <div className="grid grid-cols-12 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`${i === 0 ? "" : "border-l border-mist/10"} h-full`}
              />
            ))}
          </div>
        </Container>
      </div>

      <Container>
        <Reveal>
          <div className="eyebrow text-mist">06 · Begin</div>
        </Reveal>

        <Reveal className="mt-10" delay={80}>
          <h2 className="lp-display text-paper text-[clamp(56px,11vw,200px)]">
            Find your
            <br />
            style community.
          </h2>
          <h2 className="lp-display text-mist text-[clamp(56px,11vw,200px)] font-display italic font-normal mt-2">
            It starts with your closet.
          </h2>
        </Reveal>

        <Reveal className="mt-16 md:mt-24 grid grid-cols-12 gap-6" delay={220}>
          <div className="col-span-12 md:col-span-7">
            <div className="flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex items-center gap-3 h-[64px] px-9 bg-paper text-ink text-[13px] font-mono uppercase tracking-[0.18em] hover:bg-mist transition-colors"
                href="/signup"
              >
                Build your closet <span className="translate-y-px">→</span>
              </Link>
              <Link
                className="inline-flex items-center gap-3 h-[64px] px-9 border border-mist/40 text-paper text-[13px] font-mono uppercase tracking-[0.18em] hover:bg-mist/10 transition-colors"
                href="/discover"
              >
                Browse wardrobes
              </Link>
            </div>
            <div className="mt-6 eyebrow text-mist">
              Free · No credit card · Web app, live today
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 md:text-right">
            <div className="eyebrow text-mist">The fine print</div>
            <p className="mt-3 text-mist text-[14px] font-light leading-snug max-w-sm md:ml-auto">
              Pre-launch. One user so far (the founder). No waitlist, no queue.
              Sign up, catalogue your wardrobe, and the community opens as
              people join.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* LandingPage                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage({ stats }: { stats: CatalogueStats }) {
  return (
    <div className="bg-paper text-ink">
      <Hero stats={stats} />
      <SocialLayer />
      <Features />
      <HowItWorks />
      <CollectionsSection />
      <FinalCTA />
    </div>
  );
}
