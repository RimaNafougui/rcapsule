"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export const ACCESSORY_CATEGORIES = [
  "Bag",
  "Belt",
  "Hat",
  "Scarf",
  "Sunglasses",
  "Jewelry",
  "Beanie",
  "Cap",
  "Purse",
  "Wallet",
  "Necklace",
  "Earrings",
  "Card Holder",
  "Watch",
  "Bracelet",
  "Ring",
];

export interface PieceItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  imageUrl?: string;
  price?: number;
}

interface Props<T extends PieceItem> {
  isOpen: boolean;
  onClose: () => void;
  availableClothes: T[];
  selectedClothes: T[];
  onSelectionChange: (items: T[]) => void;
}

export default function AddPiecesModal<T extends PieceItem>({
  isOpen,
  onClose,
  availableClothes,
  selectedClothes,
  onSelectionChange,
}: Props<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalCost = selectedClothes.reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );

  const handleToggle = (item: T) => {
    if (selectedClothes.some((c) => c.id === item.id)) return;
    const isAccessory = ACCESSORY_CATEGORIES.includes(item.category);

    if (!isAccessory) {
      onSelectionChange([
        ...selectedClothes.filter((c) => c.category !== item.category),
        item,
      ]);
    } else {
      onSelectionChange([...selectedClothes, item]);
    }
  };

  const getSelectedInCategory = (category: string) =>
    selectedClothes.find((c) => c.category === category);

  const unselected = availableClothes.filter(
    (item) => !selectedClothes.some((s) => s.id === item.id),
  );

  const filtered = unselected.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);

      return acc;
    },
    {} as Record<string, T[]>,
  );

  const allCategories = [
    ...new Set(availableClothes.map((c) => c.category)),
  ].sort();

  return (
    <Modal
      isOpen={isOpen}
      radius="none"
      scrollBehavior="inside"
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <span className="uppercase tracking-widest font-bold">
              Select Pieces
            </span>
            <span className="text-xs text-default-400 font-normal">
              {selectedClothes.length} selected
            </span>
          </div>
          <div className="flex gap-3 w-full">
            <Input
              isClearable
              className="flex-1"
              placeholder="Search items..."
              radius="none"
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
              }
              value={searchQuery}
              variant="bordered"
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
            />
            <Select
              className="w-48"
              placeholder="All Categories"
              radius="none"
              selectedKeys={activeCategory ? [activeCategory] : []}
              size="sm"
              variant="bordered"
              onChange={(e) => setActiveCategory(e.target.value || null)}
            >
              {allCategories.map((cat) => (
                <SelectItem key={cat}>{cat}</SelectItem>
              ))}
            </Select>
          </div>
        </ModalHeader>

        <ModalBody className="pb-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="py-12 text-center text-default-400">
              No items found
            </div>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => {
                const isAccessory = ACCESSORY_CATEGORIES.includes(category);
                const selectedInCategory = getSelectedInCategory(category);

                return (
                  <div key={category} className="mb-8">
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-default-200">
                      <h4 className="text-xs font-display font-light tracking-normal">
                        {category}
                      </h4>
                      <Chip className="text-[10px]" size="sm" variant="flat">
                        {isAccessory ? "Multiple OK" : "Pick One"}
                      </Chip>
                      {!isAccessory && selectedInCategory && (
                        <span className="text-[10px] text-success-600 uppercase tracking-wider ml-auto flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          {selectedInCategory.name}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {items.map((item) => {
                        const isSelected = selectedClothes.some(
                          (c) => c.id === item.id,
                        );
                        const wouldReplace =
                          !isAccessory && selectedInCategory && !isSelected;

                        return (
                          <Tooltip
                            key={item.id}
                            content={
                              wouldReplace
                                ? `Replace ${selectedInCategory.name}`
                                : item.name
                            }
                          >
                            <div
                              className={`flex flex-col cursor-pointer group border-2 transition-all ${
                                isSelected
                                  ? "border-primary shadow-lg"
                                  : wouldReplace
                                    ? "border-warning-300 hover:border-warning"
                                    : "border-transparent hover:border-default-300"
                              }`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleToggle(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  handleToggle(item);
                              }}
                            >
                              <div className="aspect-[3/4] relative overflow-hidden">
                                <Image
                                  className="w-full h-full object-cover group-hover:opacity-90"
                                  classNames={{ wrapper: "w-full h-full" }}
                                  radius="none"
                                  src={item.imageUrl || ""}
                                />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </div>
                                )}
                                {wouldReplace && (
                                  <div className="absolute top-1 right-1">
                                    <ArrowPathIcon className="w-4 h-4 text-warning" />
                                  </div>
                                )}
                              </div>
                              <div
                                className={`px-1 py-1 text-[9px] uppercase tracking-wide truncate text-center ${
                                  isSelected
                                    ? "bg-primary text-white"
                                    : "bg-default-50 text-foreground border-t border-default-200"
                                }`}
                              >
                                {item.name}
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </ModalBody>

        <ModalFooter className="border-t border-divider">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-default-500">
              {selectedClothes.length} items selected
              {totalCost > 0 && ` • $${totalCost.toFixed(2)} total`}
            </span>
            <Button color="primary" radius="none" onPress={onClose}>
              Done
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
