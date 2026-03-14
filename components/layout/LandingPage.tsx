"use client";

import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Palette,
  TrendingUp,
  Calendar,
  FolderOpen,
  Heart,
  Layers,
  BookOpen,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { DSButton } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/components/ui/motion";

/* ========================================
   UTILITY: Count-up animation hook
   ======================================== */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let _start = 0;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return { count, ref };
}

/* ========================================
   PAGE LOADER
   ======================================== */
function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      exit={{
        y: "-100%",
        transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
      }}
    >
      <motion.span
        animate={{ opacity: 1 }}
        className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        rcapsule
      </motion.span>
    </motion.div>
  );
}

/* ========================================
   SECTION 1: HERO
   ======================================== */
function HeroSection({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const card1Y = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const card2Y = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const card3Y = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center min-h-screen pt-20 md:pt-24 pb-16 md:pb-24 px-4 md:px-6 text-center overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--heroui-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--heroui-foreground)) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />

      {/* Floating product card — Jacket (top-left) */}
      <motion.div
        className="absolute top-[7%] -left-8 md:left-[5%] w-32 h-44 md:w-40 md:h-56 overflow-hidden border border-default-200 shadow-sm"
        style={{ y: card1Y, rotate: -12 }}
      >
        <div className="relative w-full h-32 md:h-40">
          <Image
            fill
            unoptimized
            alt="Leather jacket"
            className="object-cover"
            src="https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1800/f25_a05_128542_9166_off_a"
          />
        </div>
        <div className="bg-background px-2 py-1.5 border-t border-default-200">
          <p className="text-[9px] font-bold uppercase tracking-wider truncate">
            Leather Jacket
          </p>
          <p className="text-[9px] text-default-400 font-mono">Worn 12×</p>
        </div>
      </motion.div>

      {/* Floating product card — Sneakers (top-right) */}
      <motion.div
        className="absolute bottom-[10%] md:bottom-auto md:top-[25%] -right-4 md:right-[8%] w-28 h-40 md:w-36 md:h-48 overflow-hidden border border-default-200 shadow-sm"
        style={{ y: card2Y, rotate: 8 }}
      >
        <div className="relative w-full h-28 md:h-36">
          <Image
            fill
            unoptimized
            alt="Sneakers"
            className="object-cover"
            src="https://static2.goldengoose.com/public/Style/ECOMM/GMF00102.F000311-10270.jpg"
          />
        </div>
        <div className="bg-background px-2 py-1.5 border-t border-default-200">
          <p className="text-[9px] font-bold uppercase tracking-wider truncate">
            Sneakers
          </p>
          <p className="text-[9px] text-default-400 font-mono">Worn 28×</p>
        </div>
      </motion.div>

      {/* Floating product card — Dress (bottom-left) */}
      <motion.div
        className="absolute bottom-[20%] left-[12%] w-24 h-32 md:w-32 md:h-44 hidden lg:block overflow-hidden border border-default-200 shadow-sm"
        style={{ y: card3Y, rotate: -5 }}
      >
        <div className="relative w-full h-24 md:h-32">
          <Image
            fill
            unoptimized
            alt="Fashion dress"
            className="object-cover"
            src="https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/s26_a08_132084_1274_off_a"
          />
        </div>
        <div className="bg-background px-2 py-1.5 border-t border-default-200">
          <p className="text-[9px] font-bold uppercase tracking-wider truncate">
            Satin Dress
          </p>
          <p className="text-[9px] text-default-400 font-mono">Worn 3×</p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={ready ? "visible" : "hidden"}
        className="w-full max-w-5xl mx-auto z-10"
        initial="hidden"
        variants={staggerContainer}
      >
        <motion.h1
          className="text-[clamp(2rem,8vw,7rem)] font-black uppercase tracking-tighter italic leading-[0.9] mb-6 md:mb-8"
          variants={fadeInUp}
        >
          The Social Network <br />
          <span className="text-default-400">For Fashion.</span>
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base md:text-lg text-default-500 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-light px-4"
          variants={fadeInUp}
        >
          Discover real outfits from real people. Share your style, follow
          people whose taste you love,
          <br className="hidden sm:block" />
          and build a wardrobe with intention.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4"
          variants={fadeInUp}
        >
          <DSButton
            as="a"
            className="w-full sm:w-auto"
            href="/signup"
            icon={<ArrowRight size={18} />}
            size="lg"
            variant="primary"
          >
            Join the Community
          </DSButton>

          <DSButton
            as="a"
            className="w-full sm:w-auto"
            href="/discover"
            size="lg"
            variant="outline"
          >
            Explore Looks
          </DSButton>
        </motion.div>

        <motion.p
          className="text-[10px] md:text-xs text-default-400 uppercase tracking-widest mt-8"
          variants={fadeInUp}
        >
          Free &bull; No Credit Card Required
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ========================================
   SECTION 2: CATEGORY STRIP
   ======================================== */
const CATEGORIES = [
  "Tops",
  "Dresses",
  "Outerwear",
  "Denim",
  "Footwear",
  "Accessories",
  "Knitwear",
  "Bags",
  "Swimwear",
  "Suits",
  "Activewear",
  "Skirts",
];

function CategoryStrip() {
  return (
    <div className="overflow-hidden border-y border-default-200 bg-default-50 py-3">
      <motion.div
        animate={{ x: [0, "-50%"] }}
        className="flex gap-8 whitespace-nowrap"
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
          <span
            key={i}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-default-400 flex-shrink-0"
          >
            {cat}
            <span className="ml-8 text-default-200">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ========================================
   SECTION 3: SOCIAL PROOF / STATS BAR
   ======================================== */
function StatsBar() {
  const stat1 = useCountUp(2000);
  const stat2 = useCountUp(500);
  const stat3 = useCountUp(1000);
  const stat4 = useCountUp(3500);

  return (
    <section className="py-8 md:py-12 border-b border-default-200">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <span
              ref={stat1.ref}
              className="text-2xl md:text-3xl font-black tracking-tighter"
            >
              {stat1.count.toLocaleString()}+
            </span>
            <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1">
              Items Cataloged
            </p>
          </div>
          <div className="hidden md:block h-8 w-px bg-default-200" />
          <div className="text-center">
            <span
              ref={stat2.ref}
              className="text-2xl md:text-3xl font-black tracking-tighter"
            >
              {stat2.count.toLocaleString()}+
            </span>
            <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1">
              Closets Built
            </p>
          </div>
          <div className="hidden md:block h-8 w-px bg-default-200" />
          <div className="text-center">
            <span
              ref={stat3.ref}
              className="text-2xl md:text-3xl font-black tracking-tighter"
            >
              {stat3.count.toLocaleString()}+
            </span>
            <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1">
              Outfits Created
            </p>
          </div>
          <div className="hidden md:block h-8 w-px bg-default-200" />
          <div className="text-center">
            <span
              ref={stat4.ref}
              className="text-2xl md:text-3xl font-black tracking-tighter"
            >
              {stat4.count.toLocaleString()}+
            </span>
            <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1">
              Outfits Shared
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================
   SECTION 4: FEATURE BENTO GRID
   ======================================== */
function FeatureBentoGrid() {
  return (
    <section className="py-[var(--spacing-section)] px-4 md:px-6">
      <Container size="xl">
        <motion.h2
          className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-8 md:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Core Features
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          initial="hidden"
          variants={staggerContainer}
          viewport={{ once: true }}
          whileInView="visible"
        >
          {/* 1. WEAR TRACKING */}
          <motion.div
            className="md:col-span-2 bg-default-50 border border-default-200 p-6 md:p-10 relative overflow-hidden group min-h-[300px] md:min-h-[380px] transition-colors duration-300 hover:border-default-400"
            variants={fadeInUp}
          >
            <div className="absolute top-4 md:top-6 right-4 md:right-6 p-2 md:p-3 bg-background border border-default-200">
              <Calendar className="md:w-6 md:h-6" size={20} />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-3 md:space-y-4 max-w-md">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">
                  Track What You Actually Wear
                </h3>
                <p className="text-sm md:text-base text-default-500 font-medium">
                  Log every time you wear an item. Discover which pieces you
                  love and which are just taking up space. Make data-driven
                  decisions about your wardrobe.
                </p>
              </div>

              {/* Mini calendar mockup */}
              <div className="mt-6 md:mt-8">
                <div className="grid grid-cols-7 gap-1 max-w-[220px]">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 border border-default-200 flex items-center justify-center text-[9px] ${
                        [2, 5, 8, 11].includes(i)
                          ? "bg-foreground text-background font-bold"
                          : "bg-background"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-default-400 mt-2">
                  4 wears this month
                </p>
              </div>
            </div>
          </motion.div>

          {/* 2. VALUATION */}
          <motion.div
            className="bg-foreground text-background p-6 md:p-10 relative flex flex-col justify-between group overflow-hidden min-h-[300px] md:min-h-[380px]"
            variants={fadeInUp}
          >
            <div className="absolute top-4 md:top-6 right-4 md:right-6 opacity-50">
              <TrendingUp className="md:w-6 md:h-6" size={20} />
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest mb-1">
                Total Valuation
              </h3>
              <p className="opacity-40 text-xs">
                Know your closet&apos;s worth
              </p>
            </div>

            <div className="space-y-4 md:space-y-6 relative z-10">
              <div className="border-b border-current/20 pb-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] uppercase tracking-widest opacity-40">
                    Your Closet Value
                  </span>
                </div>
                <ValuationCounter />
              </div>

              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between items-center opacity-60">
                  <span className="uppercase">Total Items</span>
                  <span className="font-mono">39</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="uppercase">Avg. Item Cost</span>
                  <span className="font-mono">$320</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="uppercase">Cost Per Wear</span>
                  <span className="font-mono">$12</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. COLOR DNA */}
          <motion.div
            className="bg-background border border-default-200 p-6 md:p-10 flex flex-col justify-between group hover:border-foreground transition-colors duration-300 min-h-[300px] md:min-h-[380px]"
            variants={fadeInUp}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest mb-1">
                  Color DNA
                </h3>
                <p className="text-default-500 text-xs">
                  Your palette at a glance
                </p>
              </div>
              <Palette className="text-default-500 md:w-5 md:h-5" size={18} />
            </div>

            <div className="space-y-2 md:space-y-3">
              {[
                {
                  color: "bg-neutral-900",
                  pct: "40%",
                  width: "w-full",
                  label: "Black",
                },
                {
                  color: "bg-neutral-400",
                  pct: "25%",
                  width: "w-[60%]",
                  label: "Gray",
                },
                {
                  color: "bg-blue-200",
                  pct: "10%",
                  width: "w-[30%]",
                  label: "Blue",
                },
              ].map((bar) => (
                <motion.div
                  key={bar.label}
                  className="flex items-center gap-2 md:gap-3"
                  initial={{ opacity: 0, scaleX: 0 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                >
                  <div
                    className={`${bar.width} h-7 md:h-8 ${bar.color} border border-default-200 flex items-center justify-center text-[10px] text-white font-bold`}
                  >
                    {bar.pct}
                  </div>
                  <span className="text-xs uppercase tracking-widest w-12 md:w-14 text-right">
                    {bar.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 4. OUTFITS */}
          <motion.div
            className="md:col-span-2 bg-default-50 border border-default-200 p-6 md:p-10 flex flex-col justify-between group hover:border-default-400 transition-colors duration-300 min-h-[300px] md:min-h-[380px]"
            variants={fadeInUp}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-3 md:space-y-4 max-w-md">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">
                  Build &amp; Plan Outfits
                </h3>
                <p className="text-sm md:text-base text-default-500 font-medium">
                  Combine pieces from your closet into saved outfits. Plan
                  ahead, track what you wear, and never waste time deciding
                  again.
                </p>
              </div>
              <Layers
                className="text-default-300 md:w-6 md:h-6 mt-1 flex-shrink-0"
                size={20}
              />
            </div>

            {/* Mini outfit builder mockup */}
            <div className="mt-6 md:mt-8 flex flex-wrap gap-4 md:gap-6 items-end">
              {[
                {
                  label: "Outfit 1",
                  squares: [
                    "bg-neutral-800",
                    "bg-stone-200",
                    "bg-indigo-200",
                    "bg-neutral-800",
                  ],
                },
                {
                  label: "Outfit 2",
                  squares: [
                    "bg-white border border-default-200",
                    "bg-amber-100",
                    "bg-stone-300",
                    "bg-amber-900",
                  ],
                },
                {
                  label: "Outfit 3",
                  squares: [
                    "bg-rose-100",
                    "bg-neutral-200",
                    "bg-rose-200",
                    "bg-white border border-default-200",
                  ],
                },
              ].map((outfit) => (
                <div key={outfit.label} className="space-y-1.5">
                  <p className="text-[9px] uppercase tracking-widest text-default-400">
                    {outfit.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1 w-20 md:w-24">
                    {outfit.squares.map((cls, j) => (
                      <div key={j} className={`h-9 md:h-10 ${cls}`} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[10px] uppercase tracking-widest text-default-300 self-center">
                +&nbsp;more
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function ValuationCounter() {
  const counter = useCountUp(12450);

  return (
    <span
      ref={counter.ref}
      className="text-3xl md:text-4xl font-mono font-light tracking-tighter"
    >
      ${counter.count.toLocaleString()}
    </span>
  );
}

/* ========================================
   SECTION 5: CATALOG MARQUEE
   ======================================== */
const CATALOG_ROW_1 = [
  {
    name: "Leather Jacket",
    brand: "Acne Studios",
    price: "$4,000",
    img: "https://www.acnestudios.com/dw/image/v2/AAXV_PRD/on/demandware.static/-/Sites-acne-product-catalog/default/dw55929c47/images/A7/A70220-/2000x/A70220-900_Y.jpg?sw=1500&sh=2250",
  },
  {
    name: "White Sneakers",
    brand: "New Balance",
    price: "$145",
    img: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSIiYpLZjMHHaBKM7TA_1-BOE1LpK6rg9kS6DBo4O6zGx9DyjOwSqAKhoXQWQ2ENQ2I2VVtV2GogtLror9itYteZECCJ9Du",
  },
  {
    name: "Silk Skirt",
    brand: "Max Mara",
    price: "$1,475",
    img: "https://b2c-media.maxmara.com/sys-master/m0/MM/2026/1/6101026306/004/s3details/6101026306004-w-msecalle_normal.webp#product",
  },
  {
    name: "Wool Coat",
    brand: "Aritzia",
    price: "$425",
    img: "https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/f25_a05_127534_19070_off_a",
  },
  {
    name: "Vintage Denim",
    brand: "Levi's",
    price: "$120",
    img: "https://lscoglobal.scene7.com/is/image/lscoglobal/MB_00501-3604_GLO_CL_FV?fmt=webp&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=1320&hei=1320",
  },
  {
    name: "Sunglasses",
    brand: "Miu Miu",
    price: "$613",
    img: "https://assets2.sunglasshut.com/cdn-record-files-pi/a5a2f6ee-912c-4d70-9fac-b0c200337095/df18b7a0-8646-4962-95a2-b0c20033738f/0MU_11ZS__VAU2Z1__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=2048",
  },
  {
    name: "Heeled Sandals",
    brand: "Manolo Blahnik",
    price: "$1,245",
    img: "https://img.ssensemedia.com/images/f_auto/252140F122003_4/manolo-blahnik-black-maysli-heeled-sandals.jpg",
  },
  {
    name: "Small 25 Bag",
    brand: "Chanel",
    price: "$8,450",
    img: "https://www.chanel.com/images///f_auto,q_auto:good,dpr_1.1/w_1600/-9572544610334.jpg",
  },
];

const CATALOG_ROW_2 = [
  {
    name: "Blazer",
    brand: "Toteme",
    price: "$890",
    img: "https://www.mytheresa.com/media/1094/1238/100/64/P00825738.jpg",
  },
  {
    name: "Effortless Pants",
    brand: "Aritzia",
    price: "$85",
    img: "https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/s26_a06_77775_30751_off_a",
  },
  {
    name: "Cardogan",
    brand: "Aritzia",
    price: "$118",
    img: "https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_1500/s26_a03_114360_4425_off_a",
  },
  {
    name: "Trench Coat",
    brand: "Burberry",
    price: "$2,100",
    img: "https://assets.burberry.com/is/image/Burberryltd/9FAB380E-9232-4CAA-8BE7-B5974480F779?$BBY_V3_UNSHARP_SL_1$&wid=4000&hei=4000",
  },
  {
    name: "Midi Dress",
    brand: "Reformation",
    price: "$278",
    img: "https://assets.aritzia.com/image/upload/c_crop,ar_1920:2623,g_south/q_auto,f_auto,dpr_auto,w_800/s26_a08_132084_1274_off_a",
  },
  {
    name: "Ballet Flats",
    brand: "Chanel",
    price: "$1,600",
    img: "https://www.chanel.com/images///f_auto//-9543237763102.jpg",
  },
  {
    name: "Cotton Shirt",
    brand: "COS",
    price: "$55",
    img: "https://public.assets.hmgroup.com/assets/001/c0/16/c016e184c0fd876796eacd117171728fa30caf1e_xxl-1.jpg",
  },
  {
    name: "Wide Trousers",
    brand: "Mango",
    price: "$70",
    img: "https://shop.mango.com/assets/rcs/pics/static/T2/fotos/S/27085821_30_B.jpg?imwidth=2048&imdensity=1&ts=1767953150254",
  },
];

function CatalogTile({ item }: { item: (typeof CATALOG_ROW_1)[number] }) {
  return (
    <div className="flex-shrink-0 w-40 md:w-48 border border-default-200 overflow-hidden bg-background">
      <div className="relative h-28 md:h-36 bg-gray-200">
        <Image
          fill
          unoptimized
          alt={item.name}
          className="object-contain"
          src={item.img}
        />
      </div>
      <div className="p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider truncate">
          {item.name}
        </p>
        <p className="text-[9px] text-default-400 uppercase tracking-widest mt-0.5 truncate">
          {item.brand}
        </p>
        <p className="text-[10px] font-mono text-default-500 mt-1">
          {item.price}
        </p>
      </div>
    </div>
  );
}

function CatalogMarquee() {
  return (
    <section className="py-[var(--spacing-section)] overflow-hidden bg-default-50 border-y border-default-200">
      <Container size="xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 px-4 md:px-0">
          <motion.h2
            className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic"
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Browse the Catalog
          </motion.h2>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1 }}
          >
            <p className="text-sm text-default-500 max-w-xs">
              Thousands of cataloged items from the world&apos;s top brands —
              all in one place.
            </p>
            <DSButton as="a" href="/catalog" size="sm" variant="outline">
              View All
            </DSButton>
          </motion.div>
        </div>
      </Container>

      {/* Row 1 — scrolls left */}
      <div className="flex gap-4 pl-4 md:pl-8">
        <motion.div
          animate={{ x: [0, "-50%"] }}
          className="flex gap-4 flex-shrink-0"
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          {[...CATALOG_ROW_1, ...CATALOG_ROW_1].map((item, i) => (
            <CatalogTile key={i} item={item} />
          ))}
        </motion.div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="flex gap-4 pl-4 md:pl-8 mt-4">
        <motion.div
          animate={{ x: ["-50%", 0] }}
          className="flex gap-4 flex-shrink-0"
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          {[...CATALOG_ROW_2, ...CATALOG_ROW_2].map((item, i) => (
            <CatalogTile key={i} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ========================================
   SECTION 6: HOW IT WORKS
   ======================================== */
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Add",
      description:
        "Add items manually, photograph your existing wardrobe, or discover from our global catalog of thousands of cataloged pieces across top brands.",
      icon: <BookOpen className="w-8 h-8" />,
    },
    {
      number: "02",
      title: "Organize",
      description:
        "Tag by category, season, occasion, and brand. Create custom wardrobes and curated collections for any chapter of your life.",
      icon: <FolderOpen className="w-8 h-8" />,
    },
    {
      number: "03",
      title: "Style",
      description:
        "Plan outfits, track what you wear, and unlock insights on your fashion habits, spending patterns, and cost-per-wear.",
      icon: <Sparkles className="w-8 h-8" />,
    },
  ];

  return (
    <section className="py-[var(--spacing-section)] px-4 md:px-6">
      <Container size="xl">
        <motion.h2
          className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-12 md:mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          How It Works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-default-200" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="text-center relative"
              initial={{ opacity: 0, y: 30 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 border border-default-200 bg-background mb-6 relative z-10">
                {step.icon}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-default-400 mb-2">
                Step {step.number}
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-default-500 max-w-xs mx-auto leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ========================================
   SECTION 7: WISHLIST + COLLECTIONS
   ======================================== */
const WISHLIST_ITEMS = [
  { name: "Linen Blazer", brand: "COS", price: "$195", bg: "bg-stone-200" },
  {
    name: "Platform Boots",
    brand: "Steve Madden",
    price: "$160",
    bg: "bg-neutral-800",
  },
  {
    name: "Wrap Dress",
    brand: "Reformation",
    price: "$320",
    bg: "bg-emerald-100",
  },
  { name: "Bucket Hat", brand: "Jacquemus", price: "$240", bg: "bg-amber-200" },
];

const COLLECTIONS = [
  {
    name: "Summer Capsule",
    count: 14,
    squares: [
      "bg-white border border-default-200",
      "bg-stone-200",
      "bg-sky-100",
      "bg-amber-100",
    ],
  },
  {
    name: "Work Wardrobe",
    count: 22,
    squares: [
      "bg-neutral-800",
      "bg-neutral-600",
      "bg-stone-300",
      "bg-white border border-default-200",
    ],
  },
  {
    name: "Weekend Fits",
    count: 18,
    squares: [
      "bg-indigo-200",
      "bg-neutral-300",
      "bg-white border border-default-200",
      "bg-stone-800",
    ],
  },
];

function WishlistCollections() {
  return (
    <section className="py-[var(--spacing-section)] px-4 md:px-6 bg-default-50 border-y border-default-200">
      <Container size="xl">
        <motion.h2
          className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-8 md:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Save &amp; Curate
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wishlist panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="border border-default-200 bg-background p-6 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 border border-default-200 bg-default-50">
                  <Heart size={18} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter italic">
                  Wishlist
                </h3>
              </div>
              <p className="text-sm text-default-500 mb-6 ml-12">
                Save items you love before buying. Never lose track of something
                you wanted.
              </p>

              <div className="space-y-2">
                {WISHLIST_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 border border-default-200 hover:border-default-400 transition-colors"
                  >
                    <div className={`w-9 h-9 flex-shrink-0 ${item.bg}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-default-400 uppercase tracking-widest">
                        {item.brand}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-default-500 flex-shrink-0">
                      {item.price}
                    </span>
                    <Heart className="w-3.5 h-3.5 text-default-300 flex-shrink-0" />
                  </div>
                ))}

                <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-default-200 text-default-400">
                  <span className="text-[10px] uppercase tracking-widest">
                    + Add more items
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Collections panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="bg-foreground text-background p-6 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 border border-current/20 bg-current/10">
                  <BookOpen className="opacity-80" size={18} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter italic">
                  Collections
                </h3>
              </div>
              <p className="text-sm opacity-50 mb-6 ml-12">
                Curate themed capsule wardrobes for any season, trip, or chapter
                of your style.
              </p>

              <div className="space-y-3">
                {COLLECTIONS.map((col) => (
                  <div
                    key={col.name}
                    className="border border-current/20 p-4 hover:border-current/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {col.name}
                      </p>
                      <span className="text-[10px] font-mono opacity-40">
                        {col.count} items
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {col.squares.map((cls, j) => (
                        <div key={j} className={`h-8 ${cls}`} />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-current/20 opacity-40">
                  <span className="text-[10px] uppercase tracking-widest">
                    + New collection
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================
   SECTION 8: TESTIMONIALS
   ======================================== */
const TESTIMONIALS = [
  {
    quote:
      "It's like having a personal stylist that actually knows what's in my closet.",
    name: "Maria K.",
    role: "Fashion Enthusiast",
  },
  {
    quote:
      "I stopped buying duplicates and finally know my actual cost-per-wear on everything I own.",
    name: "James T.",
    role: "Minimalist",
  },
  {
    quote:
      "Planning outfits the night before used to take forever. Now it takes two minutes.",
    name: "Priya S.",
    role: "Early Adopter",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-[var(--spacing-section)] px-4 md:px-6">
      <Container size="xl">
        <motion.h2
          className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-10 md:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          What People Say
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={i}
              className="bg-default-50 border border-default-200 p-6 md:p-8 flex flex-col justify-between gap-6 hover:border-default-400 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <p className="text-base md:text-lg italic font-light leading-snug text-foreground/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="w-8 h-8 bg-default-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-default-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-default-400 uppercase tracking-widest">
                    {t.role}
                  </p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ========================================
   SECTION 9: FINAL CTA
   ======================================== */
function FinalCTA() {
  return (
    <section className="py-[var(--spacing-section)] px-4 md:px-6 bg-foreground text-background">
      <Container size="lg">
        <motion.div
          className="text-center space-y-6 md:space-y-8"
          initial={{ opacity: 0, y: 30 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic">
            Join a Community That Takes Fashion Seriously.
          </h2>
          <p className="text-sm md:text-base opacity-60 max-w-xl mx-auto">
            Discover real outfits from real people. Share your style, follow
            people whose taste you love, and build a wardrobe with intention.
          </p>
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <DSButton
              as="a"
              className="bg-background text-foreground hover:opacity-90"
              href="/signup"
              size="lg"
              variant="primary"
            >
              Join the Community
            </DSButton>
            <p className="text-xs opacity-40 uppercase tracking-widest mt-2 md:mt-4">
              Free &bull; No Credit Card Required
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ========================================
   MAIN LANDING PAGE
   ======================================== */
export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col bg-background text-foreground">
      <AnimatePresence onExitComplete={() => setReady(true)}>
        {loading && <PageLoader />}
      </AnimatePresence>
      <HeroSection ready={ready} />
      <CategoryStrip />
      <StatsBar />
      <FeatureBentoGrid />
      <CatalogMarquee />
      <HowItWorks />
      <WishlistCollections />
      <TestimonialsSection />
      <FinalCTA />
    </div>
  );
}
