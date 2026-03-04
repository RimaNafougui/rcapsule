/**
 * Database types derived from the Supabase schema.
 * These replace `any` throughout the codebase for type-safe DB access.
 */

import type {
  UserId,
  ClothesId,
  OutfitId,
  WardrobeId,
  GlobalProductId,
  WearLogId,
  UserPreferencesId,
  OutfitRecommendationId,
} from "@/types/branded";

// ─── Core entities ─────────────────────────────────────────────────────────

export interface DbUser {
  id: UserId;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
  emailVerified: string | null;
  subscription_status: "free" | "premium" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbClothes {
  id: ClothesId;
  userId: UserId;
  name: string;
  brand: string | null;
  category: string;
  price: number | null;
  originalPrice: number | null;
  purchaseDate: string | null;
  purchaseLocation: string | null;
  purchaseType: string | null;
  purchaseCurrency: string | null;
  colors: string[];
  season: string[] | null;
  size: string | null;
  link: string | null;
  imageUrl: string | null;
  placesToWear: string[];
  materials: string[] | null;
  careInstructions: string | null;
  sustainability: string | null;
  description: string | null;
  condition: string | null;
  tags: string[] | null;
  silhouette: string | null;
  style: string | null;
  neckline: string | null;
  pattern: string | null;
  length: string | null;
  fit: string | null;
  status: "owned" | "wishlist" | null;
  likeCount: number;
  globalproductid: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbClothesWithWardrobes extends DbClothes {
  wardrobes: Array<{
    wardrobeId: string;
    addedAt: string;
    notes: string | null;
    wardrobe: Pick<DbWardrobe, "id" | "title"> | null;
  }>;
}

export interface DbWardrobe {
  id: WardrobeId;
  userId: UserId;
  title: string;
  description: string | null;
  isPublic: boolean;
  coverImage: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbWardrobeWithCount extends DbWardrobe {
  clothesCount: number;
}

export interface DbWardrobeClothes {
  wardrobeId: string;
  clothesId: string;
  addedAt: string;
  notes: string | null;
}

export interface DbOutfit {
  id: OutfitId;
  userId: UserId;
  name: string;
  description: string | null;
  season: string | null;
  occasion: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbOutfitWithClothes extends DbOutfit {
  clothes: DbClothes[];
  itemCount: number;
}

export interface DbOutfitClothes {
  id: string;
  outfitId: string;
  clothesId: string;
  layer: number;
}

export interface DbGlobalProduct {
  id: GlobalProductId;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  retaillink: string | null;
  imageurl: string | null;
  colors: string[];
  materials: string[] | null;
  originalprice: number | null;
  source: string | null;
  createdat: string;
  popularityCount?: number;
}

export interface DbLike {
  id: string;
  userId: string;
  targetType: "wardrobe" | "outfit" | "clothes";
  targetId: string;
  createdAt: string;
}

export interface DbAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbWearLog {
  id: WearLogId;
  userId: UserId;
  clothesId: ClothesId;
  wornAt: string;
}

export interface DbUserPreferences {
  id: UserPreferencesId;
  userId: UserId;
  location_lat: number | null;
  location_lon: number | null;
  location_city: string | null;
  location_country: string | null;
  temperature_unit: "celsius" | "fahrenheit";
  styleGoals: string[];
}

export interface DbOutfitRecommendation {
  id: OutfitRecommendationId;
  userid: UserId;
  items: Array<{
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    reason: string;
  }>;
  reasoning: string;
  stylenotes: string;
  weatherconsiderations: string;
  occasion: string | null;
  weatherdata: {
    temperature: number;
    condition: string;
    description: string;
  };
  status: "suggested" | "worn" | "skipped";
  expiresat: string;
  createdat: string;
}

// ─── Supabase JOIN shapes ──────────────────────────────────────────────────

/** Shape returned when selecting WardrobeClothes with nested clothes */
export interface DbWardrobeClothesJoined {
  addedAt: string;
  notes: string | null;
  clothes: DbClothes | null;
}

/** Shape returned when selecting GlobalProduct with clothes count join */
export interface DbGlobalProductWithCount extends DbGlobalProduct {
  clothes: [{ count: number }] | [];
}

/** Shape returned when selecting Outfit with OutfitClothes + Clothes */
export interface DbOutfitClothesJoined {
  id: string;
  layer: number;
  clothes: DbClothes | null;
}

export interface DbOutfitRaw extends DbOutfit {
  OutfitClothes: DbOutfitClothesJoined[];
}

/** Shape returned when selecting Wardrobe with WardrobeClothes count */
export interface DbWardrobeRaw extends DbWardrobe {
  WardrobeClothes: [{ count: number }] | [];
}

// ─── API response shapes ───────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface ApiSuccess {
  success: true;
}

export interface PaginatedResponse<T> {
  products: T[];
  total: number;
  limit: number;
  offset: number;
}
