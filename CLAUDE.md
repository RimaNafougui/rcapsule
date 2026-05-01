# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Next.js dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint with auto-fix
pnpm test         # Run all Vitest tests

# Run a single test file
pnpm vitest run tests/api/clothes.test.ts

# Run tests with coverage
pnpm vitest run --coverage
```

## Architecture

**Stack**: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, HeroUI component library.

**Route groups**:
- `app/(app)/` — authenticated user-facing pages (closet, outfits, profile, discover, etc.)
- `app/(auth)/` — login, signup, onboarding (guest-only, redirected away when logged in)
- `app/(admin)/` — admin dashboard
- `app/(marketing)/` — public landing pages
- `app/api/` — 30+ API route handlers
- `app/u/[username]/` — public user profiles

**Middleware** (`proxy.ts`): NextAuth-wrapped middleware protects routes. Unauthenticated users hitting protected routes are redirected to `/login?callbackUrl=...`. Authenticated users are redirected away from auth routes to `/closet`.

**Auth** (`auth.ts`): NextAuth v5 beta with JWT strategy. Three providers: Google, GitHub, Credentials (email/username + Supabase password). The JWT callback lazy-loads `token.role` from DB **once per session** (only when `token.role === undefined`) — this avoids a DB round-trip on every request. Session type is extended in `types/` to include `id` (branded `UserId`) and `role`.

**Database**: PostgreSQL via Supabase JS SDK. All queries go through the singleton in `lib/supabase-server.ts`. Never use raw SQL — all queries are parameterized through the Supabase client. Resource ownership is always verified before mutations (never trust client-supplied IDs alone).

**Caching** (`lib/redis.ts`): Upstash Redis (HTTP, serverless-safe). Use the exported helpers:
```ts
cacheGet<T>(key)          // returns T | null
cacheSet(key, value, ttl) // default TTL 300s
cacheDel(...keys)          // variadic, call after mutations
```
Cache keys are constructed via exported functions (`analyticsKey`, `clothesListKey`, `outfitsKey`, etc.) — always use these, never hardcode strings. Keys are version-suffixed (`v1`) so bumping the suffix is the global invalidation strategy.

**Rate limiting** (`lib/ratelimit.ts`): Four Upstash sliding-window tiers — `auth`, `api`, `heavy`, `public`. Apply the appropriate limiter at the top of each API handler before any DB work. Use the `heavy` limiter for AI/image-processing routes. The `getIdentifier()` helper extracts user ID or IP from Vercel/Cloudflare/X-Forwarded-For headers.

**Validation** (`lib/validations/schemas.ts`): All request bodies are parsed with Zod. Types are derived via `z.infer<typeof schema>` — no separate interfaces. Return 400 with `result.error.flatten()` on failure.

## Type System

**Branded IDs** (`types/branded.ts`): Entity IDs (`UserId`, `ClothesId`, `OutfitId`, etc.) are branded types. Cast helpers (`asUserId`, `asClothesId`, etc.) are the **only** places where plain strings enter the branded world — use them only at trust boundaries (e.g., after verifying ownership from DB). Never cast arbitrarily.

**API responses** (`types/api-response.ts`): All client-facing fetches use the `ApiResponse<T>` discriminated union:
```ts
// ok: true  → result.data is T
// ok: false → result.error is string
```
The `apiFetch` wrapper handles network/parsing errors uniformly. Always check `result.ok` before accessing `result.data`.

## API Route Pattern

Every route handler follows this order:

```ts
export async function POST(req: Request) {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Rate limit
  const { success } = await apiLimiter.limit(session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // 3. Parse + Zod validate
  const body = await req.json();
  const result = mySchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

  // 4. Ownership check (for mutations on existing resources)
  // 5. Supabase query
  // 6. Cache invalidation (cacheDel) on writes
  // 7. Return JSON response
}
```

Admin routes add `requireAdmin()` after the auth check (verifies `role === "admin"`).

Sentry spans (`Sentry.startSpan`) wrap DB-heavy handlers; use `span?.setAttribute("result_count", n)` for observability.

## Service Layer (`lib/services/`)

Stateless functions that wrap external APIs and return structured interfaces — never raw API responses.

- **`ai-recommendations.ts`**: Tries OpenAI `gpt-4o-mini` first, falls back to Anthropic `claude-3-haiku` on failure. Prompt building is deterministic: weather context + user preferences + recent wear history + wardrobe inventory. Do not change prompt structure without testing both providers.
- **`weather.ts`**: OneCall v3 primary, v2.5 fallback. Returns a `WeatherContext` struct consumed by the AI recommendations service.

## Client State

**`lib/contexts/UserContext.tsx`**: Fetches from `/api/user/me` and exposes user state app-wide. Any component can trigger a refresh by dispatching `new CustomEvent("refreshUser")` on `window` — this decouples profile updates from component hierarchies without prop-drilling or router refreshes.

## Testing

Tests live in `tests/` mirroring the source structure. Vitest + MSW mocks external APIs (OpenAI, Anthropic, Stripe, weather). Coverage thresholds: 70% lines/functions/statements, 60% branches.

Known pre-existing TypeScript errors — **do not fix unless explicitly asked**:
- `components/calendar/CalendarTracker.tsx` — 3 errors (`timesWorn` possibly undefined)
- `components/closet/ClothesFilter.tsx` — 3 errors (HeroUI Accordion types)

## Key Files

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config — providers, JWT/session callbacks, custom error classes |
| `proxy.ts` | Middleware — route protection, redirect logic |
| `types/branded.ts` | Branded entity ID types + cast helpers |
| `types/api-response.ts` | `ApiResponse<T>` discriminated union + `apiFetch` wrapper |
| `lib/supabase-server.ts` | Singleton Supabase server client |
| `lib/redis.ts` | Redis singleton + cache helpers + key constructors |
| `lib/ratelimit.ts` | Tiered rate limiters + `getIdentifier()` |
| `lib/contexts/UserContext.tsx` | Global user state + `refreshUser` event |
| `lib/services/ai-recommendations.ts` | AI outfit generation (OpenAI primary, Anthropic fallback) |
| `lib/services/weather.ts` | Weather data (OneCall v3 + v2.5 fallback) |
| `lib/validations/schemas.ts` | All Zod schemas (types derived here, not in separate interfaces) |
| `lib/config/site.ts` | Nav items, site metadata |
| `ARCHITECTURE.md` | Detailed IBM-style architecture document |

## Environment Variables

See `.env.example` for the full list. Key groups:
- `AUTH_*` — NextAuth secret + OAuth credentials
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY/YEARLY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `AWS_LAMBDA_ENDPOINT` — background removal (premium feature)
- `LOOPS_API_KEY` + template IDs — transactional email
