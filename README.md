# Rcapsule — Your Digital Wardrobe

A full-stack wardrobe management and fashion community platform. Catalog your clothing, build outfits, track wear, and discover real looks from real people.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://rcapsule.com)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/RimaNafougui/rcapsule)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Showcase

![Showcase](public/images/showcase.gif)

## Features

### Wardrobe Management
- **Secure Authentication** — Sign in with Google, GitHub, or email/password via NextAuth.js
- **Clothing Catalog** — Add, edit, and delete items with image uploads, rich metadata (materials, care instructions, condition, sustainability notes), and AI-powered background removal
- **Smart Filtering** — Filter by category, color, season, occasion, brand, and custom tags
- **Visual Collage Builder** — Drag-and-drop outfit collage creation with resizing and positioning
- **Calendar Tracker** — Log outfit wear by date; track times worn per item
- **Analytics Dashboard** — Wardrobe valuation, wear frequency, cost-per-wear, and category breakdowns
- **Wishlist & Collections** — Save future buys and organize items into themed capsule wardrobes

### AI & Intelligence
- **AI Outfit Recommendations** — Daily weather-aware outfit suggestions powered by OpenAI gpt-4o-mini (Anthropic claude-haiku-3 fallback)
- **Background Removal** — Premium image processing via AWS Lambda

### Community & Discovery
- **Discover Feed** — Trending, recent, and following-based outfit feeds
- **Public Profiles** — Share your wardrobe and looks at `/u/[username]`
- **Outfit Detail Pages** — Like, save, and comment on individual looks
- **Style Tags & Onboarding** — Tag your style preferences; follow suggested users
- **Notifications** — Real-time activity feed (likes, comments, follows, mentions)
- **Brand Pages** — Browse the catalog filtered by fashion house

### Platform
- **Chrome Extension** — Import items directly from online shopping sites (Manifest V3)
- **Stripe Payments** — Premium subscription via Checkout and billing portal
- **Responsive Design** — Optimized for desktop, tablet, and mobile
- **Custom 404** — Branded error page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, HeroUI, Cormorant Garamond |
| Database | PostgreSQL via Supabase JS SDK |
| Auth | NextAuth.js v5 beta — Google, GitHub, credentials |
| Cache / Rate-limit | Upstash Redis (HTTP, serverless-safe) |
| Payments | Stripe Checkout + Webhooks |
| AI | OpenAI gpt-4o-mini (primary), Anthropic claude-haiku-3 (fallback) |
| Image Processing | AWS Lambda (background removal, premium) |
| Weather | OpenWeatherMap OneCall v3 (v2.5 fallback) |
| File Storage | Supabase Storage (`wardrobe-images` bucket) |
| Monitoring | Sentry (server + client), Vercel Analytics |
| Testing | Vitest + MSW |
| Package Manager | pnpm |
| Deployment | Vercel |

## Project Structure

```
rcapsule/
├── app/
│   ├── (auth)/              # Login, signup, forgot/update password, onboarding
│   ├── (marketing)/         # Landing, about, features, pricing, contact
│   ├── (legal)/             # Terms, privacy, refund policy
│   ├── (app)/               # Authenticated app
│   │   ├── closet/          # Wardrobe catalog + item detail
│   │   ├── outfits/         # Lookbook + outfit builder
│   │   ├── catalog/         # Global product catalog + brand pages
│   │   ├── collections/     # Capsule wardrobes
│   │   ├── wishlist/        # Saved items
│   │   ├── discover/        # Community feed
│   │   ├── notifications/   # Activity notifications
│   │   ├── profile/         # User profile
│   │   └── settings/        # Account & preferences
│   ├── u/[username]/        # Public user profiles + outfit detail pages
│   ├── api/                 # API routes (auth, clothes, outfits, feed, AI, Stripe…)
│   └── not-found.tsx        # Custom 404 page
├── components/
│   ├── layout/              # Navbar, Footer, LandingPage, page loader
│   ├── ui/                  # Shared primitives (logo, theme switch, badges…)
│   ├── auth/                # Auth forms
│   ├── closet/              # Clothing cards, filters, image upload, wardrobe header
│   ├── outfit/              # Collage builder, outfit recommendations
│   ├── community/           # Comment section
│   ├── catalog/             # Product cards, add-to-closet modal
│   ├── profile/             # Profile header, wardrobe/outfit/analytics tabs
│   ├── analytics/           # Charts, stats
│   ├── calendar/            # Calendar tracker + wear log modal
│   ├── settings/            # Location input, settings panels
│   └── weather/             # Weather widget
├── lib/
│   ├── config/              # Site config, fonts, nav items
│   ├── contexts/            # UserContext
│   ├── hooks/               # useAnalytics, useCountUp
│   ├── services/            # AI recommendations, weather service
│   ├── actions/             # Server actions (auth)
│   └── ...                  # Supabase clients, Redis helpers, rate limiters
├── styles/                  # globals.css — design tokens, shared component classes
├── public/                  # Static assets
├── tests/                   # Vitest test suites
└── wardrobe-extension/      # Chrome extension (Manifest V3)
```

## Database Schema

PostgreSQL via Supabase with Row Level Security on all user tables.

![Schema](public/images/supabase-schema-closet.png)

**Core tables:** `User`, `Clothes`, `Wardrobe`, `Outfit`, `WardrobeClothes`, `OutfitClothes`, `WardrobeOutfit`, `WearLog`, `OutfitRecommendations`, `UserPreferences`

**Community tables:** `Follow`, `Block`, `Like`, `Save`, `Comment`, `Notification`, `Activity`, `StyleTag`, `GlobalProduct`, `Report`, `FeaturedContent`

## Testing

[Vitest](https://vitest.dev/) + [MSW](https://mswjs.io/) for API mocking.

```bash
pnpm test                  # run all tests
pnpm vitest --coverage     # run with coverage report
```

**72 tests** across 8 suites — all passing.

| Suite | Tests | Coverage |
|-------|------:|---------|
| `tests/api/signup.test.ts` | 11 | Input validation, username rules, duplicate checks |
| `tests/api/clothes.test.ts` | 10 | CRUD, auth guards, ownership verification, DB errors |
| `tests/api/catalog.test.ts` | 6 | Listing, cache headers, pagination, search suggestions |
| `tests/api/checkout.test.ts` | 6 | Auth, billing cycle, Stripe session creation |
| `tests/services/ai-recommendations.test.ts` | 10 | Recommendation structure, multi-provider (OpenAI/Anthropic), error recovery |
| `tests/services/weather.test.ts` | 10 | Weather context, temp rounding, API fallback |
| `tests/lib/redis.test.ts` | 10 | Cache get/set/delete, TTL, multi-key delete, error resilience |
| `tests/lib/ratelimit.test.ts` | 9 | Identifier extraction, 429 responses, Retry-After headers |

Coverage thresholds enforced: **70% lines/functions/statements**, **60% branches**.

## Deployment

Deployed on Vercel with automatic CI/CD from `main`.

1. Push to `main`
2. Vercel builds and deploys automatically
3. Environment variables managed in Vercel dashboard

## Contact

Rima Nafougui — [@RimaNafougui](https://github.com/RimaNafougui)

Project: [https://github.com/RimaNafougui/rcapsule](https://github.com/RimaNafougui/rcapsule)
