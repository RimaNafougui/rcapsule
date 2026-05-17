# rcapsule — Design System

A reference document for the rcapsule wardrobe app. Read this before touching any UI.

> rcapsule should feel like a **fashion magazine that became software** — editorial restraint, typographic confidence, zero decoration for decoration's sake.

This is a living document. Every rule here exists because its opposite would make the product feel like generic SaaS.

---

## Table of contents

1. [Principles](#0-principles)
2. [Color system](#1-color-system)
3. [Typography](#2-typography)
4. [Spacing & layout](#3-spacing--layout)
5. [Border & radius](#4-border--radius)
6. [Component patterns](#5-component-patterns)
7. [Iconography](#6-iconography)
8. [Motion & animation](#7-motion--animation)
9. [Elevation & depth](#8-elevation--depth)
10. [Dark mode](#9-dark-mode)
11. [Voice & micro-copy](#10-voice--micro-copy)
12. [Conflicts to address](#11-conflicts-to-address)

---

## 0. Principles

Five non-negotiable rules. If a design or implementation choice violates one, it's wrong.

1. **Sharp corners.** `border-radius: 0` is the default. The only exception is pill chips for status (see §4).
2. **Borders, not shadows.** Depth is created by 1px borders and background contrast. No `box-shadow`. (One exception in §8.)
3. **Type is the design.** Composition is driven by typography. Headings are light-weight serif at scale; labels are uppercase tracking-widest 10–11px mono. Nothing in between is shouting.
4. **One accent, used like ink.** A single warm color (deep terracotta) appears as accent. Not blue. Not green. Never a gradient.
5. **No SaaS tropes.** No gradients. No emoji. No purple. No "Powered by ✨". No floating glass cards. No skeuomorphic illustrations. No 3D mockups.

---

## 1. Color system

**Principle:** A near-pure light/dark canvas, one warm accent, two semantic colors used sparingly. The palette should look like a magazine printed in two-and-a-half inks.

### 1.1 Accent — three candidates considered

| # | Name | Hex | Reasoning |
|---|---|---|---|
| A | **Deep Terracotta** | `#7A2E1F` | Warm enough to feel human, dark enough to behave as ink in long form. Reads as confident, not decorative. **← Chosen** |
| B | Dusty Burgundy | `#5C2A2F` | More editorial but verges on "wine brand." Less versatile against image content. |
| C | Muted Olive | `#4F4A2E` | Beautiful but reads as utility/military adjacent — pulls the product toward "workwear" when we want it broad. |

**Selected: `#7A2E1F` Deep Terracotta.** It survives next to garment photography across the entire color wheel, holds contrast on both light and dark backgrounds, and never reads as "tech."

Use the accent **sparingly**: pull-quote color, hover underlines on links inside long-form, the dot/marker for a primary brand mark. **Never** as a button fill, **never** as a background tint.

### 1.2 Light mode palette

| Token | Hex | Use |
|---|---|---|
| `--rc-background` | `#FFFFFF` | Page background. True white, not cream. |
| `--rc-foreground` | `#0A0A0A` | Primary text, primary button fills, the ink. |
| `--rc-surface` | `#F7F7F5` | Card surface, alt rows, section bands. Off-white with a hint of warm. |
| `--rc-surface-2` | `#EFEDE7` | Heavier surfaces (modals on light, hero strips). |
| `--rc-border` | `#E5E3DC` | Hairline borders, table dividers. Barely reads. |
| `--rc-border-strong` | `#0A0A0A` | Strong rules above section headers. |
| `--rc-muted` | `#6B6B66` | Secondary text, captions, eyebrow labels. |
| `--rc-mute-2` | `#A8A8A2` | Tertiary, placeholder text. |
| `--rc-accent` | `#7A2E1F` | Brand accent, pull quotes. |
| `--rc-accent-soft` | `#A45A4A` | Hover/active accent variant. |
| `--rc-danger` | `#8A1F1F` | Error text and danger borders only. Never a fill. |
| `--rc-success` | `#3F5C3A` | Muted moss-green. Confirmation only. |

### 1.3 Dark mode palette

A true inversion. Not navy. Not slate. Pure dark with the same accent.

| Token | Hex | Use |
|---|---|---|
| `--rc-background` | `#0A0A0A` | Page background. |
| `--rc-foreground` | `#FAFAF7` | Primary text. Subtle warm — pure #FFFFFF feels clinical. |
| `--rc-surface` | `#141413` | Cards. |
| `--rc-surface-2` | `#1C1C1B` | Heavier surfaces. |
| `--rc-border` | `#262624` | Hairline. |
| `--rc-border-strong` | `#FAFAF7` | Strong rule on dark. |
| `--rc-muted` | `#8E8E88` | Secondary text. |
| `--rc-mute-2` | `#5C5C58` | Tertiary text. |
| `--rc-accent` | `#B05A47` | Same hue as light terracotta, lifted for AA contrast on dark. |
| `--rc-accent-soft` | `#7A2E1F` | Accent variant. |
| `--rc-danger` | `#C25A5A` | Lifted for dark contrast. |
| `--rc-success` | `#7A9476` | Lifted for dark contrast. |

### 1.4 HeroUI mapping

```css
:root {
  --heroui-background:        var(--rc-background);
  --heroui-foreground:        var(--rc-foreground);
  --heroui-default-50:        var(--rc-surface);
  --heroui-default-100:       var(--rc-surface-2);
  --heroui-default-200:       var(--rc-border);
  --heroui-default-400:       var(--rc-muted);
  --heroui-default-500:       var(--rc-mute-2);
  --heroui-default-900:       var(--rc-foreground);

  --heroui-primary:           var(--rc-foreground); /* primary = black */
  --heroui-primary-foreground:var(--rc-background);

  --heroui-secondary:         var(--rc-accent);
  --heroui-secondary-foreground: var(--rc-background);

  --heroui-danger:            var(--rc-danger);
  --heroui-success:           var(--rc-success);

  --heroui-divider:           var(--rc-border);
  --heroui-focus:             var(--rc-foreground);
}
```

> **HeroUI primary = foreground.** This is intentional. Black is the primary action color; the terracotta accent is **not** a button color. If you reach for `color="secondary"` on a `<Button>`, stop and reconsider.

---

## 2. Typography

**Principle:** Three typefaces, one rhythm. Display does the talking, body explains, mono reports the numbers. Bold is a label tool, not a heading tool.

### 2.1 Families

| Role | Family | Why |
|---|---|---|
| **Display** | **Cormorant Garamond** (variable) | High-contrast editorial serif. Free on Google Fonts. Holds up at 200 weight in display sizes the way Playfair cannot. Avoids the "DM Serif Display blog-luxury" stigma. |
| **Body** | **Geist** | Clean, neutral, just-modern-enough. OpenType features (`ss01`, `cv11`) give it personality. Pairs with Cormorant by getting out of the way. |
| **Mono** | **JetBrains Mono** | Tabular numerals matter for cost-per-wear / price tables. JetBrains has stronger digit differentiation than Geist Mono and reads as "data," which is what numbers in rcapsule are. |

### 2.2 Imports

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
  rel="stylesheet"
/>
```

### 2.3 Type scale

All sizes use `clamp()` so they breathe. **No heading uses font-weight 600 or higher.**

| Token | Tailwind | Family | Size (clamp) | Weight | Leading | Tracking | Use |
|---|---|---|---|---|---|---|---|
| `display-8xl` | `text-display-8xl` | Cormorant | `clamp(72px, 12vw, 192px)` | 300 | 0.9 | -0.035em | Hero only. One per page. |
| `display-7xl` | `text-display-7xl` | Cormorant | `clamp(56px, 9vw, 144px)` | 300 | 0.92 | -0.03em | Big section heads. |
| `display-6xl` | `text-display-6xl` | Cormorant | `clamp(44px, 6.5vw, 112px)` | 300 | 0.95 | -0.025em | Section heads. |
| `display-5xl` | `text-display-5xl` | Cormorant | `clamp(36px, 5vw, 80px)` | 300 | 0.98 | -0.02em | Subsections. |
| `display-4xl` | `text-display-4xl` | Cormorant | `clamp(28px, 3.5vw, 56px)` | 400 | 1.05 | -0.015em | Page titles, modal headers. |
| `body-lg` | `text-body-lg` | Geist | 19px | 400 | 1.45 | -0.005em | Lead paragraphs. |
| `body` | `text-body` | Geist | 16px | 400 | 1.5 | 0 | Default body. |
| `body-sm` | `text-body-sm` | Geist | 14px | 400 | 1.5 | 0 | Secondary body, table cells. |
| `body-xs` | `text-body-xs` | Geist | 12px | 400 | 1.45 | 0.01em | Meta, footnotes. |
| `label-lg` | `text-label-lg` | JetBrains Mono | 12px | 500 | 1.2 | 0.18em | Section eyebrows. |
| `label` | `text-label` | JetBrains Mono | 11px | 500 | 1.2 | 0.18em | Standard labels, button text. |
| `label-xs` | `text-label-xs` | JetBrains Mono | 10px | 500 | 1.2 | 0.20em | Chips, table headers. |
| `num` | `font-num` | JetBrains Mono | inherit | 400 | inherit | 0 | All numeric data. `font-variant-numeric: tabular-nums`. |

> **Editorial italic.** `<em>` and `.serif-italic` inside body/display contexts use Cormorant Italic (`ital@1,400`) — it's the only place italics appear, and it's how editorial accent lines like "*you wear twenty*" are set.

### 2.4 Label pattern (formalized)

The most-used pattern in the app is small uppercase labels. Use the utility class:

```css
.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--rc-muted);
}
```

Or compose: `text-label-xs uppercase tracking-[0.20em] text-muted`. Don't invent new label scales — pick from `label-xs / label / label-lg`.

### 2.5 Rules

- **Never bold a heading.** If a heading needs more weight, make it bigger.
- **Never center body text.** Center headings only when the layout demands it. Default is left-aligned.
- **Letter-spacing scales with size.** Display sizes get negative tracking; labels get positive tracking. Body is 0.
- **`text-wrap: pretty`** on all headings and lead paragraphs.

---

## 3. Spacing & layout

**Principle:** Generous and consistent. Whitespace is content.

### 3.1 Spacing tokens

```css
--space-section:    160px;  /* desktop section padding, top/bottom */
--space-section-sm: 96px;   /* mobile section padding */
--space-gutter:     56px;   /* between major elements within a section */
--space-block:      32px;   /* between paragraphs / mini-blocks */
--space-tight:      16px;   /* default tight rhythm */
--space-hair:        8px;   /* hairline rhythm */
```

Use `py-section` (`py-[var(--space-section)]`) for any top-level section. **Never** mix `py-20`, `py-24`, `py-32` ad hoc on top-level sections — pick `py-section` or `py-section-sm`.

### 3.2 Container system

```css
.container-sm { max-width: 720px;  }  /* long-form, articles */
.container    { max-width: 1320px; }  /* default for content */
.container-lg { max-width: 1480px; }  /* hero / wide editorial */
.container-xl { max-width: 1640px; }  /* full-bleed bookended */
```

Horizontal padding **always**:
- Mobile: `px-4` (16px)
- Tablet: `md:px-6` (24px)
- Desktop: `lg:px-8` (32px)

For editorial sections that benefit from more air, step to `lg:px-14`.

### 3.3 Grids

| Pattern | Use |
|---|---|
| 12-col grid (`grid-cols-12 gap-6`) | Default. Eyebrow in col-3, headline in col-9. |
| 2-col (`grid-cols-1 md:grid-cols-2`) | Feature tiles. |
| 3-col (`grid-cols-1 md:grid-cols-3`) | Collections, "how it works" steps. |
| Bento | **Avoid.** Bento grids are a 2023 SaaS trope. If the content demands asymmetry, use the 12-col grid with explicit col-spans, not a bento. |

### 3.4 Vertical rhythm inside a section

```
[Section] py-section
  ├ Eyebrow                       (label, top of col-3)
  ├ ── space-gutter
  ├ Headline                      (display, col-9)
  ├ ── space-gutter
  ├ Body / supporting             (12-col grid)
  └ ── space-gutter
```

---

## 4. Border & radius

**Principle:** Sharp by default. Round only what is a status pill.

### 4.1 Radius rules

| Element | Radius |
|---|---|
| Buttons | **0** |
| Inputs, selects, textareas | **0** |
| Cards, modals, sheets | **0** |
| Images, image containers | **0** |
| Tabs, segmented controls | **0** |
| **Status chips / badges** | `rounded-full` (the only exception) |

Status chip examples: "AVAILABLE", "ARCHIVED", "WORN 12×". A category filter is **not** a status chip — it's a sharp chip.

### 4.2 Border rules

- **Width**: always `1px`. Never `2px` except focus rings (which are `outline: 2px solid var(--rc-foreground); outline-offset: 2px;`).
- **Color**: always from the palette. **Never** `border-black` directly. Use `border-foreground` for strong rules, `border-border` (`#E5E3DC`) for hairlines.
- **Tables**: rows use `border-b border-border`. No left/right borders. No outer table border.
- Section dividers can be `border-t border-foreground` (1px black hairline) when they need to feel decisive — typically once or twice per page, above the top of a section.

---

## 5. Component patterns

Canonical Tailwind classes. Copy these.

### 5.1 Buttons

All buttons: `h-11` (44px) standard, `h-12` (48px) prominent, **no rounding**, **no shadow**, uppercase tracking-widest label text, `font-mono` family, `text-[11px]`.

| Variant | Classes |
|---|---|
| **Primary** | `inline-flex items-center justify-center gap-2 h-11 px-6 bg-foreground text-background font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-foreground/90 transition-colors duration-200` |
| **Secondary (outline)** | `inline-flex items-center justify-center gap-2 h-11 px-6 border border-foreground bg-transparent text-foreground font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors duration-200` |
| **Ghost** | `inline-flex items-center justify-center gap-2 h-11 px-4 bg-transparent text-foreground font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-surface transition-colors duration-200` |
| **Danger** | `inline-flex items-center justify-center gap-2 h-11 px-6 border border-danger bg-transparent text-danger font-mono text-[11px] uppercase tracking-[0.18em] hover:bg-danger/10 transition-colors duration-200` |

**Hover** is always color/background shift, **never** `scale`, **never** `translate`, **never** `shadow`.

**Disabled** is `opacity-40` and `cursor-not-allowed`. Nothing else.

**Trailing arrow.** Buttons leading to a destination ("Start your closet →") use a literal `→` glyph, not an icon. Reserve icons for destructive or action-class buttons (delete, share, etc.).

### 5.2 Cards

```
<div class="border border-border bg-background hover:border-foreground/40 transition-colors duration-200">
  ...
</div>
```

- No radius. No shadow. No lift on hover.
- Surface: `bg-background` on `bg-surface` page, or `bg-surface` on `bg-background` page. Always one step of contrast.
- **Image cards** (closet grid, look cards) may animate the *inner image* on hover: `group-hover:scale-[1.03] transition-transform duration-500 ease-out`. The card frame does not move.
- Card padding: `p-6` standard, `p-4` dense (grids), `p-8` editorial.

### 5.3 Inputs

```
<input
  class="w-full h-11 px-4 bg-transparent border border-border text-foreground placeholder:text-mute-2 focus:outline-none focus:border-foreground transition-colors"
/>
```

- HeroUI: `variant="bordered"` + `radius="none"` + `size="md"` always.
- Height `h-11` standard, `h-12` for prominent forms (signup, profile).
- **Focus**: simple border darkens to `foreground`. No colored ring. No glow.
- **Labels** are above the input, `eyebrow` style (uppercase, tracking-widest, 11px, muted).
- **Help text** below the input, `text-body-xs text-muted`.
- **Error**: input gets `border-danger`; help text becomes `text-danger`. No icons, no exclamation marks.

### 5.4 Chips & badges

Two and only two flavors.

| Type | Use | Markup |
|---|---|---|
| **Sharp chip** | Category, filter, tag | `inline-flex items-center h-7 px-3 border border-border text-label-xs uppercase tracking-[0.20em] hover:border-foreground` |
| **Pill badge** | Status only ("ARCHIVED", "NEW") | `inline-flex items-center h-6 px-3 rounded-full bg-foreground text-background text-label-xs uppercase tracking-[0.20em]` |

Selected state on a sharp chip: `bg-foreground text-background border-foreground`.

### 5.5 Modals & sheets

- `radius="none"` always.
- **Animation**: simple opacity fade on the overlay (200ms) and a 6px `translateY` on the content (200ms). **No slide-up from bottom.** No scale.
- Header: `text-display-4xl` Cormorant, weight 400. Not bold.
- Close: top-right, `×` glyph, 24px hit target with `8px` invisible padding for ergonomics.

### 5.6 Navigation

- Background: `bg-background/85 backdrop-blur-md` always.
- Border-bottom: appears **on scroll only** (`border-b border-border` toggled when `scrollY > 24`).
- Logo: wordmark in `text-display-4xl` Cormorant 400, lower-case, with a `text-label-xs` version number next to it.
- Mobile nav: **slide-out from the right**, full-height, with closet thumbnails as the backdrop ornament. Never a hamburger over a centered drawer. No bottom sheet on mobile web.

### 5.7 Tables & lists

```
<div class="border-b border-border-100 hover:bg-surface transition-colors">
  ...
</div>
```

- Row separator: `border-b border-border` only. **No zebra striping.**
- Hover: row background to `surface`.
- Header row: `text-label-xs uppercase tracking-[0.20em] text-muted`.
- Numeric cells: `font-num` (JetBrains Mono, tabular).

### 5.8 The cost-per-wear number

The CPW value is the product's most important display. It has its own rule:

```
<span class="font-num tabular text-display-7xl text-foreground">$16.21</span>
```

Always JetBrains Mono. Always tabular. Always at display scale. The label above it ("COST PER WEAR") is mono caps.

---

## 6. Iconography

**Principle:** Icons are functional, not decorative. If a label says it, don't also draw it.

- **Library**: Heroicons (outline) for UI; outline switches to solid only on the **active/selected** state, never decorative.
- **Sizes**: `w-3.5 h-3.5` inline, `w-4 h-4` standard, `w-5 h-5` prominent, `w-6 h-6` hero-only.
- **Stroke**: Heroicons default (1.5px). Don't override.
- **Color**: `currentColor` always. Never colored.
- **Fallback to Lucide** only for icons Heroicons doesn't have (no garment-specific icons in either — see below).
- **Garment icons**: do not draw them. Show the thumbnail. The product *is* the wardrobe; we don't need a t-shirt icon.
- **Emoji**: never.

---

## 7. Motion & animation

**Principle:** Motion confirms, never decorates. Every animation has a reason.

### 7.1 Vocabulary

| Pattern | Spec |
|---|---|
| Section/page entrance | `opacity: 0 → 1`, `y: 20 → 0`, `duration: 0.5s`, `ease: cubic-bezier(0.22, 1, 0.36, 1)` |
| Stagger between children | `0.07s` |
| Hover transitions | CSS only, `duration-200` (200ms) or `duration-300` (300ms) |
| Page loader | Existing slide-up wipe (`y: '0%' → '-100%'`). Keep. |

### 7.2 Forbidden

- **Bounce / spring physics**
- **Scale-up entrances** (`scale: 0.9 → 1`)
- **Rotation** of any element except a loading spinner
- **Parallax** beyond a 4–6px drift (parallax-as-effect is over)
- **Anything longer than 600ms** on any single transition

### 7.3 Reduced motion

All Framer Motion variants must be wrapped:

```tsx
const prefersReduced = useReducedMotion();
const variants = prefersReduced
  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
  : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
```

For CSS transitions, set `transition-duration: 0ms` inside `@media (prefers-reduced-motion: reduce)`.

---

## 8. Elevation & depth

**Principle:** Borders and background contrast create depth. Shadows do not.

- **No `box-shadow` anywhere** in the UI. This is a hard rule, not a guideline.
- Depth comes from:
  - **Background steps** — `bg-background → bg-surface → bg-surface-2`.
  - **Borders** — `border-border` hairline, `border-foreground` strong rule for editorial decisiveness.
- **One exception**: landing-page floating product cards in the hero composition may use `shadow-sm` only. They are a marketing flourish; product UI does not get this license.

---

## 9. Dark mode

**Principle:** True inversion. The system feels the same in both modes.

- **Trigger**: `prefers-color-scheme: dark` system preference. No manual toggle until explicitly requested.
- **Borders** become lighter (same role, different hex — see §1.3). Do not invert by negation; use the dark-mode tokens.
- **Images**: render as-is. **No `filter: invert()`**. **No `filter: brightness(0.9)`**. Garment photography is the product — it ships true.
- **Accent**: shifts from `#7A2E1F` to `#B05A47` to maintain AA contrast on dark. Same hue family.
- **Cards**: `bg-surface` on dark is `#141413` — almost the same as background. The border is what makes it a card, not the fill.

---

## 10. Voice & micro-copy

**Principle:** Plain, dry, declarative. We're talking to adults who care about clothes.

| Pattern | Right | Wrong |
|---|---|---|
| Section header (eyebrow) | `THE SYSTEM` | "Our Amazing Features ✨" |
| Empty state | `No items yet. Add your first piece.` | `Your closet is empty! 👗 Let's get started!` |
| Action button | `ADD PIECE`, `EDIT LOOK`, `DELETE COLLECTION` | "Click here to add a new piece" |
| Confirmation | `Delete this look? This cannot be undone.` | "Are you sure you really want to delete? 🚨" |
| Loading state | Centered `<Spinner />` | Animated skeleton blocks (unless requested) |
| Error | `That price isn't valid.` (red text, no icon) | "⚠️ Oops! Something went wrong!" |
| Success toast | `Look saved.` | "🎉 Awesome! Your look was saved successfully!" |
| Onboarding | `Photograph it. Tag it. Wear it.` | "Get started in 3 easy steps! 🚀" |

**Tone rules:**
- Second person. "You own a hundred things."
- Present tense. "rcapsule tracks every wear" — not "will track."
- Sentences end with periods, including in labels when they're sentences. Eyebrows do not get periods.
- No exclamation marks. Not one. Not anywhere.
- No emoji. Not one. Not anywhere.
- Numbers are written as digits. "5,566 items," not "five thousand."
- Currency: `$` symbol, no space. Two decimal places where they matter (cost-per-wear), zero where they don't (price tags > $100).

---

## 11. Conflicts to address

Places where the current app or the prototype landing page deviates from this system. Each one needs a follow-up.

| # | Where | Issue | Fix |
|---|---|---|---|
| C1 | Landing page (`landing.jsx`) | Uses **Instrument Serif** for editorial italic accents, not Cormorant. | Swap to Cormorant Garamond italic (`ital@1,400`). Keep the same usage sites. |
| C2 | Landing page | Background is **`#FAFAF7` (warm paper)**, not pure `#FFFFFF`. | The DS specifies pure white. The warm paper was a stylistic choice for the landing only — decide whether to formalize a third "editorial" surface token or revert to true white app-wide. Recommend: keep landing's warm paper as a brand surface (`--rc-paper`), but app surfaces stay pure white. |
| C3 | Landing page | Accent terracotta **is not used** — page is fully monochrome. | Add accent in: footnote source links, pull-quote color on the founder's note italic line, hover state on inline links. |
| C4 | App (general) | App uses `font-display` class — not yet defined here. | Replace with `text-display-*` scale tokens (see §2.3). |
| C5 | App (general) | Likely uses HeroUI default `color="primary"` (blue) on buttons. | All primary buttons must use the foreground/background mapping (see §1.4). Audit and replace. |
| C6 | App (general) | Possible `radius` defaults from HeroUI components. | Enforce `radius="none"` on every HeroUI component except status badges. Add an ESLint rule or a project-wide override in the HeroUI config. |
| C7 | App (general) | Likely uses `border-black` directly in some places. | Replace all `border-black` with `border-foreground`; all `border-gray-200` with `border-border`. |
| C8 | App (general) | Skeleton loaders may exist (HeroUI default). | Remove. Use `<Spinner />` only, unless explicitly requested. |
| C9 | App (general) | HeroUI's default focus ring is colored. | Override `--heroui-focus` to `--rc-foreground` (already mapped above). |
| C10 | App (general) | `box-shadow` may exist on modal overlays or popovers (HeroUI defaults). | Override in CSS layer: `.heroui-modal, .heroui-popover { box-shadow: none !important; border: 1px solid var(--rc-border); }` |

---

## Quick reference card

```
COLOR     #0A0A0A foreground · #FFFFFF background · #7A2E1F accent
TYPE      Cormorant 300 display · Geist 400 body · JetBrains Mono 500 labels
RADIUS    0 everywhere · rounded-full ONLY for status pills
BORDER    1px · border-border (hairline) or border-foreground (strong)
SHADOW    none. ever.
MOTION    fade + 20px y · 500ms · cubic-bezier(0.22, 1, 0.36, 1)
LABELS    UPPERCASE TRACKING-[0.18EM] MONO 11PX
ACCENT    Used like ink, not paint. Pull quotes, link hover, mark.
VOICE     Plain. Dry. No emoji. No exclamation marks. Second person.
```

---

*rcapsule · design system v.01 · 2026*
