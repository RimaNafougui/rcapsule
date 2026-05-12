"use client";
import { Button, ButtonGroup, Input, Select, SelectItem } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

// --- Hook: Recent Searches (Reuse this in both pages) ---
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("wardrobe_search_history");

    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addSearch = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter((h) => h !== term)].slice(0, 5);

    setHistory(newHistory);
    localStorage.setItem("wardrobe_search_history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("wardrobe_search_history");
  };

  return { history, addSearch, clearHistory };
}

// --- Types ---
export type SuggestionType =
  | "item"
  | "brand"
  | "color"
  | "category"
  | "style"
  | "tag"
  | "place"
  | "season";

export interface SearchSuggestion {
  label: string;
  type: SuggestionType;
}

const SUGGESTION_LABELS: Record<SuggestionType, string> = {
  item: "Item",
  brand: "Brand",
  color: "Color",
  category: "Category",
  style: "Style",
  tag: "Tag",
  place: "Place",
  season: "Season",
};

// --- Props Interface ---
interface SortOption {
  key: string;
  label: string;
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { key: "recent", label: "Most Recent" },
  { key: "name", label: "Name (A-Z)" },
  { key: "price", label: "Price (High-Low)" },
  { key: "worn", label: "Most Worn" },
];

interface WardrobeHeaderProps {
  title: string;
  subtitle: React.ReactNode;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (term: string) => void;
  suggestions: SearchSuggestion[];
  history: string[];
  onClearHistory: () => void;
  sortBy: string;
  setSortBy: (sort: any) => void;
  viewMode: "grid" | "gallery";
  setViewMode: (mode: "grid" | "gallery") => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onAddNew: () => void;
  searchPlaceholder?: string;
  actionLabel?: string;
  sortOptions?: SortOption[];
  showAddButton?: boolean;
  showViewMode?: boolean;
}

export default function WardrobeHeader({
  title,
  subtitle,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  suggestions,
  history,
  onClearHistory,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  onAddNew,
  searchPlaceholder = "Search",
  actionLabel = "Add Item",
  sortOptions = DEFAULT_SORT_OPTIONS,
  showAddButton = true,
  showViewMode = true,
}: WardrobeHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchSubmit(searchQuery);
      setIsSearchFocused(false);
    }
  };

  return (
    <header className="wardrobe-page-header relative z-30">
      {/* Title Section */}
      <div>
        <h1 className="wardrobe-page-title">{title}</h1>
        <div className="wardrobe-page-subtitle">{subtitle}</div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4 w-full md:w-auto relative">
        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative w-full sm:w-64">
          <Input
            isClearable
            classNames={{
              inputWrapper:
                "border-b border-default-200 shadow-none px-0 h-10 hover:border-default-400 after:bg-black dark:after:bg-white",
              input:
                "text-sm font-light placeholder:text-default-400 placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]",
            }}
            placeholder={searchPlaceholder}
            radius="none"
            startContent={
              <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
            }
            value={searchQuery}
            variant="underlined"
            onClear={() => setSearchQuery("")}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDown}
            onValueChange={setSearchQuery}
          />

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isSearchFocused &&
              (searchQuery.length > 0 || history.length > 0) && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-default-200 shadow-xl z-50 p-2"
                  exit={{ opacity: 0, y: 5 }}
                  initial={{ opacity: 0, y: 5 }}
                >
                  {/* Suggestions */}
                  {searchQuery.length > 0 && suggestions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-default-400 mb-2 px-2">
                        Suggestions
                      </p>
                      {suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-2 py-1.5 text-sm font-light hover:bg-default-100 dark:hover:bg-default-800 transition-colors flex items-center justify-between gap-2"
                          onClick={() => {
                            onSearchSubmit(suggestion.label);
                            setIsSearchFocused(false);
                          }}
                        >
                          <span>{suggestion.label}</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-default-300 shrink-0">
                            {SUGGESTION_LABELS[suggestion.type]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recent History */}
                  {history.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2 px-2 mt-2">
                        <p className="text-[10px] uppercase tracking-widest text-default-400">
                          Recent
                        </p>
                        <button
                          className="text-[10px] text-default-400 hover:text-red-500 uppercase tracking-wide"
                          onClick={onClearHistory}
                        >
                          Clear
                        </button>
                      </div>
                      {history.map((term, i) => (
                        <button
                          key={`hist-${i}`}
                          className="w-full text-left px-2 py-2 text-sm font-light text-default-600 hover:bg-default-100 dark:hover:bg-default-800 transition-colors flex items-center gap-2"
                          onClick={() => {
                            onSearchSubmit(term);
                            setIsSearchFocused(false);
                          }}
                        >
                          <ClockIcon className="w-3 h-3 text-default-400" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && suggestions.length === 0 && (
                    <div className="p-4 text-center text-default-400 text-xs italic">
                      No matching items found.
                    </div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        {/* Sort Select */}
        <Select
          aria-label="Sort by"
          className="w-full sm:w-40"
          classNames={{
            trigger:
              "border-b border-default-200 shadow-none px-0 h-10 min-h-10 hover:border-default-400 after:bg-black dark:after:bg-white",
            value: "text-sm font-light uppercase tracking-widest",
            selectorIcon: "text-default-400",
          }}
          id="wardrobe-sort-select"
          placeholder="SORT BY"
          radius="none"
          selectedKeys={[sortBy]}
          variant="underlined"
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map((opt) => (
            <SelectItem
              key={opt.key}
              classNames={{
                title: "font-light uppercase tracking-wider text-xs",
              }}
            >
              {opt.label}
            </SelectItem>
          ))}
        </Select>

        {/* Buttons */}
        <div className="flex gap-3 items-center mt-2 sm:mt-0 ml-auto sm:ml-0">
          {showViewMode && (
            <ButtonGroup
              className="bg-transparent border border-default-200"
              radius="none"
              variant="flat"
            >
              <Button
                isIconOnly
                className={`w-10 h-10 bg-transparent ${viewMode === "grid" ? "text-primary" : "text-default-300"}`}
                radius="none"
                onPress={() => setViewMode("grid")}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                className={`w-10 h-10 bg-transparent ${viewMode === "gallery" ? "text-primary" : "text-default-300"}`}
                radius="none"
                onPress={() => setViewMode("gallery")}
              >
                <ViewColumnsIcon className="w-4 h-4" />
              </Button>
            </ButtonGroup>
          )}

          <Button
            className="border-default-200 font-medium uppercase text-xs tracking-wider"
            radius="none"
            startContent={<FunnelIcon className="w-4 h-4" />}
            variant="bordered"
            onPress={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide" : "Filter"}
          </Button>

          {showAddButton && (
            <Button
              className="font-medium uppercase text-[10px] tracking-[0.15em] h-10 px-6 shadow-none rounded-none"
              color="primary"
              radius="none"
              startContent={<PlusIcon className="w-3 h-3" />}
              onPress={onAddNew}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
