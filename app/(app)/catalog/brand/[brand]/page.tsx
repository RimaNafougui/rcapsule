import type { Metadata } from "next";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const baseUrl = "https://rcapsule.com";

interface Props {
  params: Promise<{ brand: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const brandName = decodeURIComponent(brand);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count } = await supabase
    .from("GlobalProduct")
    .select("*", { count: "exact", head: true })
    .ilike("brand", brandName);

  const itemCount = count || 0;

  return {
    title: `${brandName} Clothes & Outfits | Rcapsule`,
    description: `Explore ${itemCount} ${brandName} items cataloged on Rcapsule. Discover ${brandName} outfits, add pieces to your closet, and track cost-per-wear.`,
    openGraph: {
      title: `${brandName} Clothes & Outfits | Rcapsule`,
      description: `Browse ${itemCount} ${brandName} items on Rcapsule.`,
      url: `${baseUrl}/catalog/brand/${encodeURIComponent(brandName)}`,
      type: "website",
    },
    alternates: {
      canonical: `${baseUrl}/catalog/brand/${encodeURIComponent(brandName)}`,
    },
  };
}

async function getBrandProducts(brand: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: products } = await supabase
    .from("GlobalProduct")
    .select(
      "id, name, brand, category, originalprice, currency, imageurl, slug, colors",
    )
    .ilike("brand", brand)
    .order("createdat", { ascending: false })
    .limit(100);

  return products || [];
}

export default async function BrandPage({ params }: Props) {
  const { brand } = await params;
  const brandName = decodeURIComponent(brand);
  const products = await getBrandProducts(brandName);

  // Category breakdown
  const categoryCounts: Record<string, number> = {};

  for (const p of products) {
    const cat = p.category || "Other";

    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="py-8">
      {/* Back */}
      <Link
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-default-500 hover:text-foreground transition-colors mb-8"
        href="/catalog"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Catalog
      </Link>

      {/* Brand header */}
      <div className="mb-10 pb-8 border-b border-default-200">
        <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-tighter italic leading-none mb-4">
          {brandName}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-default-500">
          <span className="font-bold text-foreground text-lg">
            {products.length}
          </span>
          <span className="text-[10px] uppercase tracking-widest">
            Items Cataloged
          </span>

          {topCategories.length > 0 && (
            <>
              <span className="text-default-300">·</span>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(([cat, count]) => (
                  <span
                    key={cat}
                    className="text-[10px] px-2 py-1 border border-default-200 uppercase tracking-wider"
                  >
                    {cat} ({count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-default-200">
          <p className="text-default-400 text-sm">
            No products found for {brandName}.
          </p>
          <Link
            className="text-xs uppercase tracking-widest text-primary hover:underline mt-2 inline-block"
            href="/catalog"
          >
            Browse all brands
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              className="group border border-default-200 overflow-hidden hover:border-default-400 transition-colors"
              href={`/catalog?q=${encodeURIComponent(product.name)}`}
            >
              {/* Image */}
              <div className="relative aspect-square bg-default-100">
                {product.imageurl ? (
                  <Image
                    fill
                    unoptimized
                    alt={product.name}
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    src={product.imageurl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-default-300 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider truncate">
                  {product.name}
                </p>
                <p className="text-[9px] text-default-400 uppercase tracking-widest truncate mt-0.5">
                  {product.category}
                </p>
                {product.originalprice && (
                  <p className="text-[10px] font-mono text-default-500 mt-1">
                    ${product.originalprice} {product.currency || "CAD"}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
