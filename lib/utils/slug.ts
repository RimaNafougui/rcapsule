import { getSupabaseServer } from "@/lib/supabase-server";

export async function generateUniqueSlug(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  let slug = base;
  let attempt = 1;

  while (true) {
    let query = supabase
      .from("Wardrobe")
      .select("id")
      .eq("userId", userId)
      .eq("slug", slug);

    if (excludeId) query = query.neq("id", excludeId);

    const { data } = await query.maybeSingle();

    if (!data) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}
