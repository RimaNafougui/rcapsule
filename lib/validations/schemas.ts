import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be 3-30 characters")
    .max(30, "Username must be 3-30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, dashes, and underscores",
    )
    .refine(
      (val) => !/^[-_]|[-_]$/.test(val),
      "Username cannot start or end with a dash or underscore",
    ),
});

export const clothesPostSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  price: z.union([z.number(), z.string()]).optional(),
  status: z.string().optional(),
  colors: z.array(z.string()).optional(),
  season: z.union([z.string(), z.array(z.string())]).optional(),
  size: z.string().optional(),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
  placesToWear: z.array(z.string()).optional(),
  materials: z.string().optional(),
  description: z.string().optional(),
  condition: z.string().optional(),
  globalproductid: z.string().optional(),
  purchaseDate: z.string().optional(),
  wardrobeIds: z.array(z.string()).optional(),
  careInstructions: z.string().optional(),
  sustainability: z.string().optional(),
  tags: z.array(z.string()).optional(),
  silhouette: z.string().optional(),
  style: z.string().optional(),
  neckline: z.string().optional(),
  pattern: z.string().optional(),
  length: z.string().optional(),
  fit: z.string().optional(),
  purchaseLocation: z.string().optional(),
  originalPrice: z.union([z.number(), z.string()]).optional(),
  purchaseType: z.string().optional(),
  purchaseCurrency: z.string().optional(),
});

export const clothesPutSchema = clothesPostSchema.partial();

export const profilePutSchema = z.object({
  name: z.string().max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .refine((val) => !/^[-_]|[-_]$/.test(val))
    .optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")).or(z.undefined()),
  instagramHandle: z.string().max(50).optional(),
  tiktokHandle: z.string().max(50).optional(),
  pinterestHandle: z.string().max(50).optional(),
  styleTags: z.array(z.string()).max(20).optional(),
  profilePublic: z.boolean().optional(),
  showClosetValue: z.boolean().optional(),
  showItemPrices: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
  location: z.string().optional(),
});

export const outfitPostSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  season: z.string().optional(),
  occasion: z.string().optional(),
  imageUrl: z.string().optional(),
  isFavorite: z.boolean().optional(),
  clothesIds: z.array(z.string()).optional(),
  wardrobeIds: z.array(z.string()).optional(),
});

// ─── Inferred types ──────────────────────────────────────────────────────────
//
// WHY z.infer instead of separate interfaces: keeping the schema as the single
// source of truth means the TypeScript type and the runtime validator can never
// drift apart. If a field is added to the schema it automatically appears in
// the type; if it's removed the type error propagates everywhere it was used.
// The previous pattern required updating both the schema AND an interface
// separately, which is error-prone.

export type SignupInput = z.infer<typeof signupSchema>;
export type ClothesPostInput = z.infer<typeof clothesPostSchema>;
export type ClothesPutInput = z.infer<typeof clothesPutSchema>;
export type ProfilePutInput = z.infer<typeof profilePutSchema>;
export type OutfitPostInput = z.infer<typeof outfitPostSchema>;
