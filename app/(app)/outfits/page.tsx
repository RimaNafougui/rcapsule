"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Image, Spinner, Switch } from "@heroui/react";
import { toast } from "sonner";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

// Import your WardrobeHeader component
// Note: Ensure the path matches where you saved the header component
import WardrobeHeader, {
  useSearchHistory,
} from "@/components/closet/WardrobeHeader";

interface Outfit {
  id: string;
  name: string;
  description?: string;
  season?: string;
  occasion?: string;
  imageUrl?: string;
  isFavorite: boolean;
  timesWorn: number;
  itemCount: number;
  createdAt: string;
}

export default function OutfitsPage() {
  const { status } = useSession();
  const router = useRouter();

  // --- Data State ---
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Header/Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent"); // recent, name, worn
  const [viewMode, setViewMode] = useState<"grid" | "gallery">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // --- Specific Filters ---
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterSeason, setFilterSeason] = useState<string>("all");

  // --- Search History Hook ---
  const { history, addSearch, clearHistory } = useSearchHistory();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchOutfits();
  }, [status, router]);

  const fetchOutfits = async () => {
    try {
      const response = await fetch("/api/outfits");

      if (response.ok) {
        const data = await response.json();

        setOutfits(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load outfits. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (
    e: React.MouseEvent,
    outfitId: string,
    currentStatus: boolean,
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });

      if (response.ok) {
        setOutfits((prev) =>
          prev.map((outfit) =>
            outfit.id === outfitId
              ? { ...outfit, isFavorite: !currentStatus }
              : outfit,
          ),
        );
      } else {
        toast.error("Failed to update favourite.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update favourite.");
    }
  };

  // --- Derived Data: Filter & Sort ---
  const filteredAndSortedOutfits = useMemo(() => {
    let result = [...outfits];

    // 1. Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();

      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(lowerQuery) ||
          o.season?.toLowerCase().includes(lowerQuery) ||
          o.occasion?.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Filters
    if (filterFavorites) {
      result = result.filter((o) => o.isFavorite);
    }
    if (filterSeason !== "all") {
      result = result.filter(
        (o) => o.season?.toLowerCase() === filterSeason.toLowerCase(),
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "worn":
          return b.timesWorn - a.timesWorn; // Most worn first
        case "price":
          return b.itemCount - a.itemCount; // Mapping "Price" to "Item Count" for this context
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return result;
  }, [outfits, searchQuery, filterFavorites, filterSeason, sortBy]);

  // Generate suggestions for autocomplete
  const suggestions = useMemo(() => {
    const names = outfits.map((o) => o.name);
    const seasons = outfits.map((o) => o.season).filter(Boolean) as string[];

    return Array.from(new Set([...names, ...seasons])).slice(0, 5);
  }, [outfits]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* --- INTEGRATED WARDROBE HEADER --- */}
      <WardrobeHeader
        actionLabel="Curate Look"
        history={history}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowFilters={setShowFilters}
        setSortBy={setSortBy}
        setViewMode={setViewMode}
        showFilters={showFilters}
        sortBy={sortBy}
        subtitle={
          <div className="flex gap-2 text-xs uppercase tracking-widest text-default-400 mt-1">
            <span>Collection</span>
            <span>/</span>
            <span className="text-foreground">All Looks</span>
          </div>
        }
        suggestions={suggestions}
        title="LOOKBOOK"
        viewMode={viewMode}
        onAddNew={() => router.push("/outfits/new")}
        onClearHistory={clearHistory}
        onSearchSubmit={(term) => {
          setSearchQuery(term);
          addSearch(term);
        }}
      />

      {/* --- COLLAPSIBLE FILTER PANEL --- */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden bg-default-50 border-b border-default-200"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
          >
            <div className="p-6 flex flex-wrap gap-8 items-center">
              {/* Filter: Favorites */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-default-500 font-bold">
                  Status
                </span>
                <Switch
                  classNames={{ label: "text-sm font-light" }}
                  isSelected={filterFavorites}
                  size="sm"
                  onValueChange={setFilterFavorites}
                >
                  Favorites Only
                </Switch>
              </div>

              {/* Filter: Season (Example of extra filtering) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-default-500 font-bold">
                  Season
                </span>
                <div className="flex gap-2">
                  {["All", "Summer", "Winter", "Spring", "Fall"].map(
                    (season) => (
                      <button
                        key={season}
                        className={`px-3 py-1 text-xs uppercase tracking-wide border transition-colors ${
                          filterSeason === season.toLowerCase()
                            ? "bg-black text-white border-black dark:bg-white dark:text-black"
                            : "border-default-200 text-default-500 hover:border-default-400"
                        }`}
                        onClick={() => setFilterSeason(season.toLowerCase())}
                      >
                        {season}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Active Results Count */}
              <div className="ml-auto text-xs text-default-400 italic">
                Showing {filteredAndSortedOutfits.length} results
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12">
        {filteredAndSortedOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-default-300">
            <p className="text-xl font-light italic mb-4">
              {searchQuery
                ? "No looks match your search."
                : "Your collection is empty."}
            </p>
            <button
              className="text-xs uppercase tracking-widest border-b border-black pb-1 hover:text-primary transition-colors"
              onClick={() => router.push("/outfits/new")}
            >
              Start Styling
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-x-6 gap-y-12 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" // Gallery mode is denser
            }`}
          >
            {filteredAndSortedOutfits.map((outfit) => (
              <div
                key={outfit.id}
                className="group cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/outfits/${outfit.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/outfits/${outfit.id}`);
                  }
                }}
              >
                <div className="relative aspect-[3/4] bg-content2 mb-4 overflow-hidden">
                  {outfit.imageUrl ? (
                    <Image
                      alt={outfit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      classNames={{ wrapper: "w-full h-full" }}
                      radius="none"
                      src={outfit.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-default-50 text-default-300">
                      <span className="text-4xl italic font-serif">
                        Capsule
                      </span>
                      <span className="text-[10px] uppercase tracking-widest mt-2">
                        No Visual
                      </span>
                    </div>
                  )}

                  <button
                    className="absolute top-3 right-3 z-20 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) =>
                      toggleFavorite(e, outfit.id, outfit.isFavorite)
                    }
                  >
                    {outfit.isFavorite ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-600 drop-shadow-md" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-white drop-shadow-md hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
                </div>

                {/* Info Section - Simplified in Gallery Mode? keeping same for now for consistency */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3
                      className={`font-bold uppercase tracking-tight leading-none ${viewMode === "gallery" ? "text-sm" : "text-lg"}`}
                    >
                      {outfit.name}
                    </h3>
                    {outfit.timesWorn > 0 && viewMode === "grid" && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                        Worn {outfit.timesWorn}x
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-default-500 uppercase tracking-wider">
                    <span>{outfit.itemCount} Items</span>
                    {viewMode === "grid" && outfit.occasion && (
                      <>
                        <span>•</span>
                        <span>{outfit.occasion}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
