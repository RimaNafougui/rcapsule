export interface Clothes {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  category: string;
  price?: number;
  purchaseDate?: string;
  colors?: string[];
  season?: string[];
  size?: string;
  link?: string;
  imageUrl?: string;
  placesToWear?: string[];
  createdAt: string;
  updatedAt: string;
  status: "owned" | "wishlist";
  materials?: string;
  careInstructions?: string;
  sustainability?: string;
  condition?: string;
  tags?: string[];
  silhouette?: string;
  style?: string;
  neckline?: string;
  pattern?: string;
  length?: string;
  fit?: string;
  retiredAt?: string;
  retirementReason?: string;
  purchaseLocation?: string;
  originalPrice?: number;
  purchaseType?: string;
  purchaseCurrency?: string;
  timesworn?: number;
  lastwornat?: string;
  description?: string;
  processed_image_url?: string;
  globalproductid?: string;
}

export interface Wardrobe {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WardrobeClothes {
  id: string;
  wardrobeId: string;
  clothesId: string;
  addedAt: string;
  notes?: string;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  season?: string;
  occasion?: string;
  imageUrl?: string;
  isFavorite: boolean;
  timesWorn: number;
  lastWornAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WardrobeOutfit {
  id: string;
  wardrobeId: string;
  outfitId: string;
  addedAt: string;
  notes?: string;
}

export interface OutfitClothes {
  id: string;
  outfitId: string;
  clothesId: string;
  layer?: number;
  createdAt: string;
}

export interface OutfitWearLog {
  id: string;
  outfitId: string;
  userId: string;
  wornAt: string;
  location?: string;
  notes?: string;
}
export interface User {
  username: string;
  website: string;
  coverImage: string;
  instagramHandle: string;
  tiktokHandle: string;
  pinterestHandle: string;
  styleTags: never[];
  profilePublic: boolean;
  showClosetValue: boolean;
  showItemPrices: boolean;
  allowMessages: boolean;
  id: string;
  email: string;
  name?: string;
  image?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  subscription_status: "free" | "premium";
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_period_end?: string;
  role?: "user" | "admin";
  isVerified?: boolean;
  isFeatured?: boolean;
}

export interface ClothesWithWardrobes extends Clothes {
  wardrobes?: Wardrobe[];
}

export interface WardrobeWithClothes extends Wardrobe {
  clothes?: Clothes[];
}

export interface OutfitWithClothes extends Outfit {
  clothes?: Clothes[];
}

export interface WardrobeWithOutfits extends Wardrobe {
  outfits?: Outfit[];
}
