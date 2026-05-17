/* rcapsule — Landing Page
   Editorial, monochrome, typography-forward.
   Single-file LandingPage with named sub-components for each section.
*/
const { useEffect, useState, useRef, useMemo, createContext, useContext } =
  React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  headline: "100 / 20",
  cpwTheme: "dark",
  displayWeight: "thin",
  showGridLines: true,
  italicAccent: true,
  tone: "warm",
}; /*EDITMODE-END*/

const TweaksCtx = createContext(TWEAK_DEFAULTS);
const useTweakValues = () => useContext(TweaksCtx);

const HEADLINES = {
  "100 / 20": ["You own", "a hundred things.", "You wear twenty."],
  "Closet vs. rotation": ["Your closet", "is full.", "Your rotation isn't."],
  Receipts: ["Your wardrobe,", "with the", "receipts."],
  "Cost the coat": ["What does", "the coat", "actually cost?"],
};

/* ------------------------------------------------------------------ */
/* Utilities                                                            */
/* ------------------------------------------------------------------ */

const Reveal = ({
  children,
  delay = 0,
  as = "div",
  className = "",
  fade = false,
  ...rest
}) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      style={{ "--rd": `${delay}ms` }}
      className={`${fade ? "reveal-fade" : "reveal"} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
};

const Container = ({ children, className = "", wide = false }) => (
  <div
    className={`w-full mx-auto ${wide ? "max-w-[1480px]" : "max-w-[1320px]"} px-6 md:px-10 lg:px-14 ${className}`}
  >
    {children}
  </div>
);

const DSButton = ({
  children,
  variant = "dark",
  href,
  onClick,
  className = "",
  icon = null,
}) => {
  const base =
    "inline-flex items-center justify-center gap-3 h-[52px] px-7 text-[13px] font-mono uppercase tracking-[0.16em]";
  const cls = variant === "dark" ? "btn-dark" : "btn-ghost";
  const inner = (
    <>
      <span>{children}</span>
      {icon !== false && <span className="inline-block translate-y-px">→</span>}
    </>
  );
  if (href)
    return (
      <a href={href} className={`${base} ${cls} ${className}`}>
        {inner}
      </a>
    );
  return (
    <button onClick={onClick} className={`${base} ${cls} ${className}`}>
      {inner}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Nav                                                                  */
/* ------------------------------------------------------------------ */

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${scrolled ? "bg-paper/85 backdrop-blur-md border-b hairline" : "bg-transparent border-b border-transparent"}`}
    >
      <Container>
        <div className="h-[68px] flex items-center justify-between">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="text-[20px] tracking-tight font-light">
              rcapsule
            </span>
            <span className="num text-[10px] text-stone">v.01</span>
          </a>
          <nav className="hidden md:flex items-center gap-9">
            {["Closet", "Cost-per-wear", "Community", "Founder"].map((l, i) => (
              <a
                key={l}
                href={`#${["features", "cpw", "community", "founder"][i]}`}
                className="text-[12px] uppercase tracking-[0.18em] font-mono text-ink hover:text-stone transition"
              >
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#signup"
              className="hidden md:inline text-[12px] uppercase tracking-[0.18em] font-mono mr-3"
            >
              Sign in
            </a>
            <DSButton href="#signup" className="!h-[40px] !px-5 !text-[11px]">
              Start free
            </DSButton>
          </div>
        </div>
      </Container>
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* Section 1 — Hero                                                     */
/* ------------------------------------------------------------------ */

const Hero = () => {
  const t = useTweakValues();
  const today = new Date();
  const date = today
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
  const lines = HEADLINES[t.headline] || HEADLINES["100 / 20"];

  return (
    <section
      id="top"
      className="relative pt-[140px] md:pt-[180px] pb-16 md:pb-24 overflow-hidden"
    >
      {/* Faint column guides */}
      {t.showGridLines && (
        <div className="absolute inset-0 pointer-events-none">
          <Container>
            <div className="grid grid-cols-12 h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`${i === 0 ? "" : "border-l hairline"} opacity-60 h-full`}
                />
              ))}
            </div>
          </Container>
        </div>
      )}

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
            Founder build
          </div>
          <div className="hidden md:block col-span-3 eyebrow text-stone text-right">
            5,566 items catalogued
          </div>
        </Reveal>

        {/* Headline */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10">
            <Reveal
              as="h1"
              className={`${t.displayWeight === "thin" ? "display-thin" : "display"} text-[clamp(56px,11vw,196px)]`}
            >
              <span className="block">{lines[0]}</span>
              <span className="block">{lines[1]}</span>
              <span
                className={`block ${t.italicAccent ? "serif-italic font-normal" : ""} text-stone`}
              >
                {lines[2]}
              </span>
            </Reveal>
          </div>
        </div>

        {/* Subhead + CTAs */}
        <div className="grid grid-cols-12 gap-6 mt-14 md:mt-20">
          <Reveal
            delay={120}
            className="col-span-12 md:col-span-5 lg:col-span-4"
          >
            <div className="eyebrow text-stone mb-4">What rcapsule does</div>
            <p className="text-[18px] md:text-[20px] leading-snug font-light text-ink/90 max-w-md">
              A wardrobe operating system. catalogue every piece, track every
              wear, build outfits, and watch cost-per-wear fall in real time.
            </p>
          </Reveal>

          <div className="col-span-12 md:col-span-7 lg:col-span-7 md:col-start-6 lg:col-start-6 flex flex-col">
            <Reveal delay={220} className="flex flex-wrap items-center gap-4">
              <DSButton href="/signup">Start your closet</DSButton>
              <DSButton href="/discover" variant="ghost">
                Explore the community
              </DSButton>
            </Reveal>
            <Reveal delay={320} className="mt-5 eyebrow text-stone">
              Free · No credit card · Web app, live today
            </Reveal>
          </div>
        </div>

        {/* Hero specimen — micro mockup row */}
        <Reveal delay={420} className="mt-20 md:mt-28">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 flex items-center justify-between mb-2">
              <span className="eyebrow text-stone">
                Specimen — Founder closet, partial
              </span>
              <span className="eyebrow text-stone hidden md:inline">
                Updated 4 min ago
              </span>
            </div>
            <div className="col-span-12">
              <div className="border-t border-b hairline-strong py-3 overflow-hidden">
                <div
                  className="grid grid-cols-12 md:grid-cols-16 gap-2"
                  style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
                >
                  {[
                    ["charcoal", ""],
                    ["cream", ""],
                    ["denim", "denim"],
                    ["sand", ""],
                    ["ink", ""],
                    ["bone", "stripe"],
                    ["olive", ""],
                    ["ecru", ""],
                    ["navy", "check"],
                    ["rust", ""],
                    ["paper", ""],
                    ["moss", ""],
                    ["smoke", ""],
                    ["plum", ""],
                    ["rose", ""],
                    ["charcoal", ""],
                  ].map(([t, p], i) => (
                    <div key={i} className="aspect-[3/4]">
                      <Garment tone={t} pattern={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-12 flex items-center justify-between mt-2">
              <span className="num text-[11px] text-stone">
                5,566 ITEMS · 12 CATEGORIES · 84 BRANDS
              </span>
              <span className="eyebrow text-stone">↓ scroll</span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section 2 — The Problem                                              */
/* ------------------------------------------------------------------ */

const Problem = () => {
  return (
    <section className="py-28 md:py-44 border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">02 · The problem</div>
          </Reveal>

          <div className="col-span-12 md:col-span-9">
            <Reveal as="h2" className="display text-[clamp(40px,6.5vw,104px)]">
              The most expensive thing
              <br />
              in your closet is the
              <br />
              <span className="serif-italic font-normal text-stone">
                thing you never wear.
              </span>
            </Reveal>

            <div className="mt-20 md:mt-28 grid grid-cols-12 gap-6 items-end">
              <Reveal delay={120} className="col-span-12 md:col-span-5">
                <div className="num display text-[clamp(72px,10vw,168px)] leading-none">
                  $1,700
                </div>
                <div className="eyebrow text-stone mt-4">
                  Avg. unworn clothing per person
                </div>
              </Reveal>
              <Reveal
                delay={220}
                className="col-span-12 md:col-span-4 md:col-start-7"
              >
                <p className="text-[17px] leading-snug font-light text-ink/85">
                  You bought it because it was on sale, because it almost fit,
                  because you were going to become someone who wore it. It sits
                  there.
                </p>
                <div className="mt-6 eyebrow text-stone">
                  Source — Ohio State University, 2023
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section 3 — Cost-per-wear (HERO MOMENT)                              */
/* ------------------------------------------------------------------ */

const CostPerWear = () => {
  const t = useTweakValues();
  const [price, setPrice] = useState(600);
  const [wears, setWears] = useState(80);
  const dark = t.cpwTheme !== "light";
  const bg = dark ? "bg-ink text-paper" : "bg-paper text-ink border-t hairline";
  const muted = dark ? "text-mist" : "text-stone";
  const borderTone = dark ? "border-mist/20" : "hairline";
  const accentBar = dark ? "bg-paper" : "bg-ink";

  return (
    <section
      id="cpw"
      className={`${bg} py-24 md:py-36 relative overflow-hidden`}
    >
      <Container wide>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className={`eyebrow ${muted}`}>03 · Cost-per-wear</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2
              className={`display text-[clamp(40px,6vw,96px)] ${dark ? "text-paper" : "text-ink"}`}
            >
              Every time you wear it,
              <br />
              <span className={`serif-italic ${muted} font-normal`}>
                it gets cheaper.
              </span>
            </h2>
            <p
              className={`mt-6 max-w-xl ${muted} text-[16px] md:text-[18px] font-light leading-snug`}
            >
              rcapsule tracks every wear and divides it into what you paid. The
              math is honest. The numbers are yours.
            </p>
          </Reveal>
        </div>

        <Reveal delay={140} className="mt-20 md:mt-28">
          <div className={`border ${borderTone}`}>
            {/* Header strip */}
            <div
              className={`flex items-center justify-between px-6 md:px-10 py-4 border-b ${borderTone}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 ${accentBar}`} />
                <span className={`eyebrow ${muted}`}>
                  Interactive · drag the values
                </span>
              </div>
              <span className={`eyebrow ${muted} hidden md:inline`}>Live</span>
            </div>

            {/* Big equation */}
            <div className="px-6 md:px-10 py-12 md:py-16">
              <div className="grid grid-cols-12 gap-4 md:gap-8 items-end">
                <div className="col-span-12 md:col-span-4">
                  <div className={`eyebrow ${muted} mb-3`}>Purchase price</div>
                  <div className="num display text-[clamp(56px,9vw,144px)] leading-[0.85]">
                    ${price}
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2500"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(+e.target.value)}
                    className={`cpw-range ${dark ? "" : "cpw-range--light"} w-full mt-6`}
                  />
                  <div
                    className={`flex justify-between mt-1 num text-[10px] ${muted}`}
                  >
                    <span>$50</span>
                    <span>$2,500</span>
                  </div>
                </div>

                <div
                  className={`hidden md:flex col-span-1 justify-center pb-12 ${muted} text-4xl font-thin`}
                >
                  ÷
                </div>

                <div className="col-span-12 md:col-span-3">
                  <div className={`eyebrow ${muted} mb-3`}>Times worn</div>
                  <div className="num display text-[clamp(56px,9vw,144px)] leading-[0.85]">
                    {wears}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="300"
                    step="1"
                    value={wears}
                    onChange={(e) => setWears(+e.target.value)}
                    className={`cpw-range ${dark ? "" : "cpw-range--light"} w-full mt-6`}
                  />
                  <div
                    className={`flex justify-between mt-1 num text-[10px] ${muted}`}
                  >
                    <span>1</span>
                    <span>300</span>
                  </div>
                </div>

                <div
                  className={`hidden md:flex col-span-1 justify-center pb-12 ${muted} text-4xl font-thin`}
                >
                  =
                </div>

                <div className="col-span-12 md:col-span-3">
                  <div className={`eyebrow ${muted} mb-3`}>Cost per wear</div>
                  <div
                    className={`num display text-[clamp(64px,10vw,176px)] leading-[0.85] ${dark ? "text-paper" : "text-ink"} tabular`}
                  >
                    ${(price / Math.max(wears, 1)).toFixed(2)}
                  </div>
                  <div className={`mt-6 eyebrow ${muted}`}>↑ adjust to see</div>
                </div>
              </div>
            </div>

            {/* Bottom strip */}
            <div
              className={`px-6 md:px-10 py-6 border-t ${borderTone} grid grid-cols-12 gap-6 items-center`}
            >
              <div className="col-span-12 md:col-span-8 serif-italic text-[clamp(20px,2.3vw,32px)] leading-snug">
                A coat for life beats four coats for the season.
              </div>
              <div
                className={`col-span-12 md:col-span-4 md:text-right eyebrow ${muted}`}
              >
                rcapsule / log.wear · auto-tracked
              </div>
            </div>
          </div>
        </Reveal>
      </Container>

      <style>{`
        .cpw-range { -webkit-appearance: none; appearance: none; background: transparent; height: 24px; }
        .cpw-range::-webkit-slider-runnable-track { height: 1px; background: rgba(168,168,162,0.4); }
        .cpw-range::-moz-range-track { height: 1px; background: rgba(168,168,162,0.4); }
        .cpw-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; background: #FAFAF7; border-radius: 0; margin-top: -6px; cursor: ew-resize; }
        .cpw-range::-moz-range-thumb { width: 12px; height: 12px; background: #FAFAF7; border: none; border-radius: 0; cursor: ew-resize; }
        .cpw-range--light::-webkit-slider-runnable-track { background: rgba(10,10,10,0.2); }
        .cpw-range--light::-moz-range-track { background: rgba(10,10,10,0.2); }
        .cpw-range--light::-webkit-slider-thumb { background: #0A0A0A; }
        .cpw-range--light::-moz-range-thumb { background: #0A0A0A; }
      `}</style>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section 4 — Core features (4 tiles)                                  */
/* ------------------------------------------------------------------ */

const Features = () => {
  const tiles = [
    {
      n: "01",
      title: "catalogue your closet",
      body: "Every piece, photographed and tagged. Brand, fabric, price, season. Your whole wardrobe in one searchable surface.",
      mock: <catalogueMockup />,
    },
    {
      n: "02",
      title: "Track every wear",
      body: "One tap when you put it on. rcapsule logs the date, calculates cost-per-wear, and shows you what\u2019s actually earning its keep.",
      mock: <TrackMockup />,
    },
    {
      n: "03",
      title: "Build outfits",
      body: "Compose looks from pieces you already own. Save them, schedule them, repeat the ones that work.",
      mock: <OutfitMockup />,
    },
    {
      n: "04",
      title: "Discover the community",
      body: "Public profiles of real closets — not editorial spreads, not brand photography. Other people\u2019s actual wardrobes.",
      mock: <CommunityMockup />,
    },
  ];

  return (
    <section id="features" className="py-28 md:py-40 border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">04 · The system</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="display text-[clamp(40px,6.5vw,104px)]">
              Four surfaces.
              <br />
              <span className="serif-italic text-stone font-normal">
                One wardrobe.
              </span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l hairline">
          {tiles.map((t, i) => (
            <Reveal
              key={t.n}
              delay={i * 90}
              className="border-r border-b hairline"
            >
              <div className="feature-tile p-7 md:p-9 flex flex-col h-full min-h-[440px] md:min-h-[520px]">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-stone">{t.n}</span>
                  <span className="eyebrow text-stone">
                    {["catalogue", "Track", "Compose", "Share"][i]}
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-[28px] md:text-[34px] leading-[1.05] font-light tracking-tight max-w-[18ch]">
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
};

/* ------------------------------------------------------------------ */
/* Section 5 — How it works                                             */
/* ------------------------------------------------------------------ */

const HowItWorks = () => {
  const steps = [
    {
      n: "01",
      label: "Add",
      title: "Add your pieces",
      body: "Photograph, paste a link, or import a receipt. rcapsule extracts brand, price and category automatically.",
    },
    {
      n: "02",
      label: "Track",
      title: "Track & organise",
      body: "Tap to log a wear. Group items into collections — capsules, seasons, trips. Wishlist what you don\u2019t own yet.",
    },
    {
      n: "03",
      label: "Share",
      title: "Share your style",
      body: "Make your closet public. Outfits, wear data, value distribution — visible at exactly the depth you choose.",
    },
  ];

  return (
    <section className="py-28 md:py-40 border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-24">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">05 · How it works</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="display text-[clamp(40px,6.5vw,104px)]">
              Three moves.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t hairline-strong">
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 120}
              className={`pt-10 md:pt-14 pb-12 ${i < 2 ? "md:border-r hairline" : ""}`}
            >
              <div className="px-2">
                <div className="flex items-baseline justify-between">
                  <span className="num text-[64px] md:text-[88px] font-thin leading-none tracking-tight">
                    {s.n}
                  </span>
                  <span className="eyebrow text-stone">{s.label}</span>
                </div>
                <div className="mt-10 max-w-sm pr-6">
                  <h3 className="text-[28px] md:text-[34px] leading-tight font-light tracking-tight">
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
};

/* ------------------------------------------------------------------ */
/* Section 6 — Collections + Wishlist                                   */
/* ------------------------------------------------------------------ */

const CollectionsWishlist = () => {
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
            <div className="eyebrow text-stone">06 · Collections</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="display text-[clamp(40px,6.5vw,104px)]">
              Capsules, by you,{" "}
              <span className="serif-italic font-normal text-stone">
                from what you own.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] md:text-[18px] font-light leading-snug text-ink/85">
              Curate themed sets — a winter capsule, a packing list for Lisbon,
              a Monday-through-Friday rotation. Pieces you already have,
              arranged for the life you actually live.
            </p>
          </Reveal>
        </div>

        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cols.map((c, i) => (
            <CollectionCard key={i} {...c} />
          ))}
        </Reveal>

        {/* Wishlist */}
        <div className="mt-24 md:mt-32 grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-4">
            <div className="eyebrow text-stone mb-4">Wishlist</div>
            <h3 className="display text-[clamp(34px,4.5vw,68px)]">
              What you
              <br />
              haven&rsquo;t bought
              <br />
              <span className="serif-italic font-normal text-stone">yet.</span>
            </h3>
            <p className="mt-6 text-[15px] font-light text-ink/85 leading-snug max-w-sm">
              Track the pieces you&rsquo;re circling. Price alerts. A reason
              field, so future-you remembers why.
            </p>
          </Reveal>
          <Reveal delay={120} className="col-span-12 md:col-span-8">
            <div className="bg-paper border hairline">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b hairline-strong">
                <span className="col-span-6 eyebrow text-stone">Item</span>
                <span className="col-span-3 eyebrow text-stone">Price</span>
                <span className="col-span-3 eyebrow text-stone text-right">
                  Status
                </span>
              </div>
              <div className="px-5">
                <WishlistRow
                  name="Carpenter trouser, raw indigo"
                  brand="Mfg · Hokkaido"
                  price="248"
                  status="watch"
                />
                <WishlistRow
                  name="Mohair crewneck, ecru"
                  brand="Mfg · Glasgow"
                  price="320"
                  status="wishlist"
                />
                <WishlistRow
                  name="Suede chore coat, tobacco"
                  brand="Mfg · Lisbon"
                  price="540"
                  status="watch"
                />
                <WishlistRow
                  name="Leather derby, dark brown"
                  brand="Mfg · Northampton"
                  price="395"
                  status="owned"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section 7 — Community / Discover                                     */
/* ------------------------------------------------------------------ */

const Community = () => {
  // Fictional but plausible — note: usernames, not testimonials.
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
    <section id="community" className="py-28 md:py-40 border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6 mb-16 md:mb-20">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">07 · Community</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-9">
            <h2 className="display text-[clamp(40px,6.5vw,104px)]">
              Real closets.
              <br />
              <span className="serif-italic font-normal text-stone">
                Not a feed of staged shots.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-[16px] md:text-[18px] font-light leading-snug text-ink/85">
              Every public profile is someone&rsquo;s actual wardrobe — what
              they own, what they wear, what they paid. No sponsored posts. No
              editorial production. No influencer economy.
            </p>
          </Reveal>
        </div>

        <Reveal className="grid grid-cols-1 md:grid-cols-3 border-t border-l hairline">
          {profiles.map((p, i) => (
            <div
              key={p.user}
              className="border-r border-b hairline p-5 hover:bg-soft transition"
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
          delay={160}
          className="mt-12 flex items-center justify-between border-t hairline-strong pt-6"
        >
          <div className="eyebrow text-stone">
            Profiles are fictional in this preview. Real ones coming with
            launch.
          </div>
          <a href="/discover" className="eyebrow underline underline-offset-4">
            Open /discover →
          </a>
        </Reveal>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section 8 — Founder note                                             */
/* ------------------------------------------------------------------ */

const Founder = () => {
  return (
    <section id="founder" className="py-28 md:py-44 border-t hairline">
      <Container>
        <div className="grid grid-cols-12 gap-6">
          <Reveal className="col-span-12 md:col-span-3">
            <div className="eyebrow text-stone">08 · Founder note</div>
          </Reveal>
          <Reveal className="col-span-12 md:col-span-8">
            <p className="serif-italic text-[clamp(28px,3.6vw,52px)] leading-[1.18] text-ink">
              &ldquo;I built rcapsule because I kept buying clothes I already
              had — a third charcoal sweater, another pair of dark jeans. The
              closet was full. The rotation was twelve pieces.
              <br />
              <br />
              I wanted to see my wardrobe the way I see a portfolio: every item,
              every wear, what it actually costs me.
              <br />
              <br />
              <span className="not-italic font-light text-stone text-[clamp(18px,1.4vw,22px)] leading-snug block mt-6">
                Right now I&rsquo;m the only user. 5,566 of my own items are in
                the system. The product is live, free, and built. If you spend
                real money on clothes and want to understand what you own, come
                build your closet next to mine.&rdquo;
              </span>
            </p>
            <div className="mt-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-ink"></div>
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
};

/* ------------------------------------------------------------------ */
/* Section 9 — Final CTA                                                */
/* ------------------------------------------------------------------ */

const FinalCTA = () => {
  return (
    <section
      id="signup"
      className="bg-ink text-paper py-28 md:py-48 relative overflow-hidden"
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
          <div className="eyebrow text-mist">09 · Begin</div>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <h2 className="display text-[clamp(56px,11vw,200px)] text-paper">
            Your wardrobe
            <br />
            has a story.
          </h2>
          <h2 className="display text-[clamp(56px,11vw,200px)] serif-italic font-normal text-mist mt-2">
            Time to tell it.
          </h2>
        </Reveal>

        <Reveal delay={220} className="mt-16 md:mt-24 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-3 h-[64px] px-9 bg-paper text-ink text-[13px] font-mono uppercase tracking-[0.18em] hover:bg-mist transition"
              >
                Start your closet <span className="translate-y-px">→</span>
              </a>
              <a
                href="/discover"
                className="inline-flex items-center gap-3 h-[64px] px-9 border border-mist/40 text-paper text-[13px] font-mono uppercase tracking-[0.18em] hover:bg-mist/10 transition"
              >
                Browse community
              </a>
            </div>
            <div className="mt-6 eyebrow text-mist">
              Free · No credit card · Web app, live today
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 md:text-right">
            <div className="eyebrow text-mist">The fine print</div>
            <p className="mt-3 text-mist text-[14px] font-light leading-snug max-w-sm md:ml-auto">
              Pre-launch. One user so far (the founder). No waitlist, no virtual
              line, no &ldquo;join early&rdquo; tax. Sign up, build your closet,
              and the product opens.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

const Footer = () => (
  <footer className="bg-ink text-paper border-t border-mist/20">
    <Container>
      <div className="py-10 grid grid-cols-12 gap-6 items-baseline">
        <div className="col-span-12 md:col-span-4">
          <div className="text-[20px] font-light">rcapsule</div>
          <div className="eyebrow text-mist mt-2">
            A wardrobe operating system
          </div>
        </div>
        <div className="col-span-6 md:col-span-2 eyebrow text-mist space-y-2">
          <div className="text-paper">Product</div>
          <div>
            <a href="#features">Features</a>
          </div>
          <div>
            <a href="#cpw">Cost-per-wear</a>
          </div>
          <div>
            <a href="#community">Community</a>
          </div>
        </div>
        <div className="col-span-6 md:col-span-2 eyebrow text-mist space-y-2">
          <div className="text-paper">Account</div>
          <div>
            <a href="/signup">Sign up</a>
          </div>
          <div>
            <a href="/login">Sign in</a>
          </div>
          <div>
            <a href="/discover">Discover</a>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 md:text-right">
          <div className="eyebrow text-mist">v.01 · pre-launch · 2026</div>
          <div className="eyebrow text-mist mt-2">
            Made by one person, for now.
          </div>
        </div>
      </div>
      <div className="py-6 border-t border-mist/20 flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow text-mist">© rcapsule</span>
        <span className="eyebrow text-mist">Terms · Privacy · Press</span>
      </div>
    </Container>
  </footer>
);

/* ------------------------------------------------------------------ */
/* LandingPage (default export equivalent)                              */
/* ------------------------------------------------------------------ */

const TONE_BG = {
  warm: { paper: "#FAFAF7" },
  cool: { paper: "#F6F7F8" },
  neutral: { paper: "#F8F8F6" },
};

const LandingPage = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const c = TONE_BG[t.tone] || TONE_BG.warm;
    document.documentElement.style.setProperty("--paper", c.paper);
    document.body.style.backgroundColor = c.paper;
  }, [t.tone]);

  return (
    <TweaksCtx.Provider value={t}>
      <main
        className="text-ink min-h-screen"
        style={{ backgroundColor: (TONE_BG[t.tone] || TONE_BG.warm).paper }}
      >
        <Nav />
        <Hero />
        <Problem />
        <CostPerWear />
        <Features />
        <HowItWorks />
        <CollectionsWishlist />
        <Community />
        <Founder />
        <FinalCTA />
        <Footer />

        <TweaksPanel title="Tweaks">
          <TweakSection label="Hero" />
          <TweakSelect
            label="Headline"
            value={t.headline}
            options={Object.keys(HEADLINES)}
            onChange={(v) => setTweak("headline", v)}
          />
          <TweakToggle
            label="Italic accent line"
            value={t.italicAccent}
            onChange={(v) => setTweak("italicAccent", v)}
          />
          <TweakRadio
            label="Weight"
            value={t.displayWeight}
            options={["thin", "light"]}
            onChange={(v) => setTweak("displayWeight", v)}
          />
          <TweakToggle
            label="Column guides"
            value={t.showGridLines}
            onChange={(v) => setTweak("showGridLines", v)}
          />

          <TweakSection label="Cost-per-wear" />
          <TweakRadio
            label="Theme"
            value={t.cpwTheme}
            options={["dark", "light"]}
            onChange={(v) => setTweak("cpwTheme", v)}
          />

          <TweakSection label="Paper tone" />
          <TweakRadio
            label="Cast"
            value={t.tone}
            options={["warm", "cool", "neutral"]}
            onChange={(v) => setTweak("tone", v)}
          />
        </TweaksPanel>
      </main>
    </TweaksCtx.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<LandingPage />);
