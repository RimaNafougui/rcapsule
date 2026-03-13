"use client";
import type { GlobalProduct } from "@/lib/types/globalproduct";

import { use, useState } from "react";
import useSWR from "swr";
import { Button, Chip, Skeleton, useDisclosure, Image } from "@heroui/react";
import NextLink from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AddToClosetModal from "@/components/catalog/AddToClosetModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Not found");

    return r.json();
  });

export default function CatalogItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imgError, setImgError] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { data: product, isLoading } = useSWR<GlobalProduct>(
    `/api/catalog/${id}`,
    fetcher,
  );

  const handleAddToCloset = () => {
    if (status !== "authenticated") {
      router.push("/login");

      return;
    }
    onOpen();
  };

  const handleAddSuccess = () => {
    toast.success("Added to your closet!");
    onClose();
  };

  const handleAddToWishlist = async () => {
    if (status !== "authenticated") {
      router.push("/login");

      return;
    }
    if (wishlisted || wishlistLoading || !product) return;

    setWishlistLoading(true);
    try {
      const res = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          brand: product.brand || undefined,
          category: product.category,
          colors: product.colors || [],
          price: product.originalprice ?? undefined,
          condition: "new",
          status: "wishlist",
          imageUrl: product.processed_image_url || product.imageurl || undefined,
          link: product.retaillink || undefined,
          materials: product.materials || undefined,
          description: product.description || undefined,
          globalproductid: product.id,
        }),
      });

      if (res.ok) {
        setWishlisted(true);
        toast.success("Saved to wishlist!");
      } else {
        const err = await res.json();

        const msg = typeof err.error === "string" ? err.error : "Failed to add to wishlist";
        toast.error(msg);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="wardrobe-page-container py-10">
        <div className="flex gap-10 flex-col md:flex-row">
          <Skeleton className="w-full md:w-96 aspect-[3/4] rounded-none flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-3/4 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-24 w-full rounded" />
            <Skeleton className="h-10 w-40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wardrobe-page-container py-20 text-center">
        <p className="text-xl font-light italic text-default-400 mb-6">
          Product not found.
        </p>
        <Button as={NextLink} href="/catalog" radius="none" variant="bordered">
          Back to Catalog
        </Button>
      </div>
    );
  }

  const displayImage =
    !imgError && (product.processed_image_url || product.imageurl);
  const currencySymbol =
    product.currency === "EUR" ? "€" : product.currency === "GBP" ? "£" : "$";

  return (
    <div className="wardrobe-page-container py-8 min-h-screen">
      {/* Back */}
      <Button
        as={NextLink}
        className="mb-8 uppercase tracking-widest text-xs text-default-400 hover:text-foreground -ml-2"
        href="/catalog"
        radius="none"
        startContent={<ArrowLeftIcon className="w-3 h-3" />}
        variant="light"
      >
        Catalog
      </Button>

      <div className="flex gap-12 flex-col md:flex-row items-start">
        {/* Image */}
        <div className="w-full md:w-96 flex-shrink-0">
          <div className="aspect-[3/4] bg-content2 relative overflow-hidden">
            {displayImage ? (
              <Image
                alt={product.name}
                className="w-full h-full object-contain"
                radius="none"
                src={displayImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs uppercase tracking-widest text-default-300">
                  No Image
                </p>
              </div>
            )}

            {product.inStock === false && (
              <div className="absolute top-3 left-3 z-10">
                <Chip
                  classNames={{
                    content:
                      "text-[10px] uppercase tracking-wider font-semibold",
                  }}
                  color="warning"
                  size="sm"
                  variant="flat"
                >
                  Out of Stock
                </Chip>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-6">
          {/* Brand + badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-default-500">
              {product.brand}
            </p>
            <Chip radius="none" size="sm" variant="flat">
              {product.category}
            </Chip>
            {product.inStock !== false && (
              <Chip color="success" radius="none" size="sm" variant="flat">
                In Stock
              </Chip>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl font-extralight tracking-wide">
            {product.name}
          </h1>

          {/* Price */}
          {product.originalprice != null && (
            <p className="text-2xl font-light">
              {currencySymbol}
              {product.originalprice.toFixed(2)}{" "}
              <span className="text-sm text-default-400">
                {product.currency}
              </span>
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-default-400">
                Description
              </h2>
              <p className="text-sm font-light text-default-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Materials */}
          {product.materials && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-default-400">
                Materials
              </h2>
              <p className="text-sm font-light text-default-600">
                {product.materials}
              </p>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-default-400">
                Colors
              </h2>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color) => (
                  <Chip key={color} radius="none" size="sm" variant="flat">
                    {color}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Sustainability */}
          {product.sustainability && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-default-400">
                Sustainability
              </h2>
              <p className="text-sm font-light text-default-600">
                {product.sustainability}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <Button
              className="uppercase tracking-[0.15em] text-xs px-8 h-12"
              color="primary"
              radius="none"
              onPress={handleAddToCloset}
            >
              Add to Closet
            </Button>

            <Button
              className="uppercase tracking-[0.15em] text-xs h-12 border-default-300"
              isLoading={wishlistLoading}
              radius="none"
              startContent={
                !wishlistLoading &&
                (wishlisted ? (
                  <BookmarkSolidIcon className="w-4 h-4" />
                ) : (
                  <BookmarkIcon className="w-4 h-4" />
                ))
              }
              variant={wishlisted ? "flat" : "bordered"}
              onPress={handleAddToWishlist}
            >
              {wishlisted ? "Wishlisted" : "Wishlist"}
            </Button>

            {product.retaillink && (
              <Button
                as="a"
                className="uppercase tracking-[0.15em] text-xs h-12 border-default-300"
                endContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                href={product.retaillink}
                radius="none"
                rel="noopener noreferrer"
                target="_blank"
                variant="bordered"
              >
                Shop
              </Button>
            )}
          </div>

          {/* Source */}
          {product.source && (
            <p className="text-[10px] uppercase tracking-widest text-default-300">
              Source: {product.source}
            </p>
          )}
        </div>
      </div>

      <AddToClosetModal
        isOpen={isOpen}
        product={product}
        onClose={onClose}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
