import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { getErrorMessage } from "@/lib/utils/error";
import { cacheDel, analyticsKey } from "@/lib/redis";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items, date } = body;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  try {
    // Prepare the logs
    const logs = items.map((itemId: string) => ({
      userId: session.user?.id,
      clothesId: itemId,
      wornAt: date || new Date().toISOString(),
    }));

    // Insert into WearLog table
    const { error } = await supabase.from("WearLog").insert(logs);

    if (error) throw error;

    // Invalidate analytics cache — wear events affect cost-per-wear and
    // utilization metrics that are computed inside calculateAnalytics.
    await cacheDel(analyticsKey(session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
