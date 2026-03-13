# Rcapsule — Your Digital Closet

A full-stack wardrobe management application that helps you catalog, organize, and create outfit combinations from your clothing collection.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://rcapsule.com)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/RimaNafougui/rcapsule)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Extension Showcase

![Showcase](public/images/showcase.gif)

## Features

- **Secure Authentication**: Sign in with Google or GitHub using NextAuth.js or with email
- **Wardrobe Cataloging**: Add, edit, and delete clothing items with image uploads and detailed metadata (materials, condition, care instructions)
- **Smart Organization**: Filter items by category, color, season, and custom tags
- **Outfit Creation**: Combine clothing items to create and save outfit combinations with one-per-category selection logic
- **Visual Collage Builder**: Create outfit collages with drag-and-drop positioning and resizing
- **Chrome Extension**: Import items directly from online shopping sites
- **Advanced Search**: Quickly find items across your entire wardrobe
- **Analytics Dashboard**: Track wear frequency, wardrobe stats, and outfit trends
- **AI Outfit Recommendations**: Get weather-aware outfit suggestions
- **Public Profiles**: Share your wardrobe and collections with a public profile page
- **Wishlist & Collections**: Save and organize items you want
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Real-time Updates**: Instant synchronization of your wardrobe data

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **UI Library**: HeroUI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Redis (rate limiting)
- **Authentication**: NextAuth.js with OAuth (Google, GitHub) + credentials
- **Image Processing**: html2canvas for collage generation
- **File Storage**: Supabase Storage
- **AI**: AI-powered outfit recommendations
- **Weather**: Location-based weather integration
- **Payments**: Stripe (checkout + billing portal)
- **Monitoring**: Sentry (error tracking), Vercel Analytics
- **Chrome Extension**: Manifest V3
- **Deployment**: Vercel
- **Performance**: 95+ Lighthouse score

## Project Structure

```
rcapsule/
├── app/
│   ├── (auth)/              # Auth pages (login, signup, forgot/update password)
│   ├── (marketing)/         # Public pages (about, features, pricing, contact)
│   ├── (legal)/             # Legal pages (terms, privacy, refund-policy)
│   ├── (app)/               # Authenticated app (closet, outfits, catalog, profile, etc.)
│   ├── u/[username]/        # Public user profiles
│   ├── api/                 # API routes
│   └── ...                  # Root layout, providers, error pages
├── components/
│   ├── ui/                  # Shared UI (icons, logo, theme switch, etc.)
│   ├── layout/              # Layout (Navbar, Footer, Header, Hero, LandingPage)
│   ├── auth/                # Auth forms & dropdown
│   ├── closet/              # Closet components (cards, filters, image upload)
│   ├── outfit/              # Outfit components (collage builder, recommendations)
│   ├── catalog/             # Catalog components
│   ├── profile/             # Profile components
│   ├── analytics/           # Analytics dashboard components
│   ├── calendar/            # Calendar tracker
│   ├── social/              # Like & save buttons
│   ├── settings/            # Settings components (location input/settings)
│   └── weather/             # Weather widget
├── lib/
│   ├── config/              # Site config, fonts
│   ├── contexts/            # React contexts (UserContext)
│   ├── hooks/               # Custom hooks (useAnalytics)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions (subscription)
│   ├── services/            # AI recommendations, weather service
│   ├── actions/             # Server actions (auth)
│   └── ...                  # Supabase clients, Redis, rate limiting, data helpers
├── styles/                  # Global CSS
├── public/                  # Static assets
├── tests/                   # Test files
└── wardrobe-extension/      # Chrome extension (Manifest V3)
```

## Live Demo

Visit the live application at [rcapsule.com](https://rcapsule.com) to see Rcapsule in action.

## Database Schema

The application uses a normalized PostgreSQL schema with the following main tables:

![Schema](public/images/supabase-schema-closet.png)

All tables implement Row Level Security (RLS) to ensure users can only access their own data.

## Deployment

The application is deployed on Vercel with automatic CI/CD:

1. Push to the main branch
2. Vercel automatically builds and deploys
3. Environment variables are configured in Vercel dashboard

## Performance

- Server-side rendering with Next.js App Router
- Optimized image loading and compression
- Lighthouse score: 95+
- Fast page loads and smooth interactions

## Testing

The project uses [Vitest](https://vitest.dev/) with [MSW](https://mswjs.io/) (Mock Service Worker) for API mocking.

```
pnpm test            # run all tests
pnpm vitest --coverage  # run with coverage report
```

**72 tests** across 8 test suites — all passing.

| Suite                                       | Tests | What's covered                                                                                              |
| ------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------- |
| `tests/api/signup.test.ts`                  |    11 | Input validation, username rules, duplicate checks, successful signup                                       |
| `tests/api/clothes.test.ts`                 |    10 | CRUD operations, auth guards, ownership verification, DB errors                                             |
| `tests/api/catalog.test.ts`                 |     6 | Product listing, cache hit/miss headers, pagination, search suggestions                                     |
| `tests/api/checkout.test.ts`                |     6 | Auth checks, billing cycle validation, Stripe session creation                                              |
| `tests/services/ai-recommendations.test.ts` |    10 | Recommendation structure, wardrobe item matching, multi-provider support (OpenAI/Anthropic), error recovery |
| `tests/services/weather.test.ts`            |    10 | Weather context, temp rounding, cold/hot flags, rain/umbrella/layer detection, API fallback                 |
| `tests/lib/redis.test.ts`                   |    10 | Cache get/set/delete, TTL defaults, multi-key delete, error resilience                                      |
| `tests/lib/ratelimit.test.ts`               |     9 | User/IP identifier extraction, 429 responses, Retry-After headers, forwarded-for parsing                    |

**Coverage thresholds** (enforced in `vitest.config.ts`):

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 70%       |
| Functions  | 70%       |
| Statements | 70%       |
| Branches   | 60%       |

**Test infrastructure:**

- **MSW** intercepts HTTP calls to OpenAI, Anthropic, and OpenWeather APIs
- **Vitest `vi.mock`** stubs Supabase, Stripe, Redis, and NextAuth at the module level
- **Global setup** (`tests/setup.ts`) starts/stops the MSW server and resets handlers between tests

## Error Monitoring & Performance

- Sentry Integration: Comprehensive error tracking with user context
- Performance Monitoring: Database query optimization and API response tracking
- Breadcrumbs: User action tracking for better debugging
- Production-Ready: Proper error boundaries and graceful degradation

## Contact

Rima Nafougui - [@RimaNafougui](https://github.com/RimaNafougui)

Project Link: [https://github.com/RimaNafougui/rcapsule](https://github.com/RimaNafougui/rcapsule)

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HeroUI](https://www.heroui.com/)
