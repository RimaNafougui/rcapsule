"use client";
import type { GlobalProduct } from "@/lib/types/globalproduct";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  useDisclosure,
  Accordion,
  AccordionItem,
  CheckboxGroup,
  Checkbox,
  Switch,
  ScrollShadow,
} from "@heroui/react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { toast } from "sonner";
import { XMarkIcon } from "@heroicons/react/24/outline";

import ProductCard from "@/components/catalog/ProductCard";
import ProductCardSkeleton from "@/components/catalog/ProductCardSkeleton";
import AddToClosetModal from "@/components/catalog/AddToClosetModal";
import WardrobeHeader, {
  useSearchHistory,
} from "@/components/closet/WardrobeHeader";

interface CatalogResponse {
  products: GlobalProduct[];
  total: number;
  limit: number;
  offset: number;
  availableBrands?: string[];
  availableCategories?: string[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SortOption = "popularity" | "newest" | "price-asc" | "price-desc" | "name";

const CATALOG_SORT_OPTIONS = [
  { key: "popularity", label: "Most Popular" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low → High" },
  { key: "price-desc", label: "Price: High → Low" },
  { key: "name", label: "Name A–Z" },
];

const LIMIT = 24;

const itemClasses = {
  title: "text-xs font-bold uppercase tracking-widest text-foreground",
  trigger: "py-4",
  content: "pb-4 pl-1",
};

export default function CatalogPage() {
  const { status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "gallery">("grid");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { history, addSearch, clearHistory } = useSearchHistory();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset on filter/sort/search change
  useEffect(() => {
    setOffset(0);
    setProducts([]);
  }, [debouncedQuery, sort, selectedCategories, selectedBrands, inStockOnly]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedQuery) params.set("q", debouncedQuery);
    params.set("sort", sort);
    params.set("limit", String(LIMIT));
    params.set("offset", String(offset));
    if (selectedCategories.length > 0)
      params.set("category", selectedCategories.join(","));
    if (selectedBrands.length > 0)
      params.set("brand", selectedBrands.join(","));
    if (inStockOnly) params.set("inStock", "true");

    return `/api/catalog?${params.toString()}`;
  }, [
    debouncedQuery,
    sort,
    offset,
    selectedCategories,
    selectedBrands,
    inStockOnly,
  ]);

  const { data, isLoading } = useSWR<CatalogResponse>(apiUrl, fetcher, {
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!data) return;
    if (data.offset === 0) {
      setProducts(data.products);
    } else {
      setProducts((prev) => [...prev, ...data.products]);
    }
    setTotal(data.total);
    if (data.availableBrands) setAvailableBrands(data.availableBrands);
    if (data.availableCategories)
      setAvailableCategories(data.availableCategories);
  }, [data]);

  const handleLoadMore = useCallback(
    () => setOffset((prev) => prev + LIMIT),
    [],
  );

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
  };

  const handleAddToCloset = (product: GlobalProduct) => {
    if (status !== "authenticated") {
      router.push("/login");

      return;
    }
    setSelectedProduct(product);
    onOpen();
  };

  const handleAddSuccess = () => {
    toast.success("Added to your closet!");
    onClose();
    setSelectedProduct(null);
  };

  const handleSearchSubmit = (term: string) => {
    setSearchQuery(term);
    addSearch(term);
  };

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    const lower = debouncedQuery.toLowerCase();
    const terms = new Set<string>();

    products.forEach((p) => {
      if (p.name.toLowerCase().includes(lower)) terms.add(p.name);
      if (p.brand?.toLowerCase().includes(lower)) terms.add(p.brand);
      if (p.category.toLowerCase().includes(lower)) terms.add(p.category);
    });

    return Array.from(terms).slice(0, 5);
  }, [products, debouncedQuery]);

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedBrands.length > 0 || inStockOnly;
  const allLoaded = products.length >= total;
  const isLoadingMore = isLoading && offset > 0;
  const isInitialLoading = isLoading && offset === 0 && products.length === 0;

  const filterContent = (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest">Filters</h3>
        {hasActiveFilters && (
          <button
            className="text-[10px] text-default-400 hover:text-red-500 uppercase tracking-wide flex items-center gap-1"
            onClick={handleClearFilters}
          >
            <XMarkIcon className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <ScrollShadow hideScrollBar className="flex-1 -mr-2 pr-2">
        <Accordion
          defaultExpandedKeys={["category", "brand"]}
          itemClasses={itemClasses}
          selectionMode="multiple"
          showDivider={false}
        >
          <AccordionItem key="category" aria-label="Category" title="Category">
            <CheckboxGroup
              classNames={{ wrapper: "gap-3" }}
              value={selectedCategories}
              onValueChange={setSelectedCategories}
            >
              {availableCategories.map((cat) => (
                <Checkbox
                  key={cat}
                  classNames={{
                    label: "text-sm text-default-500 capitalize ml-1",
                  }}
                  radius="none"
                  size="sm"
                  value={cat}
                >
                  {cat}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </AccordionItem>

          <AccordionItem key="brand" aria-label="Brand" title="Brand">
            <CheckboxGroup
              classNames={{ wrapper: "gap-3" }}
              value={selectedBrands}
              onValueChange={setSelectedBrands}
            >
              {availableBrands.map((brand) => (
                <Checkbox
                  key={brand}
                  classNames={{ label: "text-sm text-default-500 ml-1" }}
                  radius="none"
                  size="sm"
                  value={brand}
                >
                  {brand}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </AccordionItem>

          <AccordionItem
            key="stock"
            aria-label="Availability"
            title="Availability"
          >
            <div className="flex items-center gap-3">
              <Switch
                isSelected={inStockOnly}
                size="sm"
                onValueChange={setInStockOnly}
              />
              <span className="text-sm text-default-500">In Stock Only</span>
            </div>
          </AccordionItem>
        </Accordion>
      </ScrollShadow>
    </div>
  );

  return (
    <div className="wardrobe-page-container min-h-screen">
      <WardrobeHeader
        history={history}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowFilters={setShowFilters}
        setSortBy={(v) => setSort(v as SortOption)}
        setViewMode={setViewMode}
        showAddButton={false}
        showFilters={showFilters}
        sortBy={sort}
        sortOptions={CATALOG_SORT_OPTIONS}
        subtitle={
          isInitialLoading ? (
            <div className="h-5 w-32 bg-default-200 animate-pulse rounded" />
          ) : (
            <>
              {total} product{total !== 1 ? "s" : ""}
            </>
          )
        }
        suggestions={suggestions}
        title="Catalog"
        viewMode={viewMode}
        onAddNew={() => {}}
        onClearHistory={clearHistory}
        onSearchSubmit={handleSearchSubmit}
      />

      <div className="flex gap-8 relative pb-20">
        {/* Filter Sidebar */}
        {showFilters && (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="wardrobe-filters-sidebar"
            initial={{ opacity: 0, x: -10 }}
          >
            {filterContent}
          </motion.div>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {isInitialLoading ? (
            <div className="wardrobe-grid">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCardSkeleton />
                </motion.div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="wardrobe-empty-state">
              <p className="text-xl font-light italic text-default-400 mb-6">
                No products found
              </p>
              {(debouncedQuery || hasActiveFilters) && (
                <Button
                  className="uppercase tracking-[0.15em] text-xs border-default-300"
                  radius="none"
                  variant="bordered"
                  onPress={() => {
                    setSearchQuery("");
                    handleClearFilters();
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="wardrobe-grid">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 30 }}
                    transition={{
                      delay: Math.min(index, 8) * 0.05,
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCloset={handleAddToCloset}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 mt-12">
                {!allLoaded && (
                  <Button
                    className="uppercase tracking-[0.2em] font-medium px-12"
                    isDisabled={isLoadingMore}
                    isLoading={isLoadingMore}
                    radius="none"
                    size="lg"
                    variant="bordered"
                    onPress={handleLoadMore}
                  >
                    Load More
                  </Button>
                )}
                <p className="text-xs text-default-400 tracking-wide">
                  {products.length} of {total} products
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <AddToClosetModal
        isOpen={isOpen}
        product={selectedProduct}
        onClose={onClose}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
