import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("GlobalProduct")
      .select(
        `
        *,
        clothes:Clothes(count)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      popularityCount: data.clothes?.[0]?.count ?? 0,
      clothes: undefined,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
