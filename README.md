# Rcapsule — Your Digital Wardrobe

A full-stack wardrobe management and fashion community platform. Catalogue your clothing, build outfits, track wear, and discover real looks from real people.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://rcapsule.com)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/RimaNafougui/rcapsule)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Showcase

![Showcase](public/images/showcase.gif)

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Caching Layer](#caching-layer)
- [Rate Limiting](#rate-limiting)
- [Security](#security)
- [AI & Weather Services](#ai--weather-services)
- [Chrome Extension](#chrome-extension)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

## Features

### Wardrobe Management

- **Secure Authentication** — Google OAuth, GitHub OAuth, and email/username + password (Supabase Auth) via NextAuth.js v5, JWT session strategy
- **Clothing Catalogue** — Add, edit, and delete items with image uploads, rich metadata (materials, care instructions, condition, sustainability notes, silhouette, style, neckline, pattern, length, fit, purchase price/currency/location/type), and AI background removal
- **Smart Filtering** — Filter by category, color, season, occasion, brand, and custom tags
- **Visual Collage Builder** — Drag-and-drop outfit collage creation (`react-rnd`) with resizing and positioning, rendered to a shareable image (`html2canvas`)
- **Calendar Tracker** — Log outfit wear by date; times-worn and analytics roll-up per item
- **Analytics Dashboard** — Wardrobe valuation, wear frequency, cost-per-wear, and category breakdowns, cached in Redis
- **Wishlist & Collections** — Save future buys and organize items into themed capsule wardrobes (many-to-many via join tables)

### AI & Intelligence

- **AI Outfit Recommendations** — Weather-aware outfit suggestions built from a deterministic prompt (weather context + user preferences + recent wear history + wardrobe inventory); default provider is OpenAI `gpt-4o-mini`, with an Anthropic `claude-3-haiku` code path available behind the same interface
- **Background Removal** — Premium image processing via an AWS Lambda function, invoked either over HTTPS (SSRF-guarded URL fetch/upload flow) or via the AWS SDK

### Community & Discovery

- **Discover Feed** — Trending, recent, and following-based outfit feeds, Redis-cached for non-personalized queries
- **Public Profiles** — Share your wardrobe and looks at `/u/[username]`, with visibility controls (public profile, hide closet value, hide item prices)
- **Outfit Detail Pages** — Like, save, and comment on individual looks
- **Style Tags & Onboarding** — Tag your style preferences; follow suggested users based on tag overlap
- **Follow / Block** — Social graph with blocking support
- **Notifications** — Activity feed (likes, comments, follows, mentions), polled client-side every 60s
- **Catalogue & Brand Pages** — Browse a global product catalogue filtered by fashion house, with add-to-closet flow

### Platform

- **Chrome Extension** — Import items directly from online shopping sites (Manifest V3), shipped in two builds — a full "admin" build with bulk import and an end-user single-item-import build (see [Chrome Extension](#chrome-extension))
- **Outfit Studio** — Standalone collage builder flow for composing outfits from your wardrobe
- **Stripe Payments** — Premium subscription via Checkout Sessions and the Billing Portal, reconciled through signed webhooks
- **Transactional Email** — Loops-powered lifecycle emails (10+ named templates) plus Resend/React Email for ad-hoc sends
- **Newsletter Unsubscribe** — Self-serve email preference management
- **Responsive Design** — Optimized for desktop, tablet, and mobile
- **SEO** — Dynamic `sitemap.xml`/`robots.txt`, and an edge-rendered Open Graph image (`next/og`, custom embedded font)
- **Custom Error Boundaries** — Branded 404, error, and global-error pages

### Admin Dashboard

- **Stats Overview** — Platform-wide usage metrics
- **User Management** — Search, view, and moderate user accounts
- **Catalogue Management** — Curate the global product catalogue
- **Reports Queue** — Review and resolve user-submitted reports
- **Broadcast** — Send platform-wide announcements/notifications
- Every admin page and every `/api/admin/*` handler calls `requireAdmin()`, which checks `role === "admin"` from the session

## Architecture

**Route groups** (`app/`):

| Group | Purpose |
|---|---|
| `(app)` | Authenticated product surface — closet, outfits, studio, catalogue, collections, wishlist, discover, notifications, checkout, profile, settings |
| `(auth)` | Login, signup, forgot/update password, onboarding — guest-only |
| `(admin)` | Admin dashboard, gated by `requireAdmin()` |
| `(marketing)` | Public landing, about, features, pricing, contact, extension install page, unsubscribe |
| `(legal)` | Terms, privacy, refund policy |
| `u/[username]` | Public profile pages (server-rendered, no auth required) |

**Middleware** (`proxy.ts`) — a NextAuth-wrapped edge middleware:
- Protected routes (require a session, else redirect to `/login?callbackUrl=<path>`): `/profile`, `/closet`, `/settings`, `/outfits`, `/wishlist`, `/collections`, `/studio`
- Guest-only routes (logged-in users are redirected to `/closet`): `/login`, `/signup`, `/forgot-password`, `/update-password`
- `/discover` and `/notifications` render client-side auth checks rather than middleware redirects

**Auth** (`auth.ts`) — NextAuth v5 (beta), JWT session strategy:
- Providers: Google OAuth, GitHub OAuth, and a Credentials provider (email-or-username + password verified against Supabase Auth's `signInWithPassword`)
- Custom `CredentialsSignin` subclasses surface specific failure reasons to the client: `EmailNotVerifiedError`, `UserNotFoundError`, `WrongPasswordError`
- OAuth sign-in upserts both `User` and `Account` rows (`onConflict: "provider,providerAccountId"`) and fires a fire-and-forget Loops contact sync
- The `jwt` callback copies identity claims on first sign-in, resyncs name/image on `trigger === "update"`, and **lazy-loads `role` from the database exactly once per session** — only when `token.role === undefined` — to avoid a DB round-trip on every request
- The `session` callback casts the user id through `asUserId` (see [branded types](#data-model)) before it ever reaches application code

**Database** — PostgreSQL via the Supabase JS SDK. All queries are parameterized through the singleton client in `lib/supabase-server.ts`; there is no raw SQL anywhere in the app. Resource ownership is verified server-side before every mutation — client-supplied IDs are never trusted alone.

**API route pattern** — every handler under `app/api/` follows the same shape:

```ts
export async function POST(req: Request) {
  const session = await auth();                          // 1. Auth
  if (!session?.user?.id) return unauthorized();

  const { success } = await apiLimiter().limit(id);       // 2. Rate limit
  if (!success) return rateLimitResponse(reset);

  const body = await req.json();
  const result = schema.safeParse(body);                  // 3. Zod validate
  if (!result.success) return badRequest(result.error.flatten());

  // 4. Ownership check (mutations on existing resources)
  // 5. Supabase query
  // 6. cacheDel(...) on writes
  // 7. return NextResponse.json({ ok: true, data })
}
```

Sentry spans (`Sentry.startSpan`) wrap DB-heavy handlers, tagged with attributes like `result_count` for observability.

**Client state** (`lib/contexts/UserContext.tsx`) fetches `/api/user/me` and exposes user state app-wide. Any component can trigger a refresh by dispatching `new CustomEvent("refreshUser")` on `window`, decoupling profile updates from the component tree without prop-drilling or full router refreshes.

**Type safety**:
- **Branded IDs** (`types/branded.ts`) — `UserId`, `ClothesId`, `OutfitId`, `WardrobeId`, `GlobalProductId`, `WearLogId`, `UserPreferencesId`, `OutfitRecommendationId`, each a nominal `Brand<string, "X">`. The paired cast helpers (`asUserId`, `asClothesId`, …) are the *only* places a plain string is allowed to become a branded ID — used only at trust boundaries, e.g. immediately after an ownership check.
- **API responses** (`types/api-response.ts`) — every client fetch goes through the `ApiResponse<T>` discriminated union (`{ ok: true, data: T } | { ok: false, error: string }`), consumed via an `apiFetch` wrapper that normalizes network/parsing failures.
- **Validation** (`lib/validations/schemas.ts`) — request bodies are parsed with Zod; types are derived with `z.infer<typeof schema>` rather than hand-written interfaces. Core schemas: `signupSchema`, `clothesPostSchema` / `clothesPutSchema` (the latter is `.partial()` of the former), `profilePutSchema`, `outfitPostSchema`. A number of simpler routes (comments, notifications, admin broadcast, collections) validate inline with an ad-hoc `z.object()` rather than a centralized schema.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router), React 19.2.1, TypeScript 5.6.3 (strict) |
| Styling | Tailwind CSS 4.1.11, HeroUI (`@heroui/react` 2.8.5 + per-component packages), Framer Motion 11, Cormorant Garamond |
| Database | PostgreSQL via `@supabase/supabase-js` 2.77 |
| Auth | `next-auth` 5.0.0-beta.29 — Google, GitHub, Credentials |
| Cache / Rate-limit | `@upstash/redis` 1.36 + `@upstash/ratelimit` 2.0 (HTTP, serverless-safe) |
| Payments | `stripe` 20.2 + `@stripe/stripe-js` 8.6 — Checkout + Webhooks |
| AI | Raw `fetch` against OpenAI (`gpt-4o-mini`) and Anthropic (`claude-3-haiku-20240307`) REST APIs — no vendor SDK |
| Image Processing | `@aws-sdk/client-lambda` 3.1016 (background removal, premium) |
| Weather | OpenWeatherMap OneCall v3, with a verified automatic fallback to the free v2.5 endpoint |
| File Storage | Supabase Storage (`wardrobe-images` bucket) |
| Email | Loops (`loops` 6.2, transactional templates) + Resend 6.9 / React Email 1.0 |
| Monitoring | `@sentry/nextjs` 10, `@vercel/analytics` 1.6, `@next/third-parties` 16.2 (GA) |
| Testing | Vitest 4.1 + MSW 2.12 + Testing Library 16.3; Playwright 1.58 is installed but no e2e specs exist yet |
| Validation | Zod 4.3 |
| Data fetching | SWR 2.3 |
| Package Manager | pnpm |
| Deployment | Vercel |

<details>
<summary>Full dependency list (exact pins)</summary>

**Data/backend** — `@supabase/supabase-js` ^2.77.0, `@upstash/redis` ^1.36.2, `@upstash/ratelimit` ^2.0.8, `swr` ^2.3.8, `zod` ^4.3.6
**UI** — `@heroicons/react` ^2.2.0, full `@heroui/*` suite, `framer-motion` 11.18.2, `lucide-react` ^0.562.0, `react-icons` ^5.5.0, `styled-components` ^6.1.19, `sonner` ^2.0.7, `next-themes` 0.4.6, `tailwind-variants` 3.1.1
**Payments** — `stripe` ^20.2.0, `@stripe/stripe-js` ^8.6.4
**Email** — `loops` ^6.2.1, `resend` ^6.9.3, `@react-email/components` ^1.0.9
**Monitoring** — `@sentry/nextjs` ^10, `@vercel/analytics` ^1.6.1, `@next/third-parties` ^16.2.1
**Misc** — `axios` ^1.13.2, `cheerio` ^1.1.2, `date-fns` ^4.1.0, `html2canvas` ^1.4.1, `lodash` ^4.17.23, `react-easy-crop` ^5.5.6, `react-rnd` ^10.5.2, `use-places-autocomplete` ^4.0.1
**Testing (dev)** — `vitest` ^4.0.18, `msw` ^2.12.10, `@testing-library/react` ^16.3.2, `@testing-library/jest-dom` ^6.9.1, `playwright` ^1.58.2, `vite-tsconfig-paths` ^6.1.1, `@vitejs/plugin-react` ^5.1.4
**Tooling (dev)** — `eslint` 9.25.1 + `eslint-config-next` 16.0.7, `@typescript-eslint/*` 8.34.1, `prettier` 3.5.3, `tsx` ^4.21.0, `dotenv-cli` ^10.0.0, `autoprefixer` ^10.5.0, `postcss` 8.5.6

</details>

## Project Structure

```
rcapsule/
├── app/
│   ├── (auth)/                  # Login, signup, forgot/update password, onboarding
│   ├── (marketing)/              # Landing, about, features, pricing, contact, extension, unsubscribe
│   ├── (legal)/                   # Terms, privacy, refund policy
│   ├── (admin)/                # Admin dashboard (stats, users, catalogue, reports, broadcast)
│   ├── (app)/                     # Authenticated app
│   │   ├── closet/                    # Wardrobe catalogue + item detail
│   │   ├── outfits/                   # Lookbook + outfit builder
│   │   ├── studio/                    # Standalone collage builder flow
│   │   ├── catalogue/                 # Global product catalogue + brand pages
│   │   ├── collections/               # Capsule wardrobes
│   │   ├── wishlist/                  # Saved items
│   │   ├── discover/                  # Community feed
│   │   ├── notifications/             # Activity notifications
│   │   ├── checkout/                  # Stripe checkout flow
│   │   ├── profile/                   # User profile
│   │   └── settings/                  # Account & preferences
│   ├── u/[username]/               # Public profiles + outfit detail pages
│   ├── actions/                    # Server actions
│   ├── auth/callback/              # OAuth callback handler
│   ├── api/                        # 60 route.ts handlers across ~35 feature folders (see API Reference)
│   ├── robots.ts / sitemap.ts      # Dynamic SEO files
│   ├── opengraph-image.tsx         # Edge-rendered OG image (next/og)
│   └── not-found.tsx / error.tsx / global-error.tsx
├── components/                    # 54 files
│   ├── layout/                        # Navbar, Footer, LandingPage, page loader
│   ├── ui/                            # Shared primitives (logo, theme switch, badges…)
│   ├── auth/                          # Auth forms
│   ├── closet/                        # Clothing cards, filters, image upload, wardrobe header
│   ├── outfit/                        # Collage builder, outfit recommendations
│   ├── community/                     # Comment section
│   ├── social/                        # Follow/block controls
│   ├── catalogue/                     # Product cards, add-to-closet modal
│   ├── profile/                       # Profile header, wardrobe/outfit/analytics tabs
│   ├── analytics/                     # Charts, stats
│   ├── calendar/                      # Calendar tracker + wear log modal
│   ├── settings/                      # Location input, settings panels
│   ├── weather/                       # Weather widget
│   └── error/                         # Error boundary UI
├── lib/                           # 32 files
│   ├── config/                        # Site config, fonts, nav items
│   ├── contexts/                      # UserContext
│   ├── hooks/ (+collage)              # useAnalytics, useCountUp, collage-specific hooks
│   ├── services/                      # AI recommendations, weather service
│   ├── actions/                       # Server actions (auth)
│   ├── email/ (+templates)            # Loops/Resend senders + React Email templates
│   ├── validations/                   # Zod schemas
│   ├── types/, utils/                 # Shared helper types/utilities
│   ├── supabase-server.ts             # Singleton Supabase server client
│   ├── redis.ts                       # Redis singleton + cache helpers + key constructors
│   └── ratelimit.ts                   # Tiered rate limiters + getIdentifier()
├── types/
│   ├── branded.ts                     # Branded entity ID types + cast helpers
│   ├── api-response.ts                # ApiResponse<T> discriminated union
│   └── next-auth.d.ts                 # NextAuth session/JWT type augmentation
├── styles/                        # globals.css — design tokens, shared component classes
├── public/                        # Static assets
├── tests/                         # 14 Vitest suites, 137 tests (api/, lib/, services/, mocks/)
├── wardrobe-extension/             # Chrome extension — admin/bulk-import build (Manifest V3)
├── wardrobe-extension-user/        # Chrome extension — end-user single-import build
└── .github/workflows/ci.yml       # Lint · Typecheck · Test · Build pipeline
```

## API Reference

All handlers live under `app/api/`. Every mutating route re-verifies session identity server-side; admin routes additionally call `requireAdmin()`.

| Area | Routes |
|---|---|
| **Auth** | `POST /api/auth/signup` · `GET,POST /api/auth/[...nextauth]` · `POST /api/auth-hook` (Supabase webhook) |
| **User/session** | `GET /api/user/me` · `GET /api/user/me/stats` · `GET,PATCH /api/user/preference` · `GET,POST,DELETE /api/user/location` · `GET /api/users/check-username` · `GET /api/users/suggested` |
| **Public profiles & social** | `GET /api/users/[username]` · `GET,POST,DELETE /api/users/[username]/follow` · `GET,POST,DELETE /api/users/[username]/block` · `GET /api/users/[username]/looks/[id]` · `GET /api/users/[username]/collections/[slug]` |
| **Settings** | `GET,PUT /api/settings/profile` · `GET,PUT /api/settings/visibility` · `PUT /api/settings/password` · `PATCH /api/settings/style-tags` |
| **Closet** | `GET,POST /api/clothes` · `GET,PUT,DELETE /api/clothes/[id]` |
| **Outfits** | `GET,POST /api/outfits` · `GET,PUT,DELETE /api/outfits/[id]` · `GET /api/outfits/[id]/collage` |
| **Collections (wardrobes)** | `GET,POST /api/collections` · `GET,PUT,DELETE /api/collections/[id]` · `POST /api/collections/[id]/clothes` · `DELETE /api/collections/[id]/clothes/[clothesId]` · `POST /api/collections/[id]/outfits` · `DELETE /api/collections/[id]/outfits/[outfitId]` |
| **Wear tracking** | `GET,POST,PUT,DELETE /api/calendar` · `POST /api/wear-log` |
| **AI & weather** | `GET,POST /api/recommendations` · `GET /api/weather` |
| **Background removal** | `POST /api/remove-background` (premium-gated, SSRF-hardened URL fetch/file upload, HTTPS invoke of `AWS_LAMBDA_ENDPOINT`) · `POST /api/remove-bg` (AWS SDK `InvokeCommand` against `AWS_LAMBDA_FUNCTION_NAME`) |
| **Community** | `GET,POST /api/comments` · `PATCH,DELETE /api/comments/[id]` · `POST,DELETE /api/likes` · `POST,DELETE /api/saves` · `GET,PATCH /api/notifications` · `PATCH /api/notifications/[id]` · `GET /api/feed` · `GET /api/style-tags` |
| **Catalogue** | `GET /api/catalogue` · `GET /api/catalogue/[id]` |
| **Extension** | `POST /api/extension/import` · `POST /api/extension/bulk-import` |
| **Payments** | `POST /api/checkout` · `POST /api/billing/portal` · `POST /api/webhooks/stripe` |
| **Misc** | `POST,DELETE /api/upload` · `POST /api/newsletter` · `POST /api/newsletter/unsubscribe` · `GET /api/analytics` |
| **Admin** | `GET /api/admin/stats` · `GET /api/admin/users` · `GET,PATCH,DELETE /api/admin/users/[id]` · `GET,POST /api/admin/catalogue` · `GET,PATCH,DELETE /api/admin/catalogue/[id]` · `GET /api/admin/reports` · `PATCH /api/admin/reports/[id]` · `POST /api/admin/broadcast` |

## Data Model

PostgreSQL via Supabase, queried exclusively through the Supabase JS SDK (no raw SQL). Tables in active use, confirmed by grepping every `.from("Table")` call site:

**Core**: `User`, `Account` (NextAuth OAuth account linking), `Clothes`, `ClothesAnalytics`, `Wardrobe`, `WardrobeClothes`, `OutfitClothes`, `WardrobeOutfit`, `Outfit`, `WearLog`, `OutfitRecommendations`, `UserPreferences`
**Community**: `Follow`, `Block`, `Like`, `Save`, `Comment`, `Notification`, `StyleTag`, `GlobalProduct`, `Report`

`Wardrobe*` join tables (`WardrobeClothes`, `WardrobeOutfit`) implement the many-to-many relationship between capsule wardrobes/collections and the items or outfits they contain; `OutfitClothes` does the same between outfits and the individual pieces that make them up. Primary keys on `User`, `Clothes`, `Outfit`, `Wardrobe`, `GlobalProduct`, `WearLog`, `UserPreferences`, and `OutfitRecommendations` are represented in application code as [branded ID types](#type-safety) rather than plain strings.

## Caching Layer

Upstash Redis (HTTP, serverless-safe) via `lib/redis.ts`. Helpers: `cacheGet<T>(key)`, `cacheSet(key, value, ttl)`, `cacheDel(...keys)` — all fail open (a Redis error is swallowed and treated as a cache miss, never a request failure).

| Key | Pattern | TTL |
|---|---|---|
| Analytics snapshot | `analytics:v1:{userId}` | 600s |
| User preferences | `prefs:v1:{userId}` | 300s |
| Owned clothes (for AI recs) | `clothes:owned:v1:{userId}` | 180s |
| Clothes list | `clothes:list:{status}:v1:{userId}` | 120s |
| Outfits list | `outfits:v1:{userId}` | 120s |
| Wardrobes list | `wardrobes:v1:{userId}` | 300s |
| Discover feed (non-personalized only) | `feed:v1:{sort}:{tags}:{season}` | 60s |

Keys are version-suffixed (`v1`) — bumping the suffix is the global invalidation strategy. Mutations call `cacheDel` on the relevant keys (e.g. a `Clothes` write invalidates both the analytics key and the owned-clothes key for that user).

## Rate Limiting

Four Upstash sliding-window tiers, defined in `lib/ratelimit.ts`:

| Tier | Limit |
|---|---|
| `auth` | 5 requests / 10 min |
| `api` | 60 requests / 60s |
| `heavy` | 10 requests / 60s (AI/image-processing routes) |
| `public` | 30 requests / 60s |

`getIdentifier()` resolves `user:{id}` when a session exists, otherwise `ip:{ip}` from the first entry of `x-forwarded-for`. A limited request receives a `429` with `Retry-After` and `X-RateLimit-Reset` headers.

## Security

- **Headers** (`next.config.ts`, applied to every route): `Strict-Transport-Security` (2yr, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation disabled)
- **Content Security Policy**: `default-src 'self'`; script sources scoped to self + Stripe, Sentry, Google Maps/Analytics/Tag Manager, and Vercel Scripts (`unsafe-eval` only outside production); `connect-src` scoped to Supabase, Stripe, Sentry, Google Maps/Analytics; `frame-src` limited to `js.stripe.com`; `object-src 'none'`
- **SSRF hardening** — the URL-based background-removal flow validates target URLs are HTTPS and rejects private/loopback IP ranges before fetching
- **Ownership checks** — every mutation re-verifies the resource belongs to `session.user.id` before writing; branded IDs prevent an unverified string from silently entering a query as a trusted identifier
- **Monitoring** — Sentry captures both server and client errors; CI builds with a real (test) Sentry auth token so source maps upload correctly

## AI & Weather Services

**`lib/services/ai-recommendations.ts`**
- `getOutfitRecommendation(clothes, context, provider = "openai")` — filters to owned (non-wishlist) items, requires at least 2, builds a deterministic prompt from weather + preferences + recent wear history + inventory, calls the selected provider, parses the (possibly markdown-fenced) JSON response, and filters returned item IDs down to ones that actually exist in the wardrobe.
- `getOutfitOptions(clothes, context, count = 3)` — loops to produce multiple distinct outfit options, feeding previously-used item IDs back in as `recentlyWorn` so each option differs; a failure on one iteration is caught and skipped rather than aborting the batch.
- `callOpenAI` — `gpt-4o-mini`, `temperature: 0.7`, `max_tokens: 1000`, JSON response mode.
- `callClaude` — `claude-3-haiku-20240307`, `max_tokens: 1000`, same input/output contract as `callOpenAI` so either provider can be selected via the `provider` parameter.

**`lib/services/weather.ts`**
- `getWeather(lat, lon, units)` — calls OpenWeatherMap OneCall v3 first (`next.revalidate: 1800`); on a non-OK response, automatically retries against the free `data/2.5/weather` endpoint.
- Returns a `WeatherContext`: current conditions, high/low, and derived flags (`isRainy`, `isCold` <10°C, `isHot` >25°C, `needsLayers` when the daily range exceeds 10°C, `needsUmbrella`, `needsSunProtection` when UV index ≥ 6).
- `getWeatherSummary(weather)` renders the struct into the human-readable digest consumed by the AI prompt builder.

## Chrome Extension

Two Manifest V3 builds ship from this repo:

| | `wardrobe-extension/` (admin) | `wardrobe-extension-user/` |
|---|---|---|
| Version | 1.1 | 1.2 |
| Permissions | `activeTab`, `scripting`, `storage`, `tabs` | `activeTab`, `scripting`, `storage` |
| Import mode | Single item + bulk import (`/api/extension/bulk-import`) | Single item import only (`/api/extension/import`) |
| Retailer selectors | Explicit Aritzia host permission + broader site coverage | Same target sites, single-import path only |

Both target `localhost:3000`, `closetwardrobe.vercel.app`, and `rcapsule.com`. Install instructions live on the `/extension` marketing page.

## Testing

[Vitest](https://vitest.dev/) + [MSW](https://mswjs.io/) for API mocking (OpenAI, Anthropic, Stripe, weather).

```bash
pnpm test                  # run all tests
pnpm vitest --coverage     # run with coverage report
```

**137 tests** across 14 suites — all passing.

| Suite | Tests | Coverage |
|---|---:|---|
| `tests/api/admin/catalogue.test.ts` | 19 | Admin catalogue CRUD, auth/role guards, validation |
| `tests/api/admin/users.test.ts` | 16 | User search, role changes, moderation actions, guards |
| `tests/api/signup.test.ts` | 11 | Input validation, username rules, duplicate checks |
| `tests/api/admin/reports.test.ts` | 12 | Report listing, resolution, admin guards |
| `tests/api/clothes.test.ts` | 10 | CRUD, auth guards, ownership verification, DB errors |
| `tests/services/ai-recommendations.test.ts` | 10 | Recommendation structure, multi-provider (OpenAI/Anthropic), error recovery |
| `tests/services/weather.test.ts` | 10 | Weather context, temp rounding, API fallback |
| `tests/lib/redis.test.ts` | 10 | Cache get/set/delete, TTL, multi-key delete, error resilience |
| `tests/lib/ratelimit.test.ts` | 9 | Identifier extraction, 429 responses, Retry-After headers |
| `tests/api/admin/broadcast.test.ts` | 8 | Broadcast send, validation, auth/role guards |
| `tests/api/catalogue.test.ts` | 6 | Listing, cache headers, pagination, search suggestions |
| `tests/api/checkout.test.ts` | 6 | Auth, billing cycle, Stripe session creation |
| `tests/lib/admin.test.ts` | 5 | `requireAdmin()` auth/role checks |
| `tests/api/admin/stats.test.ts` | 5 | Stats aggregation, auth/role guards |

Coverage thresholds enforced: **70% lines/functions/statements**, **60% branches**.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`, `master`, and `develop` (in-progress runs on the same ref are cancelled). Single job, `ubuntu-latest`, 15-minute timeout:

```
pnpm install --frozen-lockfile
  → pnpm lint
  → pnpm tsc --noEmit
  → pnpm test        (MSW mocks all external calls; fake env vars)
  → pnpm build        (broader fake env set incl. Stripe/Sentry so the build doesn't fail on missing config)
```

## Environment Variables

See `.env.example` for the full list. Key groups:

- **Auth (NextAuth)** — `AUTH_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **App** — `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`
- **Sentry** — `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`
- **Redis** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **AI / External** — `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENWEATHER_API_KEY`, `AWS_LAMBDA_ENDPOINT`, `AWS_LAMBDA_API_KEY`
- **Browser Extension** — `ALLOWED_EXTENSION_ORIGIN`
- **Google Analytics** — `NEXT_PUBLIC_GA_ID`
- **Loops Email** — `LOOPS_API_KEY` + 10 named template IDs, `SUPABASE_HOOK_SECRET`

## Deployment

Deployed on Vercel with automatic CI/CD from `main`.

1. Push to `main`
2. Vercel builds and deploys automatically
3. Environment variables managed in Vercel dashboard

## Database Schema

PostgreSQL via Supabase with Row Level Security on all user tables.

![Schema](public/images/supabase-schema-closet.png)

## Contact

Rima Nafougui — [@RimaNafougui](https://github.com/RimaNafougui)

Project: [https://github.com/RimaNafougui/rcapsule](https://github.com/RimaNafougui/rcapsule)
