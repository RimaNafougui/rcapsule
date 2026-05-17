---
name: rcapsule-design
description: Use this skill to generate well-branded interfaces and assets for rcapsule, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` and `DESIGN_SYSTEM.md` files within this skill, and explore the other available files (`tailwind.config.design-system.ts`, `colors_and_type.css`, `preview/`).

rcapsule is a wardrobe management and style community web app. The design system follows one principle above all: **rcapsule should feel like a fashion magazine that became software** — editorial restraint, typographic confidence, zero decoration for decoration's sake.

Five non-negotiable rules:

1. **Sharp corners.** `border-radius: 0` everywhere except status pill chips.
2. **Borders, not shadows.** No `box-shadow` (one exception, see §8 of `DESIGN_SYSTEM.md`).
3. **Type is the design.** Display = Cormorant Garamond 300. Body = Geist. Labels = JetBrains Mono caps. Never bold a heading.
4. **One accent, used like ink.** Deep terracotta `#7A2E1F`. Pull-quote color, link hover, brand mark. Never a button fill, never a gradient.
5. **No SaaS tropes.** No gradients, no emoji, no purple, no glassmorphism, no bento grids, no exclamation marks.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out and create static HTML files for the user to view. If working on production code, copy `tailwind.config.design-system.ts` into the project's global stylesheet and read the component patterns in `DESIGN_SYSTEM.md §5`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts or production code, depending on the need.
