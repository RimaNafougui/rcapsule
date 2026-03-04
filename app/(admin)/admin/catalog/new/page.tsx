"use client";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { getErrorMessage } from "@/lib/utils/error";
import { categories, colors, colorMap } from "@/lib/data";

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];
const SCRAPING_STATUSES = ["active", "discontinued", "error"];

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "",
  description: "",
  slug: "",
  sku: "",
  imageurl: "",
  retaillink: "",
  originalprice: "",
  currency: "CAD",
  inStock: true,
  materials: "",
  sustainability: "",
  colors: [] as string[],
  source: "",
  externalId: "",
  scrapingStatus: "",
};

export default function AdminCatalogNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  function update(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          category: form.category,
          description: form.description || null,
          slug: form.slug || null,
          sku: form.sku || null,
          imageurl: form.imageurl || null,
          retaillink: form.retaillink || null,
          originalprice: form.originalprice ? Number(form.originalprice) : null,
          currency: form.currency,
          inStock: form.inStock,
          materials: form.materials || null,
          sustainability: form.sustainability || null,
          colors: form.colors,
          source: form.source || null,
          externalId: form.externalId || null,
          scrapingStatus: form.scrapingStatus || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error || "Failed to create product");
      }

      router.push("/admin/catalog");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button as={NextLink} href="/admin/catalog" size="sm" variant="flat">
          ← Catalog
        </Button>
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Core Info</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Name"
                value={form.name}
                onValueChange={(v) => update("name", v)}
              />
              <Input
                isRequired
                label="Brand"
                value={form.brand}
                onValueChange={(v) => update("brand", v)}
              />
            </div>

            <Select
              isRequired
              label="Category"
              selectedKeys={form.category ? [form.category] : []}
              onSelectionChange={(keys) =>
                update("category", Array.from(keys as Set<string>)[0] ?? "")
              }
            >
              {categories.map((c) => (
                <SelectItem key={c}>{c}</SelectItem>
              ))}
            </Select>

            <Textarea
              label="Description"
              value={form.description}
              onValueChange={(v) => update("description", v)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price"
                min="0"
                placeholder="0.00"
                startContent={<span className="text-sm opacity-50">$</span>}
                type="number"
                value={form.originalprice}
                onValueChange={(v) => update("originalprice", v)}
              />
              <Select
                label="Currency"
                selectedKeys={[form.currency]}
                onSelectionChange={(keys) =>
                  update(
                    "currency",
                    Array.from(keys as Set<string>)[0] ?? "CAD",
                  )
                }
              >
                {CURRENCIES.map((c) => (
                  <SelectItem key={c}>{c}</SelectItem>
                ))}
              </Select>
            </div>

            <Checkbox
              isSelected={form.inStock}
              onValueChange={(v) => update("inStock", v)}
            >
              In Stock
            </Checkbox>

            {/* Images & Links */}
            <div className="pt-2 border-t border-divider">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
                Images & Links
              </p>
              <div className="space-y-3">
                <Input
                  label="Image URL"
                  placeholder="https://..."
                  value={form.imageurl}
                  onValueChange={(v) => update("imageurl", v)}
                />
                <Input
                  label="Retail Link"
                  placeholder="https://..."
                  value={form.retaillink}
                  onValueChange={(v) => update("retaillink", v)}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="pt-2 border-t border-divider">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
                Additional Details
              </p>
              <div className="space-y-3">
                <Select
                  label="Colors"
                  placeholder="Select colors"
                  selectedKeys={new Set(form.colors)}
                  selectionMode="multiple"
                  onSelectionChange={(keys) =>
                    update("colors", Array.from(keys) as string[])
                  }
                >
                  {colors.map((color) => (
                    <SelectItem
                      key={color}
                      startContent={
                        <div
                          className="w-4 h-4 rounded-full border border-default-200 shadow-sm flex-shrink-0"
                          style={{ background: colorMap[color] || color }}
                        />
                      }
                      textValue={color}
                    >
                      {color}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  label="Materials"
                  placeholder="100% Cotton"
                  value={form.materials}
                  onValueChange={(v) => update("materials", v)}
                />
                <Textarea
                  label="Sustainability"
                  placeholder="Organic, recycled, fair-trade..."
                  value={form.sustainability}
                  onValueChange={(v) => update("sustainability", v)}
                />
              </div>
            </div>

            {/* Identifiers */}
            <div className="pt-2 border-t border-divider">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
                Identifiers & Scraping
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Slug"
                    placeholder="product-slug"
                    value={form.slug}
                    onValueChange={(v) => update("slug", v)}
                  />
                  <Input
                    label="SKU"
                    placeholder="SKU-12345"
                    value={form.sku}
                    onValueChange={(v) => update("sku", v)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Source"
                    placeholder="shopify, zara.com..."
                    value={form.source}
                    onValueChange={(v) => update("source", v)}
                  />
                  <Input
                    label="External ID"
                    placeholder="External system ID"
                    value={form.externalId}
                    onValueChange={(v) => update("externalId", v)}
                  />
                </div>
                <Select
                  label="Scraping Status"
                  selectedKeys={
                    form.scrapingStatus ? [form.scrapingStatus] : []
                  }
                  onSelectionChange={(keys) =>
                    update(
                      "scrapingStatus",
                      Array.from(keys as Set<string>)[0] ?? "",
                    )
                  }
                >
                  {SCRAPING_STATUSES.map((s) => (
                    <SelectItem key={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button color="primary" isLoading={loading} type="submit">
                Create Product
              </Button>
              <Button as={NextLink} href="/admin/catalog" variant="flat">
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
