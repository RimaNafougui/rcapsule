import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  styleTags: z.array(z.string()).min(1).max(8),
});

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getIdentifier(req, session.user.id);
  const { success, reset } = await apiLimiter().limit(identifier);

  if (!success) return rateLimitResponse(reset);

  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    await supabase
      .from("User")
      .update({ styleTags: result.data.styleTags, updatedAt: new Date().toISOString() })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving style tags:", error);

    return NextResponse.json({ error: "Failed to save style tags" }, { status: 500 });
  }
}
