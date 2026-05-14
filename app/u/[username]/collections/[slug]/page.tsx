"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Spinner,
  Image,
  Button,
  Chip,
  Breadcrumbs,
  BreadcrumbItem,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  ShareIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import LikeButton from "@/components/social/LikeButton";
import SaveButton from "@/components/social/SaveButton";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price?: number;
  colors: string[];
  season?: string;
  size?: string;
  imageUrl?: string;
  status?: string;
  condition?: string;
  timesworn?: number;
}

interface OutfitItem {
  id: string;
  name: string;
  imageUrl?: string;
  occasion?: string;
  season?: string;
  timesWorn?: number;
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  slug: string;
  likeCount: number;
  saveCount: number;
  viewCount: number;
  isPublic: boolean;
  styleTags?: string[];
  season?: string;
  occasion?: string;
  itemCount: number;
  outfitCount: number;
  createdAt: string;
}

interface Owner {
  id: string;
  username: string;
  name?: string;
  image?: string;
}

export default function PublicCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: _session } = useSession();
  const username = params.username as string;
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitItem[]>([]);
  const [activeTab, setActiveTab] = useState("clothes");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isOwnCollection, setIsOwnCollection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [username, slug]);

  const fetchCollection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${username}/collections/${slug}`);

      if (response.status === 404 || response.status === 403) {
        setNotFound(true);

        return;
      }

      if (!response.ok) throw new Error("Failed to fetch collection");

      const data = await response.json();

      setCollection(data.collection);
      setOwner(data.owner);
      setClothes(data.clothes || []);
      setOutfits(data.outfits || []);
      setIsLiked(data.isLiked);
      setIsSaved(data.isSaved);
      setIsOwnCollection(data.isOwnCollection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${collection?.title} by @${owner?.username}`, url });
      } catch (_err) {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !collection || !owner) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-light tracking-normal">
            Collection Not Found
          </h1>
          <p className="text-default-500 max-w-sm mx-auto">
            This collection doesn&apos;t exist or is set to private.
          </p>
        </div>
        <Button
          className="uppercase font-bold tracking-widest"
          radius="none"
          variant="flat"
          onPress={() => router.push(`/u/${username}`)}
        >
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* COVER IMAGE */}
      <div
        className="relative w-full h-[60vh] min-h-[500px] bg-content2 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${collection.coverImage || "/images/placeholder_wardrobe.jpg"})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 md:px-8 flex flex-col">
          <div className="pt-8 flex items-center justify-between">
            <Breadcrumbs
              classNames={{
                list: "bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10",
              }}
              separator={<ChevronRightIcon className="w-4 h-4" />}
            >
              <BreadcrumbItem>
                <Link
                  className="text-white/80 hover:text-white text-xs uppercase tracking-wider"
                  href={`/u/${username}`}
                >
                  @{username}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <span className="text-white/60 text-xs uppercase tracking-wider">Collections</span>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <span className="text-white text-xs uppercase tracking-wider font-bold">
                  {collection.title}
                </span>
              </BreadcrumbItem>
            </Breadcrumbs>

            <Button
              isIconOnly
              className="bg-black/30 backdrop-blur-xl text-white border border-white/10 hover:bg-black/50"
              radius="full"
              variant="flat"
              onPress={() => router.push(`/u/${username}`)}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex items-end pb-12 md:pb-16">
            <div className="w-full">
              <div className="flex items-center gap-3 flex-wrap mb-6">
                {collection.isPublic ? (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-wider border border-white/20 rounded-full">
                    <GlobeAltIcon className="w-3.5 h-3.5" />
                    <span>Public</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-wider border border-white/20 rounded-full">
                    <LockClosedIcon className="w-3.5 h-3.5" />
                    <span>Private</span>
                  </div>
                )}
                <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white/80 text-xs font-semibold uppercase tracking-wider border border-white/10 rounded-full">
                  {collection.itemCount} {collection.itemCount === 1 ? "Piece" : "Pieces"}
                </div>
                <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white/80 text-xs font-semibold uppercase tracking-wider border border-white/10 rounded-full">
                  {collection.outfitCount} {collection.outfitCount === 1 ? "Outfit" : "Outfits"}
                </div>
                {collection.styleTags?.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag}
                    classNames={{
                      base: "bg-white/10 backdrop-blur-xl border border-white/20",
                      content: "text-white text-[10px] uppercase tracking-widest font-bold",
                    }}
                    size="sm"
                    variant="flat"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-light tracking-normal text-white drop-shadow-2xl leading-none mb-6">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="max-w-2xl text-white/90 text-base md:text-lg font-light leading-relaxed drop-shadow-lg mb-8">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center justify-between flex-wrap gap-6">
                <Link className="flex items-center gap-3 group" href={`/u/${owner.username}`}>
                  <Avatar
                    className="w-12 h-12 ring-2 ring-white/20"
                    name={owner.name || owner.username}
                    src={owner.image || undefined}
                  />
                  <div>
                    <p className="text-white font-bold text-sm group-hover:underline">
                      {owner.name || owner.username}
                    </p>
                    <p className="text-white/60 text-xs">@{owner.username}</p>
                  </div>
                </Link>

                {!isOwnCollection && (
                  <div className="flex items-center gap-2">
                    <LikeButton
                      initialCount={collection.likeCount}
                      initialLiked={isLiked}
                      showCount={true}
                      size="md"
                      targetId={collection.id}
                      targetType="wardrobe"
                    />
                    <SaveButton
                      initialSaved={isSaved}
                      size="md"
                      targetId={collection.id}
                      targetType="wardrobe"
                    />
                    <Tooltip content="Share Collection">
                      <Button
                        isIconOnly
                        className="bg-white/10 backdrop-blur-xl border border-white/20 text-white"
                        radius="none"
                        size="md"
                        variant="flat"
                        onPress={handleShare}
                      >
                        <ShareIcon className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  </div>
                )}

                {isOwnCollection && (
                  <Button
                    className="border-white/20 text-white hover:bg-white/10 uppercase font-bold tracking-widest"
                    radius="none"
                    variant="bordered"
                    onPress={() => router.push(`/collections/${collection.slug || collection.id}`)}
                  >
                    Edit Collection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
        <Tabs
          fullWidth
          classNames={{
            tabList: "bg-default-100 p-1 rounded-full w-full gap-1",
            tab: "h-10 text-xs font-bold uppercase tracking-widest rounded-full",
            cursor: "rounded-full bg-foreground",
            tabContent: "group-data-[selected=true]:text-background",
            panel: "pt-10 px-0",
          }}
          selectedKey={activeTab}
          variant="solid"
          onSelectionChange={(k) => setActiveTab(k as string)}
        >
          <Tab key="clothes" title={`Pieces (${clothes.length})`}>
            {clothes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-300">
                <p className="text-default-400 uppercase tracking-widest text-sm">
                  No pieces in this collection
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
                {clothes.map((item) => (
                  <div key={item.id} className="group">
                    <div className="aspect-[3/4] bg-content2 relative overflow-hidden mb-4">
                      <Image
                        alt={item.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700"
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={item.imageUrl || "/images/placeholder.png"}
                      />
                      {item.status === "wishlist" && (
                        <div className="absolute top-2 right-2">
                          <Chip
                            classNames={{
                              base: "bg-danger-50/90 backdrop-blur-sm",
                              content: "text-danger font-semibold text-[10px] uppercase tracking-wider px-1",
                            }}
                            color="danger"
                            size="sm"
                            variant="flat"
                          >
                            Wishlist
                          </Chip>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {item.brand && (
                        <p className="text-[10px] font-display font-light tracking-normal text-default-400">
                          {item.brand}
                        </p>
                      )}
                      <h3 className="text-sm font-medium uppercase tracking-normal truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-default-400 capitalize">{item.category}</p>
                      {item.price && <p className="text-xs text-default-500">${item.price}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab>

          <Tab key="outfits" title={`Outfits (${outfits.length})`}>
            {outfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-300">
                <p className="text-default-400 uppercase tracking-widest text-sm">
                  No outfits in this collection
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
                {outfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/u/${username}/looks/${outfit.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        router.push(`/u/${username}/looks/${outfit.id}`);
                    }}
                  >
                    <div className="aspect-[3/4] bg-content2 relative overflow-hidden mb-4">
                      <Image
                        alt={outfit.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700"
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={outfit.imageUrl || "/images/placeholder.png"}
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium uppercase tracking-normal truncate">
                        {outfit.name}
                      </h3>
                      {outfit.occasion && (
                        <p className="text-[10px] text-default-400 uppercase tracking-wide">
                          {outfit.occasion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
