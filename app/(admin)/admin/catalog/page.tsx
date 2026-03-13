"use client";
import { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Chip,
  Input,
  ScrollShadow,
  Skeleton,
  Switch,
  useDisclosure,
} from "@heroui/react";
import NextLink from "next/link";
import { motion } from "framer-motion";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import ConfirmModal from "@/components/ui/ConfirmModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");

    return r.json();
  });

const itemClasses = {
  title: "text-xs font-bold uppercase tracking-widest",
  trigger: "py-3",
  content: "pb-3 pl-1",
};

export default function AdminCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const limit = 48;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(search && { search }),
    ...(selectedCategories.length > 0 && {
      category: selectedCategories.join(","),
    }),
    ...(selectedBrands.length > 0 && { brand: selectedBrands.join(",") }),
    ...(inStockOnly && { inStock: "true" }),
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/catalog?${params}`,
    fetcher,
  );

  // Fetch metadata for filter options
  const { data: _meta } = useSWR(
    "/api/admin/catalog?limit=1&offset=0&meta=true",
    fetcher,
  );

  const products: any[] = data?.products ?? [];
  const total: number = data?.total ?? 0;
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedBrands.length > 0 || inStockOnly;
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Derive available filters from all products (fetch with no filters to get all)
  const { data: allData } = useSWR(
    "/api/admin/catalog?limit=2000&offset=0",
    fetcher,
  );
  const allProducts: any[] = allData?.products ?? [];
  const availableCategories = [
    ...new Set(allProducts.map((p: any) => p.category).filter(Boolean)),
  ].sort();
  const availableBrands = [
    ...new Set(allProducts.map((p: any) => p.brand).filter(Boolean)),
  ].sort();

  function deleteProduct(id: string, name: string) {
    setDeleteTarget({ id, name });
    onDeleteOpen();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/catalog/${deleteTarget.id}`, { method: "DELETE" });
    onDeleteClose();
    setDeleteTarget(null);
    mutate();
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setOffset(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalog</h1>
          <p className="text-sm opacity-50 mt-1">{total} products</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="border-default-200"
            size="sm"
            startContent={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            variant="bordered"
            onPress={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Button
            as={NextLink}
            color="primary"
            href="/admin/catalog/new"
            size="sm"
          >
            + Add Product
          </Button>
        </div>
      </div>

      <Input
        className="max-w-80"
        placeholder="Search products..."
        size="sm"
        value={search}
        onValueChange={(v) => {
          setSearch(v);
          setOffset(0);
        }}
      />

      <div className="flex gap-6 items-start">
        {/* Filter Sidebar */}
        {showFilters && (
          <motion.aside
            animate={{ opacity: 1, x: 0 }}
            className="w-52 flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
          >
            <Card>
              <CardBody className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      className="text-[10px] text-default-400 hover:text-danger uppercase tracking-wide flex items-center gap-1"
                      onClick={clearFilters}
                    >
                      <XMarkIcon className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <ScrollShadow hideScrollBar className="max-h-[60vh]">
                  <Accordion
                    defaultExpandedKeys={["category", "brand", "stock"]}
                    itemClasses={itemClasses}
                    selectionMode="multiple"
                    showDivider={false}
                  >
                    <AccordionItem
                      key="stock"
                      aria-label="Availability"
                      title="Availability"
                    >
                      <div className="flex items-center gap-2">
                        <Switch
                          isSelected={inStockOnly}
                          size="sm"
                          onValueChange={(v) => {
                            setInStockOnly(v);
                            setOffset(0);
                          }}
                        />
                        <span className="text-xs text-default-500">
                          In Stock Only
                        </span>
                      </div>
                    </AccordionItem>

                    <AccordionItem
                      key="category"
                      aria-label="Category"
                      title="Category"
                    >
                      <CheckboxGroup
                        classNames={{ wrapper: "gap-2" }}
                        value={selectedCategories}
                        onValueChange={(v) => {
                          setSelectedCategories(v);
                          setOffset(0);
                        }}
                      >
                        {availableCategories.map((cat) => (
                          <Checkbox
                            key={cat}
                            classNames={{
                              label: "text-xs text-default-500 capitalize ml-1",
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
                        classNames={{ wrapper: "gap-2" }}
                        value={selectedBrands}
                        onValueChange={(v) => {
                          setSelectedBrands(v);
                          setOffset(0);
                        }}
                      >
                        {availableBrands.map((brand) => (
                          <Checkbox
                            key={brand}
                            classNames={{
                              label: "text-xs text-default-500 ml-1",
                            }}
                            radius="none"
                            size="sm"
                            value={brand}
                          >
                            {brand}
                          </Checkbox>
                        ))}
                      </CheckboxGroup>
                    </AccordionItem>
                  </Accordion>
                </ScrollShadow>
              </CardBody>
            </Card>
          </motion.aside>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))
              : products.map((p) => (
                  <Card key={p.id} className="overflow-hidden group">
                    <div className="relative aspect-[3/4] bg-content2">
                      {p.imageurl ? (
                        <Image
                          unoptimized
                          alt={p.name}
                          className="w-full h-full object-contain"
                          src={p.imageurl}
                          fill
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs opacity-30">No image</span>
                        </div>
                      )}
                      {/* Admin overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          as={NextLink}
                          className="text-xs"
                          href={`/admin/catalog/${p.id}/edit`}
                          radius="none"
                          size="sm"
                          variant="solid"
                        >
                          Edit
                        </Button>
                        <Button
                          color="danger"
                          radius="none"
                          size="sm"
                          variant="solid"
                          onPress={() => deleteProduct(p.id, p.name)}
                        >
                          Del
                        </Button>
                      </div>
                    </div>
                    <CardBody className="gap-1 p-3">
                      <p className="font-medium text-xs truncate">{p.name}</p>
                      <p className="text-xs opacity-60">{p.brand}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Chip radius="none" size="sm" variant="flat">
                          {p.category}
                        </Chip>
                        <Chip
                          color={p.inStock ? "success" : "danger"}
                          radius="none"
                          size="sm"
                          variant="flat"
                        >
                          {p.inStock ? "In Stock" : "Out"}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
          </div>

          {products.length === 0 && !isLoading && (
            <p className="text-center opacity-50 py-12">No products found.</p>
          )}

          {total > limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm opacity-50">
                Showing {offset + 1}–{Math.min(offset + limit, total)} of{" "}
                {total}
              </p>
              <div className="flex gap-2">
                <Button
                  isDisabled={offset === 0}
                  size="sm"
                  variant="flat"
                  onPress={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <Button
                  isDisabled={offset + limit >= total}
                  size="sm"
                  variant="flat"
                  onPress={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        title="Delete Product"
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
