"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Button,
  Spinner,
  Chip,
  Image as HeroImage,
  useDisclosure,
} from "@heroui/react";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  HeartIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapPinIcon,
  CloudIcon,
  CurrencyDollarIcon,
  StarIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

import ConfirmModal from "@/components/ui/ConfirmModal";

interface Outfit {
  id: string;
  name: string;
  description?: string;
  season?: string;
  occasion?: string;
  imageUrl?: string;
  isFavorite: boolean;
  timesWorn: number;
  lastWornAt?: string;
  weatherWorn?: string;
  temperatureWorn?: number;
  locationWorn?: string;
  rating?: number;
  isPublic: boolean;
  styleTags?: string[];
  allowComments: boolean;
  clothes: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    category: string;
    brand?: string;
    price?: number;
  }>;
  wardrobes?: Array<{
    id: string;
    title: string;
    coverImage?: string;
    slug?: string;
  }>;
  stats?: {
    totalValue: number;
    itemCount: number;
  };
}

export default function OutfitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchOutfit();
  }, [status, params.id]);

  const fetchOutfit = async () => {
    try {
      const response = await fetch(`/api/outfits/${params.id}`);

      if (response.ok) setOutfit(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/outfits/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/outfits");
      } else {
        toast.error("Failed to delete outfit");
      }
    } catch (error) {
      console.error(error);
    } finally {
      onDeleteClose();
    }
  };

  const toggleFavorite = async () => {
    if (!outfit) return;
    try {
      const res = await fetch(`/api/outfits/${outfit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !outfit.isFavorite }),
      });

      if (res.ok)
        setOutfit((prev) =>
          prev ? { ...prev, isFavorite: !prev.isFavorite } : prev,
        );
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !outfit)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="w-full">
      <div className="lg:flex lg:items-start">
        {/* IMAGE — sticky below navbar on desktop */}
        <div className="w-full lg:w-2/5 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={outfit.name}
            className="w-full h-full object-contain object-center"
            src={outfit.imageUrl || "/images/placeholder.png"}
          />
        </div>

        {/* DETAILS */}
        <div className="w-full lg:w-3/5 flex flex-col justify-start px-6 py-8 lg:px-16">
          <Button
            className="uppercase tracking-widest text-xs font-bold pl-0 mb-6 self-start"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            variant="light"
            onPress={() => router.back()}
          >
            Back
          </Button>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {outfit.isPublic ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-default-100 text-default-600 eyebrow">
                <GlobeAltIcon className="w-3 h-3" />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-default-100 text-stone eyebrow">
                <LockClosedIcon className="w-3 h-3" />
                Private
              </div>
            )}
            {outfit.season && (
              <Chip
                className="uppercase text-[10px]"
                radius="none"
                size="sm"
                variant="bordered"
              >
                {outfit.season}
              </Chip>
            )}
            {outfit.occasion && (
              <Chip
                className="uppercase text-[10px]"
                radius="none"
                size="sm"
                variant="bordered"
              >
                {outfit.occasion}
              </Chip>
            )}
          </div>

          {/* Title + favorite */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-display font-light text-[clamp(32px,4vw,56px)] tracking-tight leading-tight">
              {outfit.name}
            </h1>
            <button
              className="mt-1 flex-shrink-0 text-default-400 hover:text-danger transition-colors"
              onClick={toggleFavorite}
            >
              {outfit.isFavorite ? (
                <HeartSolidIcon className="w-6 h-6 text-danger" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {outfit.description && (
            <p className="text-default-500 font-light text-lg mb-6 border-l-2 border-foreground pl-4 italic">
              &quot;{outfit.description}&quot;
            </p>
          )}

          {/* Style tags */}
          {outfit.styleTags && outfit.styleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {outfit.styleTags.map((tag) => (
                <Chip
                  key={tag}
                  className="text-[10px] uppercase tracking-wider"
                  radius="full"
                  size="sm"
                  variant="flat"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-8 mb-8 border-y border-divider py-4">
            <div>
              <span className="block text-3xl num">{outfit.timesWorn}</span>
              <span className="eyebrow text-stone">Times Worn</span>
            </div>
            {outfit.lastWornAt && (
              <div>
                <span className="block text-xl num mt-1.5">
                  {new Date(outfit.lastWornAt).toLocaleDateString()}
                </span>
                <span className="eyebrow text-stone">Last Outing</span>
              </div>
            )}
            {outfit.stats && outfit.stats.totalValue > 0 && (
              <div>
                <span className="block text-xl num mt-1.5 flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline" />
                  {outfit.stats.totalValue.toFixed(2)}
                </span>
                <span className="eyebrow text-stone">Total Value</span>
              </div>
            )}
            {outfit.rating && (
              <div>
                <span className="block text-xl font-light mt-1.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${i < outfit.rating! ? "fill-foreground text-foreground" : "text-default-300"}`}
                    />
                  ))}
                </span>
                <span className="eyebrow text-stone">Rating</span>
              </div>
            )}
          </div>

          {/* Last worn context */}
          {(outfit.weatherWorn ||
            outfit.locationWorn ||
            outfit.temperatureWorn) && (
            <div className="flex items-center gap-4 mb-8 p-4 bg-default-50 border border-default-200">
              <span className="eyebrow text-stone mr-2">Last Worn</span>
              {outfit.locationWorn && (
                <span className="flex items-center gap-1 text-xs text-default-600">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {outfit.locationWorn}
                </span>
              )}
              {outfit.weatherWorn && (
                <span className="flex items-center gap-1 text-xs text-default-600">
                  <CloudIcon className="w-3.5 h-3.5" />
                  {outfit.weatherWorn}
                </span>
              )}
              {outfit.temperatureWorn && (
                <span className="text-xs text-default-600">
                  {outfit.temperatureWorn}°
                </span>
              )}
            </div>
          )}

          {/* Pieces */}
          <div className="mb-8">
            <h3 className="eyebrow text-stone mb-4">
              Pieces (
              <span className="num">
                {outfit.stats?.itemCount ?? outfit.clothes.length}
              </span>
              )
            </h3>
            <div className="space-y-3">
              {outfit.clothes.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 items-center group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/closet/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      router.push(`/closet/${item.id}`);
                  }}
                >
                  <div className="w-16 h-16 flex-shrink-0 bg-default-50 border border-default-200 overflow-hidden">
                    <HeroImage
                      removeWrapper
                      alt={item.name}
                      className="w-full h-full object-contain object-center"
                      radius="none"
                      src={item.imageUrl || ""}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow text-stone">
                      {item.brand || item.category}
                    </p>
                    <p className="font-display font-light tracking-tight group-hover:underline truncate">
                      {item.name}
                    </p>
                    {item.price && (
                      <p className="eyebrow text-stone">
                        <span className="num">${item.price}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collections this outfit belongs to */}
          {outfit.wardrobes && outfit.wardrobes.length > 0 && (
            <div className="mb-8">
              <h3 className="eyebrow text-stone mb-4">In Collections</h3>
              <div className="flex flex-wrap gap-2">
                {outfit.wardrobes.map((w) => (
                  <button
                    key={w.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-default-100 hover:bg-default-200 transition-colors text-xs uppercase tracking-wider font-medium"
                    onClick={() =>
                      router.push(`/collections/${w.slug || w.id}`)
                    }
                  >
                    <FolderIcon className="w-3.5 h-3.5 text-default-400" />
                    {w.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-auto pt-4">
            <Button
              fullWidth
              className="uppercase font-bold tracking-widest h-12"
              color="primary"
              radius="none"
              startContent={<PencilSquareIcon className="w-4 h-4" />}
              variant="solid"
              onPress={() => router.push(`/outfits/${outfit.id}/edit`)}
            >
              Edit Look
            </Button>
            <Button
              className="uppercase font-bold tracking-widest h-12 min-w-[100px]"
              color="danger"
              radius="none"
              startContent={<TrashIcon className="w-4 h-4" />}
              variant="bordered"
              onPress={onDeleteOpen}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message="Are you sure you want to delete this look? This cannot be undone."
        title="Delete Look"
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      />
    </div>
  );
}
