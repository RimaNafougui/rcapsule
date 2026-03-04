/**
 * Branded (nominal) types for entity IDs.
 *
 * WHY: TypeScript's structural type system treats `string` as `string`
 * everywhere, so nothing stops you from passing a `WardrobeId` where a
 * `ClothesId` is expected. A brand makes each ID type nominally distinct at
 * compile time with zero runtime cost — the brand lives only in the type
 * checker and is erased during compilation.
 *
 * PATTERN: `Brand<string, "UserId">` creates an intersection type that is
 * assignable from a plain `string` only through the explicit cast helpers
 * (`asUserId`, etc.). Regular string literals are rejected, so every
 * crossing of a trust boundary requires a conscious cast.
 */

declare const __brand: unique symbol;

/** Core branding utility. T is the runtime type, B is the phantom tag. */
type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ─── Entity ID brands ────────────────────────────────────────────────────────

export type UserId = Brand<string, "UserId">;
export type ClothesId = Brand<string, "ClothesId">;
export type OutfitId = Brand<string, "OutfitId">;
export type WardrobeId = Brand<string, "WardrobeId">;
export type GlobalProductId = Brand<string, "GlobalProductId">;
export type WearLogId = Brand<string, "WearLogId">;
export type UserPreferencesId = Brand<string, "UserPreferencesId">;
export type OutfitRecommendationId = Brand<string, "OutfitRecommendationId">;

// ─── Cast helpers ─────────────────────────────────────────────────────────────
//
// These are the ONLY places where plain strings enter the branded world.
// By convention, call them at trust boundaries: DB reads, session objects,
// and URL params — never inside business logic.

export const asUserId = (id: string): UserId => id as UserId;
export const asClothesId = (id: string): ClothesId => id as ClothesId;
export const asOutfitId = (id: string): OutfitId => id as OutfitId;
export const asWardrobeId = (id: string): WardrobeId => id as WardrobeId;
export const asGlobalProductId = (id: string): GlobalProductId =>
  id as GlobalProductId;
export const asWearLogId = (id: string): WearLogId => id as WearLogId;
export const asUserPreferencesId = (id: string): UserPreferencesId =>
  id as UserPreferencesId;
export const asOutfitRecommendationId = (id: string): OutfitRecommendationId =>
  id as OutfitRecommendationId;
