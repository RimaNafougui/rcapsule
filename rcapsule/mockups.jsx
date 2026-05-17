/* Inline UI mockups for the rcapsule app — drawn entirely in HTML/CSS */
const { useEffect, useState, useRef } = React;

/* A flat, color-coded swatch standing in for a garment thumbnail */
const Garment = ({
  tone,
  pattern,
  label,
  w = "w-full",
  h = "h-full",
  small = false,
}) => {
  const tones = {
    charcoal: "bg-[#2A2A28]",
    sand: "bg-[#C9BFA7]",
    cream: "bg-[#E8E0CC]",
    bone: "bg-[#D9D4C5]",
    olive: "bg-[#5C5A45]",
    rust: "bg-[#8A4A2B]",
    navy: "bg-[#1F2530]",
    ink: "bg-[#111111]",
    smoke: "bg-[#7A7A74]",
    ecru: "bg-[#EFEADA]",
    moss: "bg-[#4A5A3B]",
    plum: "bg-[#3C2A33]",
    paper: "bg-[#F4F1E8]",
    rose: "bg-[#B89B92]",
  };
  return (
    <div
      className={`${w} ${h} ${tones[tone] || tones.bone} relative swatch-edge overflow-hidden`}
    >
      {pattern === "stripe" && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 6px)",
          }}
        />
      )}
      {pattern === "check" && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 10px)",
          }}
        />
      )}
      {pattern === "denim" && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 3px)",
          }}
        />
      )}
      {label && !small && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[8px] font-mono uppercase tracking-wider text-white/80 truncate">
          {label}
        </div>
      )}
    </div>
  );
};

/* Mockup 1 — Closet grid */
const catalogueMockup = () => (
  <div className="bg-paper border hairline w-full h-full flex flex-col">
    <div className="flex items-center justify-between px-3 py-2 border-b hairline">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-ink"></div>
        <span className="text-[9px] font-mono uppercase tracking-widest">
          Closet — All
        </span>
      </div>
      <span className="num text-[9px] text-stone">214 items</span>
    </div>
    <div className="flex-1 p-2 grid grid-cols-5 gap-1.5">
      <Garment tone="charcoal" label="Wool coat" />
      <Garment tone="cream" label="Linen shirt" />
      <Garment tone="denim" pattern="denim" label="Selvedge" />
      <Garment tone="sand" label="Chinos" />
      <Garment tone="ink" label="Leather" />
      <Garment tone="bone" pattern="stripe" label="Tee" />
      <Garment tone="olive" label="Field jkt" />
      <Garment tone="ecru" label="Cardigan" />
      <Garment tone="navy" pattern="check" label="Flannel" />
      <Garment tone="rust" label="Suede" />
      <Garment tone="paper" label="Oxford" />
      <Garment tone="moss" label="Sweater" />
      <Garment tone="smoke" label="Trouser" />
      <Garment tone="plum" label="Knit" />
      <Garment tone="rose" label="Henley" />
    </div>
  </div>
);

/* Mockup 2 — Wear tracker / item detail */
const TrackMockup = () => (
  <div className="bg-paper border hairline w-full h-full flex">
    <div className="w-2/5 border-r hairline relative">
      <Garment tone="charcoal" w="w-full" h="h-full" pattern="" label="" />
      <div className="absolute bottom-2 left-2 text-[8px] font-mono uppercase tracking-widest text-white/80">
        IMG_4421
      </div>
    </div>
    <div className="flex-1 p-3 flex flex-col">
      <div className="text-[9px] font-mono uppercase tracking-widest text-stone">
        Outerwear · Wool
      </div>
      <div className="text-[15px] mt-1 leading-tight">Charcoal Overcoat</div>
      <div className="text-[10px] text-stone mt-0.5">Acquired Nov 2023</div>
      <div className="mt-3 border-t hairline pt-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone">
            Worn
          </span>
          <span className="num text-[15px]">37×</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone">
            Cost/wear
          </span>
          <span className="num text-[15px]">$16.21</span>
        </div>
      </div>
      <div className="mt-auto pt-2 border-t hairline">
        <div className="text-[9px] font-mono uppercase tracking-widest text-stone mb-1">
          Recent
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 ${[1, 3, 4, 7, 9, 10, 12].includes(i) ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* Mockup 3 — Outfit builder */
const OutfitMockup = () => (
  <div className="bg-paper border hairline w-full h-full p-3 flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[9px] font-mono uppercase tracking-widest">
        Outfit · 04.18
      </span>
      <span className="text-[9px] font-mono uppercase tracking-widest text-stone">
        5 pieces
      </span>
    </div>
    <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-1.5">
      <div className="row-span-1">
        <Garment tone="charcoal" label="Coat" />
      </div>
      <div className="row-span-2">
        <Garment tone="ecru" label="Knit" />
      </div>
      <div className="row-span-2">
        <Garment tone="denim" pattern="denim" label="Jeans" />
      </div>
      <div className="row-span-1">
        <Garment tone="ink" label="Boot" />
      </div>
    </div>
    <div className="mt-2 pt-2 border-t hairline flex items-baseline justify-between">
      <span className="text-[9px] font-mono uppercase tracking-widest text-stone">
        Total value
      </span>
      <span className="num text-[12px]">$1,840</span>
    </div>
  </div>
);

/* Mockup 4 — Community grid */
const CommunityMockup = () => {
  const cards = [
    { tone: "charcoal", user: "maren_o", items: "42" },
    { tone: "sand", user: "tobias.k", items: "118" },
    { tone: "olive", user: "inea", items: "63" },
    { tone: "ecru", user: "fairwell", items: "201" },
  ];
  return (
    <div className="bg-paper border hairline w-full h-full p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono uppercase tracking-widest">
          Discover
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-stone">
          Real closets
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {cards.map((c, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex-1 relative">
              <Garment tone={c.tone} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-mono">@{c.user}</span>
              <span className="text-[9px] font-mono text-stone">{c.items}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Cost-per-wear hero visual */
const CPWVisual = ({ price, wears }) => {
  const cpw = price / Math.max(wears, 1);
  return (
    <div className="w-full h-full bg-ink text-paper relative overflow-hidden">
      {/* Faint vertical grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #FAFAF7 1px, transparent 1px)",
          backgroundSize: "8.3333% 100%",
        }}
      />

      <div className="relative p-8 md:p-12 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-mist">Example · Overcoat</span>
          <span className="eyebrow text-mist">Live calc</span>
        </div>

        <div className="mt-auto">
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-12 md:col-span-4">
              <div className="eyebrow text-mist mb-3">Purchase price</div>
              <div className="num display text-[clamp(48px,7vw,96px)]">
                ${price}
              </div>
            </div>
            <div className="col-span-12 md:col-span-1 flex justify-center pb-4">
              <div className="text-mist text-3xl font-thin">÷</div>
            </div>
            <div className="col-span-12 md:col-span-3">
              <div className="eyebrow text-mist mb-3">Times worn</div>
              <div className="num display text-[clamp(48px,7vw,96px)]">
                {wears}
              </div>
            </div>
            <div className="col-span-12 md:col-span-1 flex justify-center pb-4">
              <div className="text-mist text-3xl font-thin">=</div>
            </div>
            <div className="col-span-12 md:col-span-3">
              <div className="eyebrow text-mist mb-3">Cost per wear</div>
              <div className="num display text-[clamp(56px,8vw,112px)] text-paper">
                ${cpw.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-mist/30 grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 serif-italic text-[clamp(20px,2.2vw,30px)] text-paper leading-snug">
              The coat doesn&rsquo;t get cheaper.{" "}
              <span className="text-mist">It earns its keep.</span>
            </div>
            <div className="col-span-12 md:col-span-4 flex md:justify-end items-end">
              <span className="eyebrow text-mist">rcapsule / log.wear</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Collections card */
const CollectionCard = ({ name, season, count, tones }) => (
  <div className="border hairline bg-paper p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="eyebrow">{season}</span>
      <span className="num text-[10px] text-stone">{count} pcs</span>
    </div>
    <div className="grid grid-cols-4 gap-1 aspect-[4/2.2]">
      {tones.map((t, i) => (
        <Garment key={i} tone={t} />
      ))}
    </div>
    <div className="text-[18px] font-light leading-tight">{name}</div>
  </div>
);

/* Wishlist row */
const WishlistRow = ({ name, brand, price, status }) => (
  <div className="grid grid-cols-12 gap-4 py-4 border-b hairline items-center">
    <div className="col-span-1">
      <Garment tone={status === "owned" ? "ink" : "bone"} h="h-10" w="w-10" />
    </div>
    <div className="col-span-5">
      <div className="text-[14px] leading-tight">{name}</div>
      <div className="text-[11px] text-stone mt-0.5 font-mono uppercase tracking-wider">
        {brand}
      </div>
    </div>
    <div className="col-span-3 num text-[14px]">${price}</div>
    <div className="col-span-3 text-right">
      <span
        className={`eyebrow ${status === "owned" ? "text-ink" : status === "watch" ? "text-stone" : "text-stone"}`}
      >
        {status === "owned"
          ? "✓ Owned"
          : status === "watch"
            ? "Watching"
            : "Wishlist"}
      </span>
    </div>
  </div>
);

Object.assign(window, {
  Garment,
  catalogueMockup,
  TrackMockup,
  OutfitMockup,
  CommunityMockup,
  CPWVisual,
  CollectionCard,
  WishlistRow,
});
