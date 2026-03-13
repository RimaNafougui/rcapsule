"use client";
import type { GlobalProduct } from "@/lib/types/globalproduct";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Image,
} from "@heroui/react";
import { toast } from "sonner";

import { colors, categories, conditions } from "@/lib/data";

interface AddToClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: GlobalProduct | null;
  onSuccess: () => void;
}

export default function AddToClosetModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: AddToClosetModalProps) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"owned" | "wishlist">("owned");

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    size: "",
    colors: [] as string[],
    price: "",
    purchaseDate: "",
    condition: "new",
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        size: product.sizes?.[0] || "",
        colors: product.colors || [],
        price: product.originalprice?.toString() || "",
        purchaseDate: new Date().toISOString().split("T")[0],
        condition: "new",
      });
      setStatus("owned");
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Name and category are required");

      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category,
        size: formData.size || null,
        colors: formData.colors,
        price: formData.price ? parseFloat(formData.price) : null,
        condition: formData.condition,
        status,
        imageUrl: product?.processed_image_url || product?.imageurl || null,
        link: product?.retaillink || null,
        materials: product?.materials || null,
        description: product?.description || null,
        globalproductid: product?.id,
        purchaseDate: status === "wishlist" ? null : formData.purchaseDate,
      };

      const response = await fetch("/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();

        const msg =
          typeof error.error === "string" ? error.error : "Failed to add item";

        toast.error(msg);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      radius="none"
      scrollBehavior="inside"
      size="3xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <span className="uppercase tracking-widest font-bold text-xl">
            Add to Collection
          </span>
          <Tabs
            radius="sm"
            selectedKey={status}
            size="sm"
            onSelectionChange={(key) => setStatus(key as "owned" | "wishlist")}
          >
            <Tab key="owned" title="Owned" />
            <Tab key="wishlist" title="Wishlist" />
          </Tabs>
        </ModalHeader>

        <ModalBody className="gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Product Image Preview */}
            <div className="md:col-span-4">
              <div className="aspect-[3/4] bg-content2 overflow-hidden">
                <Image
                  alt={product.name}
                  className="w-full h-full object-contain"
                  radius="none"
                  src={
                    product.processed_image_url ||
                    product.imageurl ||
                    "/images/placeholder.png"
                  }
                />
              </div>
              {product.source && (
                <p className="text-xs text-default-400 text-center mt-2">
                  From {product.source}
                </p>
              )}
            </div>

            {/* Form Fields */}
            <div className="md:col-span-8 space-y-4">
              <Input
                isRequired
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
                  label="Category"
                  radius="sm"
                  selectedKeys={formData.category ? [formData.category] : []}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  description={
                    product.sizes?.length
                      ? `Available: ${product.sizes.join(", ")}`
                      : undefined
                  }
                  label="Size"
                  placeholder={product.sizes?.join(", ") || "Enter size"}
                  radius="sm"
                  value={formData.size}
                  variant="bordered"
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
                <Select
                  label="Condition"
                  radius="sm"
                  selectedKeys={[formData.condition]}
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
              </div>

              <Select
                label="Colors"
                radius="sm"
                selectedKeys={new Set(formData.colors)}
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
                  <SelectItem key={color} className="capitalize">
                    {color}
                  </SelectItem>
                ))}
              </Select>

              {/* Purchase Info - only show for "owned" */}
              {status === "owned" && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price"
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
                  <Input
                    label="Purchase Date"
                    radius="sm"
                    type="date"
                    value={formData.purchaseDate}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button radius="none" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="uppercase font-bold"
            color="primary"
            isLoading={saving}
            radius="none"
            onPress={handleSubmit}
          >
            Add to {status === "wishlist" ? "Wishlist" : "Closet"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
