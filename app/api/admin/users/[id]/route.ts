import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase-server";
import { apiLimiter, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();

    const [
      { data: user, error: userError },
      { data: items },
      { count: itemCount },
    ] = await Promise.all([
      supabase
        .from("User")
        .select(
          "id, name, email, image, role, subscription_status, isVerified, isFeatured, createdAt, bio, location, followerCount, followingCount, profileViews",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("Clothes")
        .select("id, name, category, brand, imageUrl, status, createdAt")
        .eq("userId", id)
        .order("createdAt", { ascending: false })
        .limit(20),
      supabase
        .from("Clothes")
        .select("*", { count: "exact", head: true })
        .eq("userId", id),
    ]);

    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      recentItems: items ?? [],
      itemCount: itemCount ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin user detail:", error);

    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const { id } = await params;

  try {
    const body = await req.json();
    const allowed = ["role", "isVerified", "isFeatured"];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date().toISOString();

    const supabase = getSupabaseServer();
    const { error } = await supabase.from("User").update(updates).eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireAdmin();

  if ("error" in result) return result.error;

  const { session } = result;
  const { success, reset } = await apiLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("User").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
