"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Spinner,
  Textarea,
  Chip,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

import {
  colors,
  occasions,
  seasons,
  categories,
  colorMap,
  conditions,
  purchaseTypes,
  silhouettes,
  styles,
  necklines,
  patterns,
  lengths,
  fits,
  currencies,
} from "@/lib/data";
import { ImageUpload } from "@/components/closet/ImageUpload";

export default function NewItemPage() {
  const { status } = useSession();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    category: "",
    brand: "",
    description: "",
    imageUrl: "",
    status: "owned" as "owned" | "wishlist",

    // Purchase Info
    price: "",
    originalPrice: "",
    purchaseDate: "",
    purchaseLocation: "",
    purchaseType: "",
    purchaseCurrency: "CAD",
    link: "",

    // Physical Attributes
    size: "",
    colors: [] as string[],
    season: [] as string[],
    materials: "",
    condition: "excellent",

    // Style Details
    style: "",
    silhouette: "",
    pattern: "",
    neckline: "",
    length: "",
    fit: "",
    placesToWear: [] as string[],

    // Care & Sustainability
    careInstructions: "",
    sustainability: "",

    // Tags
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Please fill in Name and Category.");

      return;
    }

    const data = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : null,
      brand: formData.brand.trim() || null,
      season: formData.season.length > 0 ? formData.season : null,
      size: formData.size || null,
      link: formData.link || null,
      imageUrl: formData.imageUrl || null,
      purchaseDate: formData.purchaseDate || null,
      colors: formData.colors.length > 0 ? formData.colors : null,
      placesToWear:
        formData.placesToWear.length > 0 ? formData.placesToWear : null,
      materials: formData.materials || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      careInstructions: formData.careInstructions || null,
      sustainability: formData.sustainability || null,
      description: formData.description || null,
      style: formData.style || null,
      silhouette: formData.silhouette || null,
      pattern: formData.pattern || null,
      neckline: formData.neckline || null,
      length: formData.length || null,
      fit: formData.fit || null,
      purchaseLocation: formData.purchaseLocation || null,
      purchaseType: formData.purchaseType || null,
      condition: formData.condition,
      purchaseCurrency: formData.purchaseCurrency,
    };

    try {
      setSaving(true);
      const response = await fetch(`/api/clothes?status=${formData.status}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(formData.status === "wishlist" ? "/wishlist" : "/closet");
      } else {
        toast.error("Failed to save item. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sm:mb-12">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            className="text-default-500 hover:text-foreground"
            radius="full"
            variant="light"
            onPress={() => router.back()}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
              New Acquisition
            </h1>
            <p className="text-xs uppercase tracking-widest text-default-500">
              Add a piece to your collection
            </p>
          </div>
        </div>

        {/* Status Toggle */}
        <Tabs
          classNames={{
            tabList: "bg-default-100 p-1",
            cursor: "bg-background shadow-sm",
            tab: "px-4 h-8",
          }}
          radius="sm"
          selectedKey={formData.status}
          size="sm"
          onSelectionChange={(key) =>
            setFormData({ ...formData, status: key as "owned" | "wishlist" })
          }
        >
          <Tab key="owned" title="Owned" />
          <Tab key="wishlist" title="Wishlist" />
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        {/* Left Column: Image Upload */}
        <div className="lg:col-span-5 flex flex-col w-full gap-6 h-full">
          <div className="relative w-full top-6">
            <div className="relative w-full h-full min-h-[400px] flex flex-col">
              <ImageUpload
                className="h-full min-h-[400px]"
                folder="clothes"
                label="Item Photo"
                maxSize={10}
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            <p className="mt-4 text-[10px] text-default-400 text-center uppercase tracking-wider">
              Supported: JPG, PNG, WEBP • Max 10MB
            </p>
          </div>
        </div>
        {/* Right Column: Form with Tabs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Tabbed Form Sections */}
          <Tabs
            classNames={{
              base: "w-full",
              tabList: "w-full bg-default-100 p-1",
              cursor: "bg-background shadow-sm",
              tab: "h-9 text-xs",
              panel: "pt-6",
            }}
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            {/* Basic Info Tab */}
            <Tab key="basic" title="Basic Info">
              <div className="space-y-6">
                <Input
                  isRequired
                  classNames={{ inputWrapper: "border-default-300" }}
                  label="Name"
                  labelPlacement="outside"
                  placeholder="Ex: Vintage Leather Jacket"
                  radius="sm"
                  value={formData.name}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    classNames={{ inputWrapper: "border-default-300" }}
                    label="Brand"
                    labelPlacement="outside"
                    placeholder="Ex: Acne Studios"
                    radius="sm"
                    value={formData.brand}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                  <Select
                    isRequired
                    classNames={{ trigger: "border-default-300" }}
                    label="Category"
                    labelPlacement="outside"
                    placeholder="Select category"
                    radius="sm"
                    selectedKeys={formData.category ? [formData.category] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {categories.map((cat) => (
                      <SelectItem key={cat}>{cat}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  classNames={{ inputWrapper: "border-default-300" }}
                  label="Description"
                  labelPlacement="outside"
                  minRows={3}
                  placeholder="Add any notes or details about this piece..."
                  radius="sm"
                  value={formData.description}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Condition"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={
                      formData.condition ? [formData.condition] : []
                    }
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                  >
                    {conditions.map((cond) => (
                      <SelectItem key={cond} className="capitalize">
                        {cond}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    classNames={{ inputWrapper: "border-default-300" }}
                    label="Size"
                    labelPlacement="outside"
                    placeholder="Ex: M, 32, 8"
                    radius="sm"
                    value={formData.size}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                  />
                </div>
              </div>
            </Tab>

            {/* Purchase Info Tab */}
            <Tab key="purchase" title="Purchase">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      classNames={{ inputWrapper: "border-default-300" }}
                      label="Current Price"
                      labelPlacement="outside"
                      placeholder="0.00"
                      radius="sm"
                      startContent={
                        <span className="text-default-400 text-sm">$</span>
                      }
                      type="number"
                      value={formData.price}
                      variant="bordered"
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      classNames={{ inputWrapper: "border-default-300" }}
                      label="Original Price"
                      labelPlacement="outside"
                      placeholder="0.00"
                      radius="sm"
                      startContent={
                        <span className="text-default-400 text-sm">$</span>
                      }
                      type="number"
                      value={formData.originalPrice}
                      variant="bordered"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Currency"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={[formData.purchaseCurrency]}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseCurrency: e.target.value,
                      })
                    }
                  >
                    {currencies.map((curr) => (
                      <SelectItem key={curr}>{curr}</SelectItem>
                    ))}
                  </Select>

                  <Input
                    classNames={{ inputWrapper: "border-default-300" }}
                    label="Purchase Date"
                    labelPlacement="outside"
                    radius="sm"
                    type="date"
                    value={formData.purchaseDate}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    classNames={{ inputWrapper: "border-default-300" }}
                    label="Purchase Location"
                    labelPlacement="outside"
                    placeholder="Store name or location"
                    radius="sm"
                    value={formData.purchaseLocation}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseLocation: e.target.value,
                      })
                    }
                  />

                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Purchase Type"
                    labelPlacement="outside"
                    placeholder="Select type"
                    radius="sm"
                    selectedKeys={
                      formData.purchaseType ? [formData.purchaseType] : []
                    }
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchaseType: e.target.value,
                      })
                    }
                  >
                    {purchaseTypes.map((type) => (
                      <SelectItem key={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </Tab>

            {/* Style Details Tab */}
            <Tab key="style" title="Style">
              <div className="space-y-6">
                <Select
                  classNames={{ trigger: "border-default-300" }}
                  label="Colors"
                  labelPlacement="outside"
                  placeholder="Select colors"
                  radius="sm"
                  selectedKeys={new Set(formData.colors)}
                  selectionMode="multiple"
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    setFormData({
                      ...formData,
                      colors: Array.from(keys) as string[],
                    });
                  }}
                >
                  {colors.map((color) => (
                    <SelectItem
                      key={color}
                      startContent={
                        <div
                          className="w-4 h-4 rounded-full border border-default-200 shadow-sm"
                          style={{ background: colorMap[color] || color }}
                        />
                      }
                      textValue={color}
                    >
                      {color}
                    </SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Style"
                    labelPlacement="outside"
                    placeholder="Select style"
                    radius="sm"
                    selectedKeys={formData.style ? [formData.style] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, style: e.target.value })
                    }
                  >
                    {styles.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Silhouette"
                    labelPlacement="outside"
                    placeholder="Select silhouette"
                    radius="sm"
                    selectedKeys={
                      formData.silhouette ? [formData.silhouette] : []
                    }
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, silhouette: e.target.value })
                    }
                  >
                    {silhouettes.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Pattern"
                    labelPlacement="outside"
                    placeholder="Select pattern"
                    radius="sm"
                    selectedKeys={formData.pattern ? [formData.pattern] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, pattern: e.target.value })
                    }
                  >
                    {patterns.map((p) => (
                      <SelectItem key={p}>{p}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Fit"
                    labelPlacement="outside"
                    placeholder="Select fit"
                    radius="sm"
                    selectedKeys={formData.fit ? [formData.fit] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, fit: e.target.value })
                    }
                  >
                    {fits.map((f) => (
                      <SelectItem key={f}>{f}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Length"
                    labelPlacement="outside"
                    placeholder="Select length"
                    radius="sm"
                    selectedKeys={formData.length ? [formData.length] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                  >
                    {lengths.map((l) => (
                      <SelectItem key={l}>{l}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Neckline"
                    labelPlacement="outside"
                    placeholder="Select neckline"
                    radius="sm"
                    selectedKeys={formData.neckline ? [formData.neckline] : []}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, neckline: e.target.value })
                    }
                  >
                    {necklines.map((n) => (
                      <SelectItem key={n}>{n}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Season"
                    labelPlacement="outside"
                    placeholder="Select seasons"
                    radius="sm"
                    selectedKeys={new Set(formData.season)}
                    selectionMode="multiple"
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        season: Array.from(keys) as string[],
                      })
                    }
                  >
                    {seasons.map((season) => (
                      <SelectItem key={season}>{season}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    classNames={{ trigger: "border-default-300" }}
                    label="Occasions"
                    labelPlacement="outside"
                    placeholder="Select occasions"
                    radius="sm"
                    selectedKeys={new Set(formData.placesToWear)}
                    selectionMode="multiple"
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      setFormData({
                        ...formData,
                        placesToWear: Array.from(keys) as string[],
                      });
                    }}
                  >
                    {occasions.map((occ) => (
                      <SelectItem key={occ}>{occ}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </Tab>

            {/* Materials & Care Tab */}
            <Tab key="materials" title="Materials">
              <div className="space-y-6">
                <Textarea
                  classNames={{ inputWrapper: "border-default-300" }}
                  description="Specify material composition including percentages and part names (Body, Lining, etc.)"
                  label="Material Composition"
                  labelPlacement="outside"
                  minRows={5}
                  placeholder="Body:\n81% Nylon, 19% Lycra Elastane\n\nLining:\n56% Polyester, 33% Coolmax Polyester, 11% Lycra Elastane"
                  radius="sm"
                  value={formData.materials}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      materials: e.target.value,
                    })
                  }
                />

                <Textarea
                  classNames={{ inputWrapper: "border-default-300" }}
                  label="Care Instructions"
                  labelPlacement="outside"
                  minRows={3}
                  placeholder="Washing, drying, and storage instructions..."
                  radius="sm"
                  value={formData.careInstructions}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      careInstructions: e.target.value,
                    })
                  }
                />

                <Textarea
                  classNames={{ inputWrapper: "border-default-300" }}
                  label="Sustainability Notes"
                  labelPlacement="outside"
                  minRows={3}
                  placeholder="Certifications, eco-friendly materials, brand values..."
                  radius="sm"
                  value={formData.sustainability}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sustainability: e.target.value,
                    })
                  }
                />
              </div>
            </Tab>

            {/* Tags Tab */}
            <Tab key="tags" title="Tags">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    classNames={{ inputWrapper: "border-default-300" }}
                    placeholder="Add a tag..."
                    radius="sm"
                    value={newTag}
                    variant="bordered"
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button radius="sm" variant="bordered" onPress={handleAddTag}>
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-default-50 rounded-lg">
                    {formData.tags.map((tag) => (
                      <Chip
                        key={tag}
                        radius="sm"
                        variant="flat"
                        onClose={() => handleRemoveTag(tag)}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}

                <p className="text-xs text-default-400">
                  Use tags to organize and search your items (e.g.,
                  &quot;vintage&quot;, &quot;investment piece&quot;, &quot;needs
                  repair&quot;)
                </p>
              </div>
            </Tab>
          </Tabs>
          {/* Submit Buttons */}
          <div className="pt-6 flex flex-col-reverse sm:flex-row gap-4 border-t border-divider">
            <Button
              fullWidth
              className="h-12 uppercase tracking-widest font-medium border-default-300 hover:bg-default-100"
              radius="sm"
              variant="bordered"
              onPress={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              className="h-12 uppercase tracking-widest font-bold shadow-lg shadow-primary/20"
              color="primary"
              isLoading={saving}
              radius="sm"
              onPress={handleSubmit}
            >
              Add to {formData.status === "wishlist" ? "Wishlist" : "Closet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
