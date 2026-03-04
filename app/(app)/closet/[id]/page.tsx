"use client";

import type { Clothes } from "@/lib/database.type";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Image,
  Divider,
  Tabs,
  Tab,
  Spinner,
  Textarea,
  Chip,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
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
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ItemPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [editTab, setEditTab] = useState("basic");

  // Removed redundant imageMethod state
  const [item, setItem] = useState<Clothes | null>(null);
  const [newTag, setNewTag] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    description: "",
    imageUrl: "",
    status: "owned" as "owned" | "wishlist",
    price: "",
    originalPrice: "",
    purchaseDate: "",
    purchaseLocation: "",
    purchaseType: "",
    purchaseCurrency: "CAD",
    link: "",
    size: "",
    colors: [] as string[],
    season: [] as string[],
    materials: "",
    condition: "excellent",
    style: "",
    silhouette: "",
    pattern: "",
    neckline: "",
    length: "",
    fit: "",
    placesToWear: [] as string[],
    careInstructions: "",
    sustainability: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchItem();
  }, [status, router, itemId]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/clothes/${itemId}`);

      if (response.ok) {
        const data: Clothes = await response.json();

        setItem(data);

        let seasonData: string[] = [];

        if (Array.isArray(data.season)) {
          seasonData = data.season;
        } else if (typeof data.season === "string" && data.season) {
          seasonData = [data.season];
        }

        setFormData({
          name: data.name,
          category: data.category,
          brand: data.brand || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          status: (data.status as "owned" | "wishlist") || "owned",
          price: data.price?.toString() || "",
          originalPrice: data.originalPrice?.toString() || "",
          purchaseDate: data.purchaseDate
            ? data.purchaseDate.split("T")[0]
            : "",
          purchaseLocation: data.purchaseLocation || "",
          purchaseType: data.purchaseType || "",
          purchaseCurrency: data.purchaseCurrency || "CAD",
          link: data.link || "",
          size: data.size || "",
          colors: data.colors || [],
          season: seasonData,
          materials: data.materials || "",
          condition: data.condition || "excellent",
          style: data.style || "",
          silhouette: data.silhouette || "",
          pattern: data.pattern || "",
          neckline: data.neckline || "",
          length: data.length || "",
          fit: data.fit || "",
          placesToWear: data.placesToWear || [],
          careInstructions: data.careInstructions || "",
          sustainability: data.sustainability || "",
          tags: data.tags || [],
        });

        // Removed redundant setImageMethod logic here
      } else {
        router.push("/closet");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to load item. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Name and Category are required.");

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
      purchaseLocation: formData.purchaseLocation || null,
      purchaseType: formData.purchaseType || null,
      placesToWear:
        formData.placesToWear.length > 0 ? formData.placesToWear : null,
      colors: formData.colors.length > 0 ? formData.colors : null,
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
      condition: formData.condition,
      purchaseCurrency: formData.purchaseCurrency,
      status: formData.status,
    };

    try {
      setSaving(true);
      const response = await fetch(`/api/clothes/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedData: Clothes = await response.json();

        setItem(updatedData);
        setIsEditing(false);
        toast.success("Changes saved.");
      } else {
        toast.error("Failed to save changes.");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/clothes/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(item?.status === "wishlist" ? "/wishlist" : "/closet");
      } else {
        toast.error("Failed to delete item.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item.");
    } finally {
      onDeleteClose();
    }
  };

  if (status === "loading" || loading || !item) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Button
          className="uppercase tracking-widest text-xs font-bold pl-0 text-default-500 hover:text-foreground"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          variant="light"
          onPress={() =>
            router.push(item.status === "wishlist" ? "/wishlist" : "/closet")
          }
        >
          Back to {item.status === "wishlist" ? "Wishlist" : "Collection"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[600px] bg-content2 rounded-lg overflow-hidden shadow-inner">
          {item.imageUrl ? (
            <Image
              removeWrapper
              alt={item.name}
              className="w-full h-full object-contain"
              radius="none"
              src={item.imageUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-default-300">
              <span className="text-6xl font-thin">No Image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {!isEditing ? (
            <ViewMode
              item={item}
              onDelete={onDeleteOpen}
              onEdit={() => setIsEditing(true)}
            />
          ) : (
            <EditMode
              editTab={editTab}
              formData={formData}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              newTag={newTag}
              saving={saving}
              setEditTab={setEditTab}
              setFormData={setFormData}
              setNewTag={setNewTag}
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
      <ConfirmModal
        confirmLabel="Remove"
        isOpen={isDeleteOpen}
        message="Remove this piece from your collection? This cannot be undone."
        title="Remove Item"
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function ViewMode({
  item,
  onEdit,
  onDelete,
}: {
  item: Clothes;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        {item.brand && (
          <h2 className="text-sm font-bold uppercase tracking-widest text-default-500 mb-2">
            {item.brand}
          </h2>
        )}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2 leading-none break-words">
          {item.name}
        </h1>

        <div className="flex flex-wrap items-baseline gap-4">
          {item.price && (
            <p className="text-2xl font-light text-foreground">
              ${item.price.toFixed(2)} {item.purchaseCurrency}
            </p>
          )}
          {item.originalPrice && item.originalPrice !== item.price && (
            <p className="text-lg line-through text-default-400">
              ${item.originalPrice.toFixed(2)}
            </p>
          )}
          {item.purchaseDate && (
            <p className="text-xs text-default-400 uppercase tracking-widest flex items-center gap-1">
              <CalendarDaysIcon className="w-3 h-3" />
              {new Date(item.purchaseDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {item.description && (
          <p className="mt-4 text-sm text-default-600 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <Divider />

      <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
        <DetailItem capitalize label="Category" value={item.category} />
        <DetailItem label="Size" value={item.size || "N/A"} />
        <DetailItem
          capitalize
          label="Condition"
          value={item.condition || "excellent"}
        />
        <DetailItem
          capitalize
          label="Season"
          value={
            Array.isArray(item.season) && item.season.length > 0
              ? item.season.join(", ")
              : typeof item.season === "string" && item.season
                ? item.season
                : "All Season"
          }
        />
      </div>

      {item.colors && item.colors.length > 0 && (
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
            Colors
          </span>
          <div className="flex gap-2">
            {item.colors.map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded-full border border-default-200 shadow-sm"
                style={{ background: colorMap[color] || color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {(item.style || item.silhouette || item.pattern || item.fit) && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-3">
            Style Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {item.style && <DetailItem label="Style" value={item.style} />}
            {item.silhouette && (
              <DetailItem label="Silhouette" value={item.silhouette} />
            )}
            {item.pattern && (
              <DetailItem label="Pattern" value={item.pattern} />
            )}
            {item.fit && <DetailItem label="Fit" value={item.fit} />}
            {item.length && <DetailItem label="Length" value={item.length} />}
            {item.neckline && (
              <DetailItem label="Neckline" value={item.neckline} />
            )}
          </div>
        </div>
      )}
      {item.materials && (
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
            Material Composition
          </span>
          <p className="text-sm whitespace-pre-wrap">{item.materials}</p>
        </div>
      )}

      {(item.purchaseLocation || item.purchaseType) && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-3">
            Purchase Info
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {item.purchaseLocation && (
              <DetailItem label="Location" value={item.purchaseLocation} />
            )}
            {item.purchaseType && (
              <DetailItem capitalize label="Type" value={item.purchaseType} />
            )}
          </div>
        </div>
      )}

      {(item.careInstructions || item.sustainability) && (
        <div className="space-y-4">
          {item.careInstructions && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
                Care Instructions
              </span>
              <p className="text-sm text-default-600 whitespace-pre-wrap">
                {item.careInstructions}
              </p>
            </div>
          )}
          {item.sustainability && (
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
                Sustainability
              </span>
              <p className="text-sm text-default-600 whitespace-pre-wrap">
                {item.sustainability}
              </p>
            </div>
          )}
        </div>
      )}

      {item.placesToWear && item.placesToWear.length > 0 && (
        <div className="pt-2">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
            Best For
          </span>
          <div className="flex flex-wrap gap-2">
            {item.placesToWear.map((place) => (
              <span
                key={place}
                className="px-3 py-1 bg-default-100 rounded-full text-xs font-medium uppercase tracking-wider"
              >
                {place}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
            Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Chip
                key={tag}
                size="sm"
                startContent={<TagIcon className="w-3 h-3" />}
                variant="flat"
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {(item.timesworn !== undefined || item.lastwornat) && (
        <div className="bg-default-50 p-4 rounded-lg">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-3">
            Wear Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-default-500">Times Worn</span>
              <p className="text-lg font-semibold">{item.timesworn || 0}</p>
            </div>
            {item.lastwornat && (
              <div>
                <span className="text-default-500">Last Worn</span>
                <p className="text-lg font-semibold">
                  {new Date(item.lastwornat).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-8 flex flex-col gap-4 mt-auto">
        {item.link && (
          <Button
            as="a"
            className="w-full bg-foreground text-background font-bold uppercase tracking-widest"
            endContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
            href={item.link}
            radius="sm"
            target="_blank"
            variant="solid"
          >
            View Product Link
          </Button>
        )}

        <div className="flex gap-4">
          <Button
            fullWidth
            className="font-medium uppercase tracking-wider border-default-300"
            radius="sm"
            startContent={<PencilSquareIcon className="w-4 h-4" />}
            variant="bordered"
            onPress={onEdit}
          >
            Edit Details
          </Button>
          <Button
            isIconOnly
            className="font-medium"
            color="danger"
            radius="sm"
            variant="flat"
            onPress={onDelete}
          >
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-widest text-default-400 mb-1">
        {label}
      </span>
      <span className={`text-lg ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// Edit Mode Component
function EditMode({
  formData,
  setFormData,
  editTab,
  setEditTab,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  saving,
  onSave,
  onCancel,
}: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 bg-content1 p-1 sm:p-6 rounded-lg max-h-[800px] overflow-y-auto">
      <div className="flex justify-between items-center border-b border-divider pb-4 sticky top-0 bg-content1 z-10">
        <h2 className="text-xl font-bold uppercase tracking-tighter">
          Edit Piece
        </h2>
        <Button color="danger" size="sm" variant="light" onPress={onCancel}>
          Cancel
        </Button>
      </div>

      {/* REPLACED: Single ImageUpload Component */}
      <div className="pb-4 border-b border-divider">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-default-500">
          Visual
        </h3>
        <div className="w-full aspect-[3/4] sm:aspect-video bg-content2 border border-dashed border-default-300 rounded-lg overflow-hidden relative">
          <ImageUpload
            className="h-full w-full"
            folder="clothes"
            label="Update Image"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>
      </div>

      {/* Tabbed Edit Sections */}
      <Tabs
        classNames={{
          base: "w-full",
          tabList: "w-full bg-default-100 p-1",
          cursor: "bg-background shadow-sm",
          tab: "h-8 text-xs",
          panel: "pt-4",
        }}
        selectedKey={editTab}
        size="sm"
        onSelectionChange={(key) => setEditTab(key as string)}
      >
        <Tab key="basic" title="Basic">
          <div className="space-y-4">
            <Input
              isRequired
              classNames={{ inputWrapper: "border-default-300" }}
              label="Name"
              radius="sm"
              value={formData.name}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                classNames={{ inputWrapper: "border-default-300" }}
                label="Brand"
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
              minRows={2}
              radius="sm"
              value={formData.description}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Condition"
                radius="sm"
                selectedKeys={formData.condition ? [formData.condition] : []}
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
        // In the EditMode component, update the Purchase tab section:
        <Tab key="purchase" title="Purchase">
          <div className="space-y-4">
            {/* Status Toggle Button for Wishlist Items */}
            {formData.status === "wishlist" && (
              <div className="bg-default-100 p-4 rounded-lg border border-default-200">
                <p className="text-sm text-default-600 mb-3">
                  This item is currently in your wishlist. Mark it as purchased
                  to track ownership details.
                </p>
                <Button
                  fullWidth
                  className="font-semibold"
                  color="success"
                  radius="sm"
                  variant="flat"
                  onPress={() => setFormData({ ...formData, status: "owned" })}
                >
                  Mark as Purchased
                </Button>
              </div>
            )}

            {/* Status Toggle Button for Owned Items */}
            {formData.status === "owned" && (
              <div className="bg-default-100 p-4 rounded-lg border border-default-200">
                <p className="text-sm text-default-600 mb-3">
                  This item is in your collection. Move it back to your wishlist
                  if you no longer own it.
                </p>
                <Button
                  fullWidth
                  className="font-semibold"
                  color="warning"
                  radius="sm"
                  variant="flat"
                  onPress={() =>
                    setFormData({ ...formData, status: "wishlist" })
                  }
                >
                  Move to Wishlist
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                classNames={{ inputWrapper: "border-default-300" }}
                label="Current Price"
                radius="sm"
                startContent={<span className="text-default-400">$</span>}
                type="number"
                value={formData.price}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
              <Input
                classNames={{ inputWrapper: "border-default-300" }}
                label="Original Price"
                radius="sm"
                startContent={<span className="text-default-400">$</span>}
                type="number"
                value={formData.originalPrice}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, originalPrice: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Currency"
                radius="sm"
                selectedKeys={[formData.purchaseCurrency]}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, purchaseCurrency: e.target.value })
                }
              >
                {currencies.map((curr) => (
                  <SelectItem key={curr}>{curr}</SelectItem>
                ))}
              </Select>

              {/* Only show Purchase Date for owned items */}
              {formData.status === "owned" && (
                <Input
                  classNames={{ inputWrapper: "border-default-300" }}
                  label="Purchase Date"
                  radius="sm"
                  type="date"
                  value={formData.purchaseDate}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                classNames={{ inputWrapper: "border-default-300" }}
                label="Purchase Location"
                radius="sm"
                value={formData.purchaseLocation}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, purchaseLocation: e.target.value })
                }
              />

              {/* Only show Purchase Type for owned items */}
              {formData.status === "owned" && (
                <Select
                  classNames={{ trigger: "border-default-300" }}
                  label="Purchase Type"
                  radius="sm"
                  selectedKeys={
                    formData.purchaseType ? [formData.purchaseType] : []
                  }
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseType: e.target.value })
                  }
                >
                  {purchaseTypes.map((type) => (
                    <SelectItem key={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <Input
              classNames={{ inputWrapper: "border-default-300" }}
              label="Product Link"
              radius="sm"
              value={formData.link}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
            />
          </div>
        </Tab>
        <Tab key="style" title="Style">
          <div className="space-y-4">
            <Select
              classNames={{ trigger: "border-default-300" }}
              label="Colors"
              radius="sm"
              selectedKeys={new Set(formData.colors || [])}
              selectionMode="multiple"
              variant="bordered"
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  colors: Array.from(keys) as string[],
                })
              }
            >
              {colors.map((color) => (
                <SelectItem
                  key={color}
                  startContent={
                    <div
                      className="w-4 h-4 rounded-full border border-default-200"
                      style={{ background: colorMap[color] || color }}
                    />
                  }
                >
                  {color}
                </SelectItem>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Style"
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
                radius="sm"
                selectedKeys={formData.silhouette ? [formData.silhouette] : []}
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Pattern"
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Length"
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Season"
                radius="sm"
                selectedKeys={new Set(formData.season || [])}
                selectionMode="multiple"
                variant="bordered"
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    season: Array.from(keys) as string[],
                  })
                }
              >
                {seasons.map((s) => (
                  <SelectItem key={s}>{s}</SelectItem>
                ))}
              </Select>
              <Select
                classNames={{ trigger: "border-default-300" }}
                label="Occasions"
                radius="sm"
                selectedKeys={new Set(formData.placesToWear || [])}
                selectionMode="multiple"
                variant="bordered"
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    placesToWear: Array.from(keys) as string[],
                  })
                }
              >
                {occasions.map((o) => (
                  <SelectItem key={o}>{o}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </Tab>
        <Tab key="materials" title="Materials">
          <div className="space-y-4">
            <Textarea
              classNames={{ inputWrapper: "border-default-300" }}
              description="Specify material composition including percentages and part names (Body, Lining, etc.)"
              label="Material Composition"
              minRows={5}
              placeholder="Body:&#10;81% Nylon, 19% Lycra Elastane&#10;&#10;Lining:&#10;56% Polyester, 33% Coolmax Polyester, 11% Lycra Elastane"
              radius="sm"
              value={formData.materials}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, materials: e.target.value })
              }
            />

            <Textarea
              classNames={{ inputWrapper: "border-default-300" }}
              label="Care Instructions"
              minRows={2}
              radius="sm"
              value={formData.careInstructions}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, careInstructions: e.target.value })
              }
            />

            <Textarea
              classNames={{ inputWrapper: "border-default-300" }}
              label="Sustainability Notes"
              minRows={2}
              radius="sm"
              value={formData.sustainability}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, sustainability: e.target.value })
              }
            />
          </div>
        </Tab>
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
                {formData.tags.map((tag: string) => (
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
          </div>
        </Tab>
      </Tabs>

      <Button
        fullWidth
        className="h-12 font-bold uppercase tracking-widest mt-4 shadow-lg shadow-primary/20"
        color="primary"
        isLoading={saving}
        radius="sm"
        onPress={onSave}
      >
        Save Changes
      </Button>
    </div>
  );
}
