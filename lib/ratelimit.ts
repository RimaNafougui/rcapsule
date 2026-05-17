import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/lib/redis";

// ─── Limiter factory (lazy-initialised) ───────────────────────────────────

function makeLimiter(tokens: number, windowSeconds: number) {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
    analytics: true,
  });
}

// ─── Named limiters ────────────────────────────────────────────────────────

/**
 * Auth routes (signup, password reset) – very tight to prevent brute-force.
 * 5 requests per IP per 10 minutes.
 */
let _authLimiter: Ratelimit | null = null;

export function authLimiter() {
  return (_authLimiter ??= makeLimiter(5, 600));
}

/**
 * General authenticated API routes.
 * 60 requests per user per minute.
 */
let _apiLimiter: Ratelimit | null = null;

export function apiLimiter() {
  return (_apiLimiter ??= makeLimiter(60, 60));
}

/**
 * Expensive / AI routes (recommendations, background removal).
 * 10 requests per user per minute.
 */
let _heavyLimiter: Ratelimit | null = null;

export function heavyLimiter() {
  return (_heavyLimiter ??= makeLimiter(10, 60));
}

/**
 * Public / unauthenticated routes (catalogue, username check).
 * 30 requests per IP per minute.
 */
let _publicLimiter: Ratelimit | null = null;

export function publicLimiter() {
  return (_publicLimiter ??= makeLimiter(30, 60));
}

// ─── Helper: build the identifier for a request ──────────────────────────

/**
 * Returns `user:<id>` when a userId is supplied, otherwise `ip:<ip>`.
 * The IP is extracted from standard Vercel / Cloudflare / forwarded headers.
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  return `ip:${ip}`;
}

// ─── Helper: build a 429 response with Retry-After ───────────────────────

export function rateLimitResponse(reset: number) {
  const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));

  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(reset),
      },
    },
  );
}
