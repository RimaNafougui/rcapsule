import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import LandingPage from "@/components/layout/LandingPage";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/closet");
  }

  const supabase = getSupabaseServer();

  const [{ count: itemCount }, brandsResult, categoriesResult] = await Promise.all([
    supabase.from("GlobalProduct").select("*", { count: "exact", head: true }),
    supabase.from("GlobalProduct").select("brand").not("brand", "is", null),
    supabase.from("GlobalProduct").select("category").not("category", "is", null),
  ]);

  const brandCount = new Set(brandsResult.data?.map((r) => r.brand?.toLowerCase())).size;
  const categoryCount = new Set(categoriesResult.data?.map((r) => r.category?.toLowerCase())).size;

  return (
    <LandingPage
      stats={{
        itemCount: itemCount ?? 0,
        brandCount,
        categoryCount,
      }}
    />
  );
}
