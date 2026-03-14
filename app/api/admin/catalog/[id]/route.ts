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
    const { data, error } = await supabase
      .from("GlobalProduct")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const allowed = [
      "name",
      "brand",
      "category",
      "description",
      "imageurl",
      "retaillink",
      "originalprice",
      "currency",
      "inStock",
      "colors",
      "materials",
      "sustainability",
      "slug",
      "sku",
      "source",
      "externalId",
      "scrapingStatus",
    ];
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

    updates.updatedat = new Date().toISOString();

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("GlobalProduct")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update product" },
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

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("GlobalProduct")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
