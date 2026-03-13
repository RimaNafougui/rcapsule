"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Chip, Image, Spinner, Avatar } from "@heroui/react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type SortTab = "trending" | "recent" | "following";

interface FeedOutfit {
  id: string;
  name: string;
  imageUrl?: string;
  slug?: string;
  season?: string;
  occasion?: string;
  styleTags?: string[];
  likeCount: number;
  saveCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name?: string;
    image?: string;
    isVerified?: boolean;
  };
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

export default function DiscoverPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outfits, setOutfits] = useState<FeedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<SortTab>("trending");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 24;

  const fetchFeed = useCallback(
    async (tab: SortTab, season: string, currentOffset: number, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          sort: tab,
          limit: String(LIMIT),
          offset: String(currentOffset),
        });

        if (season) params.set("season", season);

        const res = await fetch(`/api/feed?${params}`);

        if (res.status === 401) {
          // Following feed requires auth
          return;
        }

        if (!res.ok) throw new Error();

        const data = await res.json();
        const newOutfits: FeedOutfit[] = data.outfits || [];

        if (replace) {
          setOutfits(newOutfits);
        } else {
          setOutfits((prev) => [...prev, ...newOutfits]);
        }

        setHasMore(newOutfits.length === LIMIT);
        setOffset(currentOffset + newOutfits.length);
      } catch {
        // Silent fail — show empty state
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchFeed(activeTab, selectedSeason, 0, true);
  }, [activeTab, selectedSeason, fetchFeed]);

  const handleTabChange = (tab: SortTab) => {
    if (tab === "following" && !session) {
      router.push("/login?callbackUrl=/discover");

      return;
    }

    setActiveTab(tab);
  };

  return (
    <div className="py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tighter italic mb-2">
          Discover
        </h1>
        <p className="text-default-500 text-sm">
          Real outfits from real people. Find your next inspiration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-default-200 mb-6">
        {(["trending", "recent", "following"] as SortTab[]).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors relative ${
              activeTab === tab
                ? "text-foreground"
                : "text-default-400 hover:text-default-600"
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}

        {/* Season filter */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-default-400 hidden sm:block">
            Season:
          </span>
          <div className="flex gap-1">
            {SEASONS.map((s) => (
              <button
                key={s}
                className={`text-[10px] px-2 py-1 border uppercase tracking-wider transition-colors ${
                  selectedSeason === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-default-200 text-default-500 hover:border-default-400"
                }`}
                onClick={() => setSelectedSeason(selectedSeason === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : outfits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-200">
          <p className="text-default-400 text-sm mb-4">
            {activeTab === "following"
              ? "Follow some people to see their outfits here."
              : "No outfits found. Check back soon."}
          </p>
          {activeTab === "following" && (
            <Button
              className="uppercase font-bold tracking-wider text-xs"
              radius="none"
              size="sm"
              variant="flat"
              onPress={() => setActiveTab("trending")}
            >
              Browse Trending Instead
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Masonry-style grid using CSS columns */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
            {outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                className="uppercase font-bold tracking-widest"
                isLoading={loadingMore}
                radius="none"
                variant="bordered"
                onPress={() => fetchFeed(activeTab, selectedSeason, offset, false)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OutfitCard({ outfit }: { outfit: FeedOutfit }) {
  return (
    <div className="break-inside-avoid mb-4 group relative border border-default-200 overflow-hidden hover:border-default-400 transition-colors">
      <Link href={`/u/${outfit.author.username}/looks/${outfit.slug || outfit.id}`}>
        {/* Image */}
        <div className="relative bg-default-100 overflow-hidden">
          {outfit.imageUrl ? (
            <Image
              removeWrapper
              alt={outfit.name}
              className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={outfit.imageUrl}
            />
          ) : (
            <div className="w-full aspect-[3/4] flex items-center justify-center text-default-300 text-xs uppercase">
              No Image
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 w-full p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
            <p className="text-white font-bold uppercase tracking-tight text-xs truncate">
              {outfit.name}
            </p>
          </div>
        </div>
      </Link>

      {/* Footer */}
      <div className="p-3 bg-background">
        <Link
          className="flex items-center gap-2 min-w-0 group/author"
          href={`/u/${outfit.author.username}`}
        >
          <Avatar
            className="w-6 h-6 flex-shrink-0"
            name={outfit.author.name || outfit.author.username}
            src={outfit.author.image || undefined}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider truncate text-default-500 group-hover/author:text-foreground transition-colors">
            @{outfit.author.username}
          </span>
        </Link>

        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-default-400">
            <HeartIcon className="w-3 h-3" />
            {outfit.likeCount}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-default-400">
            <BookmarkIcon className="w-3 h-3" />
            {outfit.saveCount}
          </span>
          {outfit.season && (
            <Chip className="ml-auto" size="sm" variant="flat">
              {outfit.season}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
