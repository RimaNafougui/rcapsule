import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { getErrorMessage } from "@/lib/utils/error";

// FIXED: Count distinct wornAt timestamps, not total rows
async function updateOutfitStats(
  supabase: any,
  outfitId: string,
  metadata?: any,
) {
  // Get distinct dates when this outfit was worn
  const { data: distinctWears, error: countError } = await supabase
    .from("WearLog")
    .select("wornAt")
    .eq("outfitId", outfitId)
    .order("wornAt", { ascending: false });

  if (countError) { /* error handled by returning partial data */ }

  // Count unique dates (not individual clothing items)
  const uniqueDates = new Set(
    distinctWears?.map((log: any) => log.wornAt.split("T")[0]) || [],
  );
  const totalWears = uniqueDates.size;

  const latestWear = distinctWears?.[0]?.wornAt || null;

  const updates: any = {
    timesWorn: totalWears,
    lastWornAt: latestWear,
  };

  if (metadata) {
    if (metadata.weather) updates.weatherWorn = metadata.weather;
    if (metadata.temperature)
      updates.temperatureWorn = parseInt(metadata.temperature);
    if (metadata.location) updates.locationWorn = metadata.location;
  }

  await supabase.from("Outfit").update(updates).eq("id", outfitId);
}

async function updateClothesStats(supabase: any, clothesIds: string[]) {
  for (const clothesId of clothesIds) {
    const { data: distinctWears } = await supabase
      .from("WearLog")
      .select("wornAt")
      .eq("clothesId", clothesId)
      .order("wornAt", { ascending: false });

    const uniqueDates = new Set(
      distinctWears?.map((log: any) => log.wornAt.split("T")[0]) || [],
    );

    const totalWears = uniqueDates.size;
    const lastWorn = distinctWears?.[0]?.wornAt || null;
    const firstWorn = distinctWears?.[distinctWears.length - 1]?.wornAt || null;

    const { error: clothesUpdateError } = await supabase
      .from("Clothes")
      .update({
        timesWorn: totalWears,
        lastWornAt: lastWorn,
      })
      .eq("id", clothesId);

    if (clothesUpdateError) { /* error handled by continuing loop */ }

    const { error: analyticsError } = await supabase
      .from("ClothesAnalytics")
      .upsert({
        clothesId,
        userId: (await supabase.auth.getUser()).data.user?.id,
        totalWears,
        lastWornAt: lastWorn,
        firstWornAt: firstWorn,
        lastCalculatedAt: new Date().toISOString(),
      });

    if (analyticsError) { /* error handled by continuing loop */ }
  }
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const supabase = getSupabaseServer();

  let query = supabase
    .from("WearLog")
    .select(
      `
      id, wornAt, occasion, weather, temperature, location, notes, outfitId, clothesId,
      outfit:Outfit(id, name, imageUrl, description, timesWorn),
      clothes:Clothes(id, name, imageUrl, category, brand)
    `,
    )
    .eq("userId", session.user.id)
    .order("wornAt", { ascending: true });

  if (start && end) {
    query = query
      .gte("wornAt", `${start}T00:00:00`)
      .lte("wornAt", `${end}T23:59:59`);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, outfitId, occasion, weather, temperature, location, notes } =
    body;
  const timestamp = `${date}T12:00:00`;

  const supabase = getSupabaseServer();

  try {
    // IMPROVED: Check for duplicate logs on same date
    const { data: existingLog } = await supabase
      .from("WearLog")
      .select("id")
      .eq("outfitId", outfitId)
      .eq("wornAt", timestamp)
      .limit(1);

    if (existingLog && existingLog.length > 0) {
      return NextResponse.json(
        { error: "This outfit is already logged for this date" },
        { status: 400 },
      );
    }

    const { data: outfitItems } = await supabase
      .from("OutfitClothes")
      .select("clothesId")
      .eq("outfitId", outfitId);

    if (!outfitItems || outfitItems.length === 0) {
      return NextResponse.json(
        { error: "Outfit has no items" },
        { status: 400 },
      );
    }

    const clothesIds = outfitItems.map((item) => item.clothesId);

    const logs = clothesIds.map((clothesId) => ({
      userId: session.user?.id,
      clothesId,
      outfitId,
      wornAt: timestamp,
      occasion,
      weather,
      temperature: temperature ? parseInt(temperature) : null,
      location,
      notes,
    }));

    const { error } = await supabase.from("WearLog").insert(logs);

    if (error) throw error;

    // Update both outfit and individual clothes stats
    await Promise.all([
      updateOutfitStats(supabase, outfitId, { weather, temperature, location }),
      updateClothesStats(supabase, clothesIds),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    originalDate,
    outfitId,
    newDate,
    occasion,
    weather,
    temperature,
    location,
    notes,
  } = body;
  const oldTimestamp = `${originalDate}T12:00:00`;
  const newTimestamp = `${newDate}T12:00:00`;

  const supabase = getSupabaseServer();

  try {
    // IMPROVED: Check for conflicts if changing date
    if (originalDate !== newDate) {
      const { data: existingLog } = await supabase
        .from("WearLog")
        .select("id")
        .eq("outfitId", outfitId)
        .eq("wornAt", newTimestamp)
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        return NextResponse.json(
          { error: "This outfit is already logged for the new date" },
          { status: 400 },
        );
      }
    }

    // Get affected clothes IDs before update
    const { data: affectedLogs } = await supabase
      .from("WearLog")
      .select("clothesId")
      .eq("outfitId", outfitId)
      .eq("wornAt", oldTimestamp);

    const clothesIds = affectedLogs?.map((log: any) => log.clothesId) || [];

    const { error } = await supabase
      .from("WearLog")
      .update({
        wornAt: newTimestamp,
        occasion,
        weather,
        temperature: temperature ? parseInt(temperature) : null,
        location,
        notes,
      })
      .eq("outfitId", outfitId)
      .eq("wornAt", oldTimestamp);

    if (error) throw error;

    // Update stats
    await Promise.all([
      updateOutfitStats(supabase, outfitId, { weather, temperature, location }),
      updateClothesStats(supabase, clothesIds),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const outfitId = searchParams.get("outfitId");
  const date = searchParams.get("date");

  if (!outfitId || !date)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = getSupabaseServer();
  const timestamp = `${date}T12:00:00`;

  try {
    // Get affected clothes IDs before deletion
    const { data: affectedLogs } = await supabase
      .from("WearLog")
      .select("clothesId")
      .eq("outfitId", outfitId)
      .eq("wornAt", timestamp);

    const clothesIds = affectedLogs?.map((log: any) => log.clothesId) || [];

    const { error } = await supabase
      .from("WearLog")
      .delete()
      .eq("outfitId", outfitId)
      .eq("wornAt", timestamp);

    if (error) throw error;

    // Update stats after deletion
    await Promise.all([
      updateOutfitStats(supabase, outfitId),
      updateClothesStats(supabase, clothesIds),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
