// app/api/recommendations/route.ts
import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { getWeather } from "@/lib/services/weather";
import {
  getOutfitRecommendation,
  getOutfitOptions,
  type ClothingItem,
} from "@/lib/services/ai-recommendations";
import { getErrorMessage } from "@/lib/utils/error";
import {
  cacheGet,
  cacheSet,
  prefsKey,
  PREFS_TTL,
  ownedClothesKey,
  OWNED_CLOTHES_TTL,
} from "@/lib/redis";

const DAILY_LIMIT = 2; // Increased to 2 based on common usage patterns

// --- TypeScript Interfaces ---
interface OutfitItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  reason: string;
}

interface AIRecommendation {
  items: OutfitItem[];
  reasoning: string;
  styleNotes: string;
  weatherConsiderations: string;
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const occasion = searchParams.get("occasion") || undefined;
  const optionCount = parseInt(searchParams.get("count") || "1");

  const supabase = getSupabaseServer();

  try {
    // 1. Rate limit check
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // Note: Table name is plural in your SQL
    const { count: usageCount } = await supabase
      .from("OutfitRecommendations")
      .select("*", { count: "exact", head: true })
      .eq("userid", session.user.id) // Lowercase 'userid'
      .gte("createdat", today.toISOString()); // Lowercase 'createdat'

    if ((usageCount ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          code: "RATE_LIMIT_EXCEEDED",
          message: `You've used your ${DAILY_LIMIT} daily recommendations. Try again tomorrow.`,
          resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
          remaining: 0,
        },
        { status: 429 },
      );
    }

    // 2. Get user's location preferences (cached)
    type PrefsRow = {
      location_lat: number;
      location_lon: number;
      temperature_unit: string;
      styleGoals: string[];
    };

    let prefs = await cacheGet<PrefsRow>(prefsKey(session.user.id));

    if (!prefs) {
      const { data, error: prefsError } = await supabase
        .from("UserPreferences")
        .select("location_lat, location_lon, temperature_unit, styleGoals")
        .eq("userId", session.user.id)
        .single();

      if (prefsError && prefsError.code !== "PGRST116") {
        throw new Error(prefsError.message);
      }

      prefs = data as PrefsRow | null;

      if (prefs) {
        await cacheSet(prefsKey(session.user.id), prefs, PREFS_TTL);
      }
    }

    if (!prefs?.location_lat || !prefs?.location_lon) {
      return NextResponse.json(
        {
          error: "Location not set",
          code: "LOCATION_NOT_SET",
          message:
            "Please set your location in settings to get AI recommendations",
        },
        { status: 400 },
      );
    }

    // 3. Get weather data
    const weather = await getWeather(
      prefs.location_lat,
      prefs.location_lon,
      (prefs.temperature_unit as "celsius" | "fahrenheit") || "celsius",
    );

    // 4. Get user's clothes (cached)
    let clothes = await cacheGet<ClothingItem[]>(
      ownedClothesKey(session.user.id),
    );

    if (!clothes) {
      const { data, error: clothesError } = await supabase
        .from("Clothes")
        .select(
          "id, name, category, colors, season, placesToWear, style, materials, imageUrl, status",
        )
        .eq("userId", session.user.id)
        .eq("status", "owned");

      if (clothesError) {
        throw new Error(clothesError.message);
      }

      clothes = (data as ClothingItem[]) ?? [];

      if (clothes.length > 0) {
        await cacheSet(
          ownedClothesKey(session.user.id),
          clothes,
          OWNED_CLOTHES_TTL,
        );
      }
    }

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        {
          error: "Not enough clothes",
          code: "INSUFFICIENT_WARDROBE",
          message: "Add at least 2 clothing items to get recommendations",
        },
        { status: 400 },
      );
    }

    // 5. Get recently worn items (last 7 days)
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentWearLogs } = await supabase
      .from("WearLog")
      .select("clothesId")
      .eq("userId", session.user.id)
      .gte("wornAt", sevenDaysAgo.toISOString());

    const recentlyWornIds = Array.from(
      new Set(recentWearLogs?.map((log) => log.clothesId) || []),
    );

    // 6. Build context
    const context = {
      weather,
      occasion,
      userPreferences: {
        styleGoals: prefs.styleGoals || [],
      },
      recentlyWorn: recentlyWornIds,
    };

    // 7. Get AI recommendation(s)
    let recommendations: AIRecommendation[] = [];

    if (optionCount > 1) {
      recommendations = await getOutfitOptions(
        clothes,
        context,
        Math.min(optionCount, 5),
      );
    } else {
      const single = await getOutfitRecommendation(clothes, context);

      recommendations = [single];
    }

    // 8. Store the recommendation(s)
    // Mapping keys to match your LOWERCASE SQL columns
    const recommendationsToStore = recommendations.map((rec) => ({
      userid: session.user?.id,
      items: rec.items,
      reasoning: rec.reasoning,
      stylenotes: rec.styleNotes, // SQL: stylenotes
      weatherconsiderations: rec.weatherConsiderations, // SQL: weatherconsiderations
      occasion: occasion || null,
      weatherdata: {
        // SQL: weatherdata
        temperature: weather.current.temperature,
        condition: weather.current.condition,
        description: weather.current.description,
      },
      status: "suggested",
      expiresat: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), // SQL: expiresat
    }));

    const { error: insertError } = await supabase
      .from("OutfitRecommendations") // SQL: Plural table name
      .insert(recommendationsToStore);

    if (insertError) {
      // We still return the data so the user sees the outfit even if storage failed
    }

    // Calculate remaining recommendations
    const remaining = DAILY_LIMIT - (usageCount ?? 0) - recommendations.length;

    return NextResponse.json({
      recommendations,
      weather: {
        temperature: weather.current.temperature,
        condition: weather.current.condition,
        description: weather.current.description,
      },
      generatedAt: new Date().toISOString(),
      remaining: Math.max(0, remaining),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate recommendation",
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// POST - Generate recommendation with custom parameters
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { occasion, excludeIds, customWeather } = body;

  const supabase = getSupabaseServer();

  try {
    // 1. Rate limit check
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const { count: usageCount } = await supabase
      .from("OutfitRecommendations")
      .select("*", { count: "exact", head: true })
      .eq("userid", session.user.id)
      .gte("createdat", today.toISOString());

    if ((usageCount ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          code: "RATE_LIMIT_EXCEEDED",
          message: `You've used your ${DAILY_LIMIT} daily recommendations. Try again tomorrow.`,
          resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
          remaining: 0,
        },
        { status: 429 },
      );
    }

    // 2. Get user preferences (cached)
    type PrefsRowPost = {
      location_lat: number;
      location_lon: number;
      temperature_unit: string;
      styleGoals: string[];
    };

    let prefs = await cacheGet<PrefsRowPost>(prefsKey(session.user.id));

    if (!prefs) {
      const { data } = await supabase
        .from("UserPreferences")
        .select("location_lat, location_lon, temperature_unit, styleGoals")
        .eq("userId", session.user.id)
        .single();

      prefs = data as PrefsRowPost | null;

      if (prefs) {
        await cacheSet(prefsKey(session.user.id), prefs, PREFS_TTL);
      }
    }

    // 3. Get weather
    let weather;

    if (customWeather) {
      weather = customWeather;
    } else if (prefs?.location_lat && prefs?.location_lon) {
      weather = await getWeather(
        prefs.location_lat,
        prefs.location_lon,
        (prefs.temperature_unit as "celsius" | "fahrenheit") || "celsius",
      );
    } else {
      return NextResponse.json(
        { error: "Location not set", code: "LOCATION_NOT_SET" },
        { status: 400 },
      );
    }

    // 4. Get clothes (cached)
    let clothes = await cacheGet<ClothingItem[]>(
      ownedClothesKey(session.user.id),
    );

    if (!clothes) {
      const { data } = await supabase
        .from("Clothes")
        .select(
          "id, name, category, colors, season, placesToWear, style, materials, imageUrl, status",
        )
        .eq("userId", session.user.id)
        .eq("status", "owned");

      clothes = (data as ClothingItem[]) ?? [];

      if (clothes.length > 0) {
        await cacheSet(
          ownedClothesKey(session.user.id),
          clothes,
          OWNED_CLOTHES_TTL,
        );
      }
    }

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        { error: "Not enough clothes", code: "INSUFFICIENT_WARDROBE" },
        { status: 400 },
      );
    }

    // 5. Get recently worn
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentWearLogs } = await supabase
      .from("WearLog")
      .select("clothesId")
      .eq("userId", session.user.id)
      .gte("wornAt", sevenDaysAgo.toISOString());

    const recentlyWornIds = Array.from(
      new Set([
        ...(recentWearLogs?.map((log) => log.clothesId) || []),
        ...(excludeIds || []),
      ]),
    );

    // 6. Build context
    const context = {
      weather,
      occasion,
      userPreferences: {
        styleGoals: prefs?.styleGoals || [],
      },
      recentlyWorn: recentlyWornIds,
    };

    // 7. Get AI recommendation
    const recommendation: AIRecommendation = await getOutfitRecommendation(
      clothes,
      context,
    );

    // 8. Store the recommendation
    const { error: insertError } = await supabase
      .from("OutfitRecommendations") // Plural
      .insert({
        userid: session.user.id, // Lowercase
        items: recommendation.items,
        reasoning: recommendation.reasoning,
        stylenotes: recommendation.styleNotes, // Lowercase
        weatherconsiderations: recommendation.weatherConsiderations, // Lowercase
        occasion: occasion || null,
        weatherdata: {
          // Lowercase
          temperature: weather.current.temperature,
          condition: weather.current.condition,
          description: weather.current.description,
        },
        status: "suggested",
        expiresat: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), // Lowercase
      });

    if (insertError) { /* non-critical: storage failed, return data anyway */ }

    const remaining = DAILY_LIMIT - (usageCount ?? 0) - 1;

    return NextResponse.json({
      recommendation,
      weather: {
        temperature: weather.current.temperature,
        condition: weather.current.condition,
        description: weather.current.description,
      },
      generatedAt: new Date().toISOString(),
      remaining: Math.max(0, remaining),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate recommendation",
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
