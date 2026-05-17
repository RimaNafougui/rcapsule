# rcapsule

A wardrobe management and style community web app. This project is the **design system** for rcapsule — the tokens, type, components, and rules that govern its UI.

> rcapsule should feel like a **fashion magazine that became software** — editorial restraint, typographic confidence, zero decoration for decoration's sake.

---

## What rcapsule is

rcapsule is a fashion-forward web app for cataloguing wardrobes, tracking wear, building outfits, and sharing style publicly. Its users are fashion-intentional — they care about quality, longevity, and taste. The product sits at the intersection of personal data and aesthetic identity, so the UI must belong in that world.

**Core surfaces:**

- **Closet** — catalogue every piece, photograph, brand, fabric, price, season.
- **Wear tracker** — log each wear, compute cost-per-wear in real time.
- **Outfits** — compose looks from owned pieces, schedule, repeat.
- **Community / Discover** — public profiles of real closets, not editorial spreads.
- **Wishlist & Collections** — capsules and pieces being considered.

---

## Design references

- **System magazine** — editorial grid, heavy whitespace.
- **Ssense.com** — stark product UI, confident, typographic.
- **Are.na** — minimal, no visual noise.
- **Bottega Veneta campaign sites** — luxury restraint.

**Not** Notion / Linear / Vercel / standard SaaS design systems. No gradients. No emoji. No purple.

---

## Content fundamentals (voice)

Plain, dry, declarative. We're talking to adults who care about clothes.

- **Second person.** "You own a hundred things." Not "Users can…"
- **Present tense.** "rcapsule tracks every wear." Not "will track."
- **Periods, not exclamation marks.** Never an exclamation mark anywhere. Not in copy, not in toasts, not in onboarding.
- **No emoji.** Not in body, not in labels, not in error states, not in success toasts.
- **Numbers as digits.** "5,566 items," not "five thousand."
- **Currency with `$`, no space.** Two decimals where they matter (cost-per-wear), zero where they don't (price tags > $100).
- **Eyebrow labels do not get periods.** Sentences do.

**Examples**

| Wrong                              | Right                                      |
| ---------------------------------- | ------------------------------------------ |
| "Your closet is empty! 👗"         | "No items yet. Add your first piece."      |
| "🎉 Awesome! Your look was saved!" | "Look saved."                              |
| "Are you sure you want to delete?" | "Delete this look? This cannot be undone." |
| "Click here to add a new piece"    | "ADD PIECE"                                |
| "⚠️ Oops! Invalid price"           | "That price isn't valid."                  |

---

## Visual foundations

**Color.** A near-pure light/dark canvas plus one warm accent. Pure white background (`#FFFFFF`), near-black foreground (`#0A0A0A`), and a single deep terracotta accent (`#7A2E1F`) used like ink — pull-quote color, link hover, brand mark. Never a button fill. Never a gradient. Two semantic colors (`danger` red, `success` moss-green) for state, used sparingly.

**Type.** Three families, one rhythm.

- **Cormorant Garamond** for display (weight 300 — light) — high-contrast editorial serif.
- **Geist** for body — clean, neutral, just-modern-enough.
- **JetBrains Mono** for numbers and labels — tabular numerals, all-caps tracked labels at 10–11px.
- **Italic** is set in Cormorant Italic and used only for editorial accent lines ("_you wear twenty_"). Bold is reserved for labels, never headings.

**Spacing.** Generous. Section padding is 160px desktop / 96px mobile (`--space-section`). Twelve-column grid with `gap-6` is the default; eyebrows live in col-3, headlines in col-9. Whitespace is content.

**Borders.** Always 1px. `--rc-border` (`#E5E3DC`) for hairlines, `--rc-foreground` for the rare strong rule that sits above a section.

**Corners.** `border-radius: 0` everywhere. The only exception is `rounded-full` on status pill chips. Cards, modals, buttons, inputs, images: sharp.

**Shadows.** None. Anywhere. Depth comes from background steps (`background → surface → surface-2`) and borders. The only exception is `shadow-sm` on landing-page hero composition cards (marketing flourish, not product UI).

**Backgrounds.** Solid colors. Garment photography is the texture. No patterns. No gradients. No glassmorphism. The landing page uses a slightly warm `#FAFAF7` paper tone for editorial feel; the app uses pure `#FFFFFF`.

**Animation.** Fade + 20px Y, 500ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Stagger 0.07s between children. No bounce, no scale-up entrances, no rotation. Hover transitions are CSS-only at 200ms. All animations respect `prefers-reduced-motion`.

**Hover.** Color and background shift only. **Never** scale, **never** translate, **never** add a shadow. On image cards, the inner image may scale 1.03; the card frame never moves.

**Press.** Color shift, no transform.

**Focus.** Border darkens to `foreground`. No colored ring. No glow. Focus rings (when used) are `outline: 2px solid var(--rc-foreground); outline-offset: 2px;`.

**Transparency & blur.** Reserved for the nav bar (`background/85` + `backdrop-blur-md`) and for modal overlays (`background/60`). Nowhere else.

**Imagery.** Garment photography is the product. It renders true — no filters, no `mix-blend-mode`, no rotated frames, no Polaroid mockups. In dark mode, no inversion or brightness adjustment.

**Cards.** Border, no shadow, no radius, one step of background contrast. Hover darkens the border. That's the whole spec.

---

## Iconography

- **Library:** Heroicons (outline) for UI; solid only for active/selected state.
- **Sizes:** `w-3.5 h-3.5` inline · `w-4 h-4` standard · `w-5 h-5` prominent · `w-6 h-6` hero-only.
- **Color:** `currentColor` always. Never colored.
- **Garment-specific icons:** do not draw them. Show the thumbnail. The product _is_ the wardrobe; we don't need a t-shirt icon.
- **Emoji:** never.
- **Lucide React** is installed for icons Heroicons doesn't cover; use sparingly.

---

## Index — what's in this project

| File                                             | What it is                                                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`DESIGN_SYSTEM.md`**                           | The full reference document — every rule, every component pattern, every conflict callout. Read this before touching UI.                                       |
| **`tailwind.config.design-system.ts`**           | Tailwind CSS v4 `@theme` block — drop into your global stylesheet. Defines every color, font, spacing, and typography token. Includes HeroUI variable mapping. |
| **`colors_and_type.css`**                        | Framework-agnostic CSS custom properties + element resets. Use if not on Tailwind.                                                                             |
| **`SKILL.md`**                                   | Skill definition for Agent SKills compatibility.                                                                                                               |
| **`README.md`**                                  | This file.                                                                                                                                                     |
| **`index.html` / `landing.jsx` / `mockups.jsx`** | The pre-launch landing page prototype — first reference implementation of the design system.                                                                   |
| **`preview/`**                                   | Design-system specimen cards (rendered in the Design System tab).                                                                                              |

---

## Sources

- Brand brief: provided by the user (May 2026).
- Reference implementations: `index.html` landing page (this project).
- No external Figma or codebase access provided.

---

## Caveats

- The production rcapsule app codebase was not accessible. Conflict notes in `DESIGN_SYSTEM.md §11` are inferred from the brief's mentions of HeroUI defaults, `font-display`, and `radius="none"` patterns. Treat them as a checklist to audit, not as confirmed defects.
- Fonts are loaded from Google Fonts; no font files are bundled. Substitute with self-hosted Cormorant Garamond / Geist / JetBrains Mono in production for performance and offline support.
- Dark mode is defined but not yet exercised in any preview card — both modes should be reviewed once a working dark-mode toggle is wired into the app.

---

_rcapsule · design system v.01 · 2026_
