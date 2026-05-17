# Rcapsule — Solution Architecture

> **Audience**: Engineers, technical reviewers, and portfolio readers.
> **Purpose**: Describe the system design, technology decisions, and engineering tradeoffs that underpin Rcapsule — a full-stack SaaS wardrobe management platform.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context](#2-system-context)
3. [Architecture Overview](#3-architecture-overview)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [API Design](#6-api-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Caching & Performance Strategy](#8-caching--performance-strategy)
9. [AWS Integration](#9-aws-integration)
10. [External Service Integrations](#10-external-service-integrations)
11. [Security Architecture](#11-security-architecture)
12. [Observability & Error Handling](#12-observability--error-handling)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [Technology Decisions & Tradeoffs](#14-technology-decisions--tradeoffs)
15. [Known Constraints & Future Work](#15-known-constraints--future-work)

---

## 1. Executive Summary

**Rcapsule** is a multi-tenant SaaS application that allows users to digitally catalogue their wardrobe, build outfit combinations, track wear history, receive AI-generated outfit recommendations based on live weather data, and share collections publicly.

| Attribute        | Value                                               |
| ---------------- | --------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                  |
| Deployment       | Vercel (Serverless Functions + Edge Network)        |
| Database         | PostgreSQL via Supabase                             |
| Auth             | NextAuth v5 (JWT) — Google, GitHub, Credentials     |
| Caching          | Upstash Redis (REST, serverless-safe)               |
| Payments         | Stripe (Checkout + Webhooks + Customer Portal)      |
| AI               | OpenAI `gpt-4o-mini` with Anthropic Claude fallback |
| Image Storage    | Supabase Storage                                    |
| Image Processing | AWS Lambda (background removal)                     |
| Monitoring       | Sentry (server + client), Vercel Analytics          |
| Testing          | Vitest + MSW (72 tests, 8 suites)                   |

The system is designed for **zero-ops operation**: Vercel handles scaling, Supabase handles the database plane, and Upstash Redis operates over HTTP — no persistent connections, sockets, or server management required.

---

## 2. System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           External Actors                               │
│                                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  Browser │   │ Chrome Ext.  │   │ Stripe Cloud │   │  Sentry    │  │
│  └────┬─────┘   └──────┬───────┘   └──────┬───────┘   └─────┬──────┘  │
│       │                │                  │                  │          │
└───────┼────────────────┼──────────────────┼──────────────────┼──────────┘
        │                │ CORS             │ Webhooks          │ SDK
        ▼                ▼                  ▼                   │
┌───────────────────────────────────────────────┐               │
│              Vercel Edge Network              │               │
│         (CDN, TLS termination, routing)       │               │
└─────────────────────┬─────────────────────────┘               │
                      │                                          │
                      ▼                                          │
┌─────────────────────────────────────────────────────────┐     │
│              Next.js Application (Serverless)           │◄────┘
│                                                         │
│  ┌────────────────┐   ┌───────────────────────────────┐ │
│  │  React UI      │   │  API Route Handlers (Node.js) │ │
│  │  (RSC + CSR)   │   │  /api/clothes, /api/outfits   │ │
│  └────────────────┘   │  /api/recommendations, etc.   │ │
│                        └───────────────────────────────┘ │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
    ┌────────┴───────┐    ┌─────────┴──────────┐
    │  Supabase      │    │  Upstash Redis      │
    │  (PostgreSQL + │    │  (Cache + Rate Limit│
    │   Storage)     │    │   + Idempotency)    │
    └────────────────┘    └─────────────────────┘
             │
    ┌────────┴──────────────────────────────────┐
    │          External APIs                    │
    │  OpenWeatherMap · OpenAI · Anthropic      │
    │  AWS Lambda (image processing)            │
    └───────────────────────────────────────────┘
```

---

## 3. Architecture Overview

### Architectural Style

Rcapsule follows a **monolithic full-stack Next.js architecture** with clear internal layering. This is sometimes called a "majestic monolith" — all code lives in one repository and deploys as a single unit, but logical concerns (UI, API, services, data) are separated into distinct layers.

This style was chosen over microservices for the following reasons:

- **Operational simplicity**: No inter-service networking, no service mesh, no distributed tracing overhead at this scale.
- **Type safety**: TypeScript types flow from DB interfaces → API handlers → React components without serialization gaps.
- **Vercel native**: The platform already disaggregates monoliths into per-route serverless functions at deploy time.

### Request Lifecycle

```
Browser Request
      │
      ▼
Vercel Edge (CSP headers, TLS, CDN cache for static)
      │
      ├─── Static asset? → Serve from CDN
      │
      ├─── Page route?   → Next.js RSC Server Component
      │                    (auth() → DB queries → HTML stream)
      │
      └─── API route?    → Next.js Route Handler
                           │
                           ├─ auth() → validate JWT session
                           ├─ Rate limiter (Upstash Redis)
                           ├─ Zod input validation
                           ├─ Business logic
                           ├─ Supabase query
                           └─ JSON response
```

---

## 4. Component Architecture

### Front-End Layer

The UI is built with **React 19** using the Next.js App Router. Server Components (RSC) handle data-fetching pages; Client Components handle interactive elements.

```
app/
├── (marketing)/          React Server Components — SSG/ISR
│   └── page.tsx, about, features, pricing
│
├── (auth)/               Light CSR forms with Server Actions
│   └── login, signup, forgot-password, update-password
│
├── (app)/                Authenticated, SSR per-request
│   ├── closet/           Wardrobe list, item detail, new item
│   ├── outfits/          Outfit builder (collage), outfit list
│   ├── collections/      Wardrobe collections
│   ├── settings/         Profile, billing, preferences
│   ├── catalogue/        Global product catalogue
│   ├── wishlist/         Saved items
│   └── calendar/         Wear history calendar
│
├── (admin)/              Admin-only, role-gated
│   └── users/, catalogue/
│
└── u/[username]/         Public profiles (SSR, no auth required)
```

#### Component Hierarchy

```
<RootLayout>                   # Providers: SessionProvider, HeroUI, Sentry
  <Header />                   # Nav, auth state, theme toggle
  <main>
    <Page />                   # Route-specific RSC or CSC
      <FeatureComponents />    # e.g. ClothingCard, OutfitCollage
        <UIComponents />       # Logo, Avatar, ConfirmModal, etc.
  <Footer />
```

#### Key Custom Hooks

| Hook                | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `useCalendarLogs`   | Fetch & manage wear calendar state       |
| `useCollageHistory` | Undo/redo stack for the collage builder  |
| `useCollageItems`   | Item positions and transforms in collage |
| `useCollagePanZoom` | Pinch-to-zoom and pan gesture handling   |
| `useCropModal`      | Crop dialog state for image uploads      |

### API Layer

All API endpoints are Next.js **Route Handlers** (`app/api/.../route.ts`). They are stateless Node.js functions — no shared in-process state beyond module-level singletons for DB/Redis clients.

Every handler follows this contract:

1. Authenticate (`auth()` → JWT session)
2. Rate-limit (Upstash sliding window)
3. Parse & validate input (Zod)
4. Execute business logic & DB queries (Supabase)
5. Return typed JSON response

### Service Layer

Long-running or provider-agnostic logic lives in `lib/services/`:

- **`ai-recommendations.ts`** — OpenAI primary, Anthropic fallback; prompt construction, JSON validation, wardrobe filtering
- **`weather.ts`** — OpenWeatherMap OneCall v3 primary, v2.5 fallback; maps condition codes to domain types

### Chrome Extension

`wardrobe-extension/` is a Manifest V3 Chrome Extension. It allows users to import clothing items from retail product pages directly into their wardrobe. It communicates with the Rcapsule API via authenticated `POST /api/extension/import` requests with CORS configured for `chrome-extension://` origins.

---

## 5. Data Architecture

### Schema Overview

The schema is a normalized PostgreSQL design hosted on Supabase. Core entities and their relationships:

```
User ──────────────────────────────────────────────────────┐
  │                                                         │
  ├──< Clothes >──< WardrobeClothes >──< Wardrobe          │
  │          │                              │               │
  │          └──< OutfitClothes >──< Outfit │               │
  │                                    │    │               │
  ├──< WearLog                         └──< WardrobeOutfit  │
  ├──< UserPreferences                                      │
  ├──< OutfitRecommendations                                │
  ├──< Follow (self-referential: User → User)               │
  ├──< Block  (self-referential: User → User)               │
  ├──< Like   (polymorphic: targetId + targetType)          │
  └──< Save   (outfitId FK)                                 │
                                                            │
GlobalProduct ──────────────────────────────────────────────┘
  └──< Clothes.globalproductid (optional link)
```

### Key Tables

**`User`** — Central entity. Contains profile data, social handles, subscription state (Stripe IDs + status), and display preferences.

**`Clothes`** — Individual wardrobe items. Rich metadata: brand, price, colors (array), seasons (array), materials, care instructions, sustainability flag, condition, wear count (`timesworn`), and media URLs. Dual-status: `owned` or `wishlist`.

**`Wardrobe`** — Named collections of clothes. Supports public sharing with `likeCount`.

**`Outfit`** — Named combinations of clothes, with wear tracking and social engagement.

**Junction tables** (`WardrobeClothes`, `OutfitClothes`, `WardrobeOutfit`) implement many-to-many relationships. `OutfitClothes` includes a `layer` field used for z-index ordering in the collage builder.

**`OutfitRecommendations`** — Persisted AI recommendations. Acts as both a daily-quota counter and a recommendation history.

**`GlobalProduct`** — Shared product catalogue populated by the Chrome extension and admin imports. Linked to user `Clothes` items via `globalproductid`.

### Data Access Pattern

All database access uses the **Supabase JavaScript SDK**. All query parameters are passed through the SDK's typed methods (`.eq()`, `.in()`, `.ilike()`, etc.), which parameterize values automatically — no raw SQL string interpolation anywhere in the codebase.

Complex queries use Supabase's nested relation syntax:

```typescript
supabase
  .from("Clothes")
  .select(
    `
    *,
    wardrobes:WardrobeClothes(
      wardrobeId, addedAt,
      wardrobe:Wardrobe(id, title)
    )
  `,
  )
  .eq("userId", userId)
  .order("createdAt", { ascending: false })
  .range(offset, offset + limit - 1);
```

### Row-Level Security

Supabase RLS policies are enabled on all tables. Application-level ownership checks (verifying `userId === session.user.id`) provide defence-in-depth above the database layer.

---

## 6. API Design

### Route Inventory

| Domain    | Method            | Path                        | Auth       | Rate Limit                    |
| --------- | ----------------- | --------------------------- | ---------- | ----------------------------- |
| Auth      | POST              | `/api/auth/signup`          | —          | authLimiter (5/10min)         |
| Auth      | \*                | `/api/auth/[...nextauth]`   | —          | —                             |
| Clothes   | GET, POST         | `/api/clothes`              | Required   | apiLimiter                    |
| Clothes   | GET, PUT, DELETE  | `/api/clothes/[id]`         | Required   | apiLimiter                    |
| Outfits   | GET, POST         | `/api/outfits`              | Required   | apiLimiter                    |
| Outfits   | GET, PUT, DELETE  | `/api/outfits/[id]`         | Required   | apiLimiter                    |
| Outfits   | GET               | `/api/outfits/[id]/collage` | Required   | apiLimiter                    |
| Wardrobes | GET, POST         | `/api/wardrobes`            | Required   | apiLimiter                    |
| AI        | GET, POST         | `/api/recommendations`      | Required   | heavyLimiter (10/min) + 2/day |
| Images    | POST, DELETE      | `/api/upload`               | Required   | apiLimiter                    |
| Images    | POST              | `/api/remove-background`    | Premium    | heavyLimiter                  |
| Social    | POST, DELETE      | `/api/likes`                | Required   | apiLimiter                    |
| Social    | GET, POST, DELETE | `/api/users/[u]/follow`     | Required   | apiLimiter                    |
| Social    | POST              | `/api/users/[u]/block`      | Required   | apiLimiter                    |
| Payments  | POST              | `/api/checkout`             | Required   | apiLimiter                    |
| Payments  | GET               | `/api/billing/portal`       | Required   | apiLimiter                    |
| Payments  | POST              | `/api/webhooks/stripe`      | Stripe sig | —                             |
| Analytics | GET               | `/api/analytics`            | Required   | apiLimiter                    |
| Calendar  | GET               | `/api/calendar`             | Required   | apiLimiter                    |
| Weather   | GET               | `/api/weather`              | Required   | apiLimiter                    |
| Catalogue | GET               | `/api/catalogue`            | —          | publicLimiter                 |
| Extension | POST              | `/api/extension/import`     | Required   | apiLimiter                    |
| Admin     | \*                | `/api/admin/*`              | Admin role | apiLimiter                    |

### Validation

All mutable endpoints validate request bodies with **Zod schemas** (`lib/validations/schemas.ts`) before touching the database. Validation errors return structured `400` responses with per-field messages:

```json
{
  "error": {
    "fieldErrors": {
      "username": [
        "Username can only contain letters, numbers, dashes, and underscores"
      ]
    },
    "formErrors": []
  }
}
```

### Rate Limiting Architecture

Four tiered limiters implemented with Upstash Redis sliding-window algorithm:

| Limiter         | Limit  | Window | Identifier | Endpoints                   |
| --------------- | ------ | ------ | ---------- | --------------------------- |
| `authLimiter`   | 5 req  | 10 min | IP         | Signup, password reset      |
| `apiLimiter`    | 60 req | 1 min  | User ID    | All authenticated endpoints |
| `heavyLimiter`  | 10 req | 1 min  | User ID    | AI, background removal      |
| `publicLimiter` | 30 req | 1 min  | IP         | Catalogue, username check   |

All rate-limited routes return `429` with `Retry-After` and `X-RateLimit-Reset` headers.

---

## 7. Authentication & Authorization

### Auth Stack

- **NextAuth v5** (beta) with JWT strategy
- **Providers**: Google OAuth 2.0, GitHub OAuth, Credentials (email or username + password)
- **Session storage**: Secure HTTP-only cookies (`__Secure-authjs.session-token` in production)

### JWT Token Lifecycle

```
1. User authenticates (OAuth callback or credentials check)
       │
       ▼
2. signIn() callback
   - OAuth: Upsert User row, store Account (provider tokens)
   - Credentials: Verify password via Supabase Auth
       │
       ▼
3. jwt() callback (runs once per new session)
   - Fetch user.role from DB
   - Store id, role in JWT payload
       │
       ▼
4. session() callback (runs on every auth() call)
   - Expose id, name, image, role to application
       │
       ▼
5. auth() called in Route Handlers / RSC
   - Validates JWT signature, checks expiry
   - Returns typed session object
```

### Authorization Layers

**Route Protection (Middleware — `proxy.ts`)**:

```
Protected paths: /profile, /closet, /settings, /outfits, /wishlist, /calendar, /collections
Guest paths:     /login, /signup, /forgot-password, /update-password

Logic:
  - Authenticated + guest path  → redirect /closet
  - Unauthenticated + protected → redirect /login?callbackUrl=...
```

**Role-Based Access (Admin routes)**:
All `/api/admin/*` routes call `requireAdmin()`:

```typescript
const session = await auth();
if (session.user.role !== "admin") return 403;
```

**Resource Ownership (All data mutation routes)**:
Every write verifies the requesting user owns the resource:

```typescript
const { data } = await supabase
  .from("Clothes")
  .select("userId")
  .eq("id", itemId)
  .single();

if (data.userId !== session.user.id) return 403;
```

---

## 8. Caching & Performance Strategy

### Cache Layers

| Layer                          | Technology              | Scope                    | Invalidation               |
| ------------------------------ | ----------------------- | ------------------------ | -------------------------- |
| Serverless function warm reuse | Module-level singletons | Supabase + Redis clients | Process restart            |
| Redis: analytics               | Upstash (600s TTL)      | Per user                 | On clothes/outfit mutation |
| Redis: user preferences        | Upstash (300s TTL)      | Per user                 | On preference update       |
| Redis: owned clothes           | Upstash (180s TTL)      | Per user                 | On clothes add/delete      |
| Redis: webhook idempotency     | Upstash (86400s TTL)    | Per Stripe event ID      | Expires naturally          |
| Next.js fetch cache            | HTTP revalidate         | Weather API              | 1800s (30 min)             |
| Vercel CDN                     | Edge cache              | Static assets            | Deploy                     |

### Redis Client Pattern

Redis uses an HTTP-based client (Upstash REST API), making it safe for serverless environments with no persistent connection overhead. The client is initialized as a module-level singleton and reused across warm function invocations:

```typescript
let _redis: Redis | null = null;

export function getRedis(): Redis {
  return (_redis ??= new Redis({ url, token }));
}
```

All cache operations are wrapped in try/catch — Redis failures degrade gracefully and never break request handling.

### Cold Start Optimizations

1. **Supabase client singleton**: Module-level `let _supabase` prevents client re-initialization on warm invocations, saving TLS handshake and auth header construction on every request.
2. **Redis client singleton**: Same pattern — already in place.
3. **Lazy limiter initialization**: Rate limiters use `??=` — only instantiated when first needed.
4. **Selective column projection**: DB queries specify exact columns rather than `SELECT *` where feasible, reducing data transfer and serialization overhead.
5. **Next.js Turbopack**: Development builds use Turbopack for faster HMR; production builds use the standard SWC compiler.

### Analytics Performance

The analytics endpoint is the most computationally expensive — it aggregates across clothes, outfits, and wear logs for a given user. The strategy:

- **Redis cache** (10-minute TTL) serves repeated requests without DB round-trips
- **Cache invalidation** on clothes/outfit mutations ensures freshness
- In-process computation (`calculateAnalytics`) runs on the server, keeping client payload minimal

---

## 9. AWS Integration

### Background Removal Service

The only direct AWS integration is an **AWS Lambda function** that performs AI-powered background removal on clothing images (premium feature).

```
Client (multipart/form-data or imageUrl)
      │
      ▼
POST /api/remove-background
      │
      ├─ Auth check: session.user.id must exist
      ├─ Subscription check: subscription_status === "premium"
      ├─ SSRF guard: URL must be HTTPS, no private IP ranges
      ├─ Convert image to base64
      │
      ▼
AWS Lambda (endpoint from env: AWS_LAMBDA_ENDPOINT)
      │  Input: { image: base64string }
      │  Output: { processedImage: base64string }
      │
      ▼
Return processed image to client
```

**SSRF Protection** — Before forwarding any URL to Lambda, the handler validates:

- Protocol must be `https:`
- Hostname must not match private/loopback ranges (`127.x`, `10.x`, `192.168.x`, `172.16-31.x`, `169.254.x`, `::1`, `0.0.0.0`)

---

## 10. External Service Integrations

### OpenWeatherMap

- **Primary**: OneCall API v3.0 — single call returns current conditions + hourly + daily forecast
- **Fallback**: Current Weather API v2.5 — used when OneCall quota is exceeded
- **Caching**: Next.js fetch cache with `revalidate: 1800` (30-minute ISR)
- **Data enrichment**: Condition codes mapped to domain types (`clear`, `rainy`, `snowy`, etc.); derived flags computed (`isCold`, `isHot`, `needsUmbrella`, `needsSunProtection`, `needsLayers`)

### OpenAI

- **Model**: `gpt-4o-mini` (cost-optimized for high-frequency use)
- **Response format**: `json_object` mode — structured output enforced at API level
- **Context**: System role = fashion stylist; user context includes weather summary, wardrobe inventory (JSON), occasion, recent wear history, and style preferences
- **Daily quota**: 2 recommendations per user per day; tracked in `OutfitRecommendations` table

### Anthropic Claude

- **Model**: `claude-3-haiku-20240307` (fast + cheap)
- **Role**: Fallback when `ANTHROPIC_API_KEY` is set and OpenAI is unavailable or errors
- **API version**: `2023-06-01`

### Stripe

- **Version**: `2025-12-15.clover`
- **Products**: Monthly + yearly subscription price IDs from environment
- **Checkout**: Creates Stripe Checkout sessions with `userId` in metadata for webhook linking
- **Portal**: Customer self-service via Stripe Billing Portal
- **Webhooks**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Idempotency**: Processed Stripe event IDs stored in Redis (`stripe_event:{id}`, 24h TTL) to prevent duplicate processing on Stripe retries

### Supabase Storage

- **Bucket**: `wardrobe-images`
- **Path pattern**: `{userId}/{folder}/{timestamp}-{random}.ext`
- **Allowed types**: JPEG, PNG, WEBP, GIF
- **Size limit**: 5 MB
- **Path ownership**: Verified before deletion (path must start with `{userId}/`)

---

## 11. Security Architecture

### Defence-in-Depth Matrix

| Layer       | Control          | Implementation                                            |
| ----------- | ---------------- | --------------------------------------------------------- |
| Transport   | TLS everywhere   | Vercel managed; HSTS 2-year preload                       |
| Application | CSP              | Restrictive allowlist; `unsafe-eval` dev-only             |
| Application | Clickjacking     | `X-Frame-Options: DENY`                                   |
| Application | MIME sniffing    | `X-Content-Type-Options: nosniff`                         |
| API         | Authentication   | NextAuth JWT, HTTP-only cookies                           |
| API         | Authorization    | Session check + resource ownership check per route        |
| API         | Admin access     | Role check (`user.role === "admin"`)                      |
| API         | Input validation | Zod schemas on all mutable endpoints                      |
| API         | SQL injection    | Parameterized queries via Supabase SDK                    |
| API         | SSRF             | URL validation + private IP blocklist                     |
| API         | CORS             | Explicit allowlist for extension origin                   |
| API         | Rate limiting    | Tiered Upstash Redis limiters                             |
| Database    | Access control   | RLS policies + service-role-only server client            |
| Payments    | PCI              | Stripe-hosted checkout; no card data on server            |
| Webhooks    | Authenticity     | `stripe.webhooks.constructEvent()` signature verification |
| Webhooks    | Replay           | Redis idempotency guard (24h window)                      |

### Security Headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; [strict allowlist]
```

---

## 12. Observability & Error Handling

### Sentry Integration

| Context         | Configuration                                       |
| --------------- | --------------------------------------------------- |
| Server          | DSN from env; 10% trace sample rate in production   |
| Client          | 100% trace sampling; PII collection enabled         |
| Edge            | Minimal config; request error capture               |
| Instrumentation | `onRequestError` hook captures all unhandled errors |

Custom spans annotate expensive operations:

```typescript
Sentry.startSpan(
  { op: "analytics.calculate", name: "Calculate Wardrobe Analytics" },
  async (span) => {
    // ... fetch + compute ...
    span?.setAttribute("total_items", clothes.length);
  },
);
```

### Error Handling Pattern

```typescript
// Uniform error extraction (handles Error, string, object, unknown)
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err !== null && typeof err === "object" && "message" in err)
    return (err as any).message;
  return "An unexpected error occurred";
}
```

All API routes return structured error responses:

```json
{ "error": "Human-readable message" }
```

Redis failures are always swallowed (non-fatal) to ensure cache unavailability never degrades the user experience.

### Vercel Analytics

Page view and Web Vitals tracking via `@vercel/analytics` — zero-configuration, privacy-friendly.

---

## 13. Infrastructure & Deployment

### Deployment Architecture

```
GitHub (main branch)
      │  git push
      ▼
Vercel CI
  - pnpm install
  - next build (SWC compiler + Sentry source maps)
  - Deploy to Vercel Edge Network
      │
      ├── Static assets → Vercel CDN (global PoPs)
      ├── API routes    → Serverless Functions (Node.js runtime)
      └── Middleware    → Edge Functions (V8 isolates, ultra-low latency)
```

### Environment Variables

```bash
# Auth
AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET

# Database
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Redis
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Payments
STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_WEBHOOK_SECRET

# AI
OPENAI_API_KEY, ANTHROPIC_API_KEY (optional)

# Weather
OPENWEATHER_API_KEY

# Image Processing
AWS_LAMBDA_ENDPOINT

# Sentry
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN

# Site
NEXT_PUBLIC_SITE_URL, ALLOWED_EXTENSION_ORIGIN, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

---

## 14. Technology Decisions & Tradeoffs

### Next.js App Router (vs Pages Router or separate API service)

**Chosen**: Next.js 16 App Router with Route Handlers

| Pro                                            | Con                                                  |
| ---------------------------------------------- | ---------------------------------------------------- |
| Unified codebase (UI + API in one repo/deploy) | Beta features (RSC streaming edge cases)             |
| Type-safe from DB → API → component            | Slightly higher cold start vs dedicated API server   |
| Excellent DX (Turbopack, HMR, TS out of box)   | Bundle size discipline required                      |
| Vercel-native deployment optimizations         | Less fine-grained scaling control than microservices |

### Supabase (vs raw Postgres + Prisma / raw Drizzle)

**Chosen**: Supabase (PostgreSQL + Auth + Storage + RLS)

| Pro                                                                    | Con                                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Managed Postgres + built-in Auth saves significant infrastructure work | Less query flexibility than Prisma/Drizzle ORM                              |
| Storage bucket tightly integrated with DB                              | Vendor lock-in for auth and storage                                         |
| RLS provides DB-level security                                         | SDK-level query API is less expressive than raw SQL for complex analytics   |
| Free tier sufficient for early traction                                | Connection pooling via PgBouncer (external config required for large scale) |

### Upstash Redis (vs Elasticache / self-hosted Redis)

**Chosen**: Upstash Redis (HTTP/REST based)

| Pro                                                                 | Con                                       |
| ------------------------------------------------------------------- | ----------------------------------------- |
| HTTP protocol — no persistent connection required (serverless-safe) | Higher per-command latency than TCP Redis |
| Per-request billing (no idle cost)                                  | Limited to single-region in free tier     |
| Built-in Ratelimit SDK                                              | REST API overhead vs raw RESP protocol    |
| No connection pool exhaustion under Lambda concurrency              |                                           |

### NextAuth v5 (vs Supabase Auth directly / Clerk)

**Chosen**: NextAuth v5 with Supabase as user store

| Pro                                                         | Con                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Full control over session data and callbacks                | Beta software — occasional breaking changes                                |
| Multi-provider (OAuth + credentials) with unified interface | Requires manual token refresh for OAuth providers                          |
| Extensible JWT/session callbacks for custom claims          | Supabase Auth used only for password verification (dual-system complexity) |
| No third-party user data costs                              |                                                                            |

### OpenAI `gpt-4o-mini` with Anthropic fallback

**Chosen**: Dual-provider AI with graceful fallback

| Pro                                                                             | Con                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `gpt-4o-mini` is 10x cheaper than GPT-4 while sufficient for outfit suggestions | JSON parsing requires cleanup (markdown code block stripping)     |
| `json_object` response format reduces parsing failures                          | AI hallucinations still possible (wardrobe ID filtering required) |
| Anthropic Claude failover improves resilience                                   | Adds complexity and a second API key to manage                    |

---

## 15. Known Constraints & Future Work

### Current Constraints

| Area                 | Constraint                                       | Mitigation                                                               |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| AI recommendations   | 2/day hard limit (cost control)                  | Redis quota tracking; Stripe premium tier for more                       |
| Analytics            | Computed on every request for cache miss         | Redis cache (10-min TTL) reduces DB load significantly                   |
| Session role updates | Role changes require re-login                    | Acceptable for admin use case; could add forced re-auth                  |
| Stripe SDK types     | `current_period_end` typed as `any` in v2025 API | Tracked for upstream fix                                                 |
| Extension CORS       | Single `ALLOWED_EXTENSION_ORIGIN` env var        | Sufficient for private extension; add token auth for public distribution |
| Collage generation   | Client-side only (`html2canvas`)                 | Server-side generation planned as a premium feature                      |

### Roadmap Considerations

1. **Blog integration** — Static MDX content via `app/(marketing)/blog/` with `@next/mdx`, no additional infrastructure required. Alternatively, link externally to a personal site with `rel="noopener"`.
2. **Background job queue** — For analytics pre-computation, email notifications, and recommendation pre-generation. Consider Vercel Cron + Upstash Queue.
3. **Connection pooling** — At scale (>1000 concurrent users), Supabase's built-in PgBouncer or Neon's branching should be evaluated.
4. **Structured logging** — Replace `console.error` with a pino/winston implementation with correlation IDs for distributed tracing.
5. **Content-based recommendations** — Complement weather-based AI outfits with collaborative filtering on community wear data.
6. **Server-side collage rendering** — Use `@vercel/og` or Puppeteer-as-Lambda to generate shareable outfit images server-side.

---

_Last updated: February 2026 · Rcapsule v1.x · Architecture by Rima Nafougui_
