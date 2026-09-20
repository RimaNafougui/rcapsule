import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { getWeather, getWeatherSummary } from "@/lib/services/weather";
import { getErrorMessage } from "@/lib/utils/error";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const supabase = getSupabaseServer();

  const { data: prefs, error: prefsError } = await supabase
    .from("UserPreferences")
    .select(
      "location_lat, location_lon, location_city, location_country, temperature_unit",
    )
    .eq("userId", session.user.id)
    .single();

  if (prefsError && prefsError.code !== "PGRST116") {
    return NextResponse.json({ error: prefsError.message }, { status: 500 });
  }

  if (!prefs?.location_lat || !prefs?.location_lon) {
    return NextResponse.json(
      {
        error: "Location not set",
        code: "LOCATION_NOT_SET",
        message:
          "Please set your location in settings to get weather-based recommendations",
      },
      { status: 400 },
    );
  }

  try {
    const weather = await getWeather(
      prefs.location_lat,
      prefs.location_lon,
      prefs.temperature_unit || "celsius",
    );

    return NextResponse.json({
      weather,
      summary: getWeatherSummary(weather),
      location: {
        city: prefs.location_city,
        country: prefs.location_country,
      },
    });
  } catch (error) {
    console.error("Weather API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch weather",
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
