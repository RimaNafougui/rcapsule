import { Redis } from "@upstash/redis";

// Singleton Redis client – re-used across warm lambda invocations
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
    );
  }

  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return _redis;
}

// ─── Typed cache helpers ───────────────────────────────────────────────────

/**
 * Read a JSON value from the cache. Returns null on cache-miss or Redis errors.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const raw = await redis.get<T>(key);

    return raw ?? null;
  } catch {
    // Never let a Redis failure break the request
    return null;
  }
}

/**
 * Write a JSON value to the cache with an optional TTL (seconds).
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> {
  try {
    const redis = getRedis();

    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Non-fatal
  }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const redis = getRedis();

    await redis.del(...keys);
  } catch {
    // Non-fatal
  }
}

// ─── Domain cache-key helpers ─────────────────────────────────────────────
//
// Centralised key constructors keep TTL constants and key shapes in one
// place.  Bump the version suffix (v1 → v2) to invalidate all entries
// after a schema or shape change without touching every call-site.

/** Analytics snapshot for a user. TTL: 10 minutes. */
export const ANALYTICS_TTL = 600;
export function analyticsKey(userId: string) {
  return `analytics:v1:${userId}`;
}

/** User preference row for AI recommendations. TTL: 5 minutes. */
export const PREFS_TTL = 300;
export function prefsKey(userId: string) {
  return `prefs:v1:${userId}`;
}

/** Owned-clothes list used by AI recommendations. TTL: 3 minutes. */
export const OWNED_CLOTHES_TTL = 180;
export function ownedClothesKey(userId: string) {
  return `clothes:owned:v1:${userId}`;
}

/** Clothes list page (owned or wishlist). TTL: 2 minutes. */
export const CLOTHES_LIST_TTL = 120;
export function clothesListKey(userId: string, status: "owned" | "wishlist") {
  return `clothes:list:${status}:v1:${userId}`;
}

/** Outfits list. TTL: 2 minutes. */
export const OUTFITS_TTL = 120;
export function outfitsKey(userId: string) {
  return `outfits:v1:${userId}`;
}

/** Wardrobes list. TTL: 5 minutes. */
export const WARDROBES_TTL = 300;
export function wardrobesKey(userId: string) {
  return `wardrobes:v1:${userId}`;
}
