import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

// GET current visibility setting
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    const { data: user, error } = await supabase
      .from("User")
      .select("profilePublic")
      .eq("id", session.user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profilePublic: user?.profilePublic || false });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch visibility" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("User")
      .update({
        profilePublic: data.profilePublic || false,
      })
      .eq("id", session.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 },
    );
  }
}
