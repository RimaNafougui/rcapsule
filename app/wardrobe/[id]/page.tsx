"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Spinner,
  Textarea,
  Switch,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import ConfirmModal from "@/components/ui/ConfirmModal";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price?: number;
  colors: string[];
  season?: string;
  size?: string;
  link?: string;
  imageUrl?: string;
  placesToWear: string[];
  addedToWardrobeAt?: string;
  wardrobeNotes?: string;
}

interface Wardrobe {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  clothes: ClothingItem[];
  stats?: {
    totalValue: number;
    itemCount: number;
    colorAnalysis: { color: string; count: number; percentage: number }[];
  };
}

export default function WardrobePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const wardrobeId = params.id as string;
  const [wardrobe, setWardrobe] = useState<Wardrobe | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableClothes, setAvailableClothes] = useState<ClothingItem[]>([]);

  const wardrobeModal = useDisclosure();
  const addExistingModal = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedExistingItems, setSelectedExistingItems] = useState<
    Set<string>
  >(new Set());
  const [wardrobeFormData, setWardrobeFormData] = useState({
    title: "",
    description: "",
    isPublic: false,
    coverImage: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetchWardrobe();
      fetchAvailableClothes();
    }
  }, [status, router, wardrobeId]);

  const fetchWardrobe = async () => {
    try {
      const response = await fetch(`/api/wardrobes/${wardrobeId}`);

      if (response.ok) {
        const data = await response.json();
        const safeData = {
          ...data,
          clothes: Array.isArray(data.clothes) ? data.clothes : [],
        };

        setWardrobe(safeData);
        setWardrobeFormData({
          title: data.title,
          description: data.description || "",
          isPublic: data.isPublic,
          coverImage: data.coverImage || "",
        });
      } else if (response.status === 404) {
        router.push("/profile");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClothes = async () => {
    try {
      const response = await fetch("/api/clothes?status=owned");

      if (response.ok) {
        const data = await response.json();

        setAvailableClothes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveFromWardrobe = async (clothesId: string) => {
    try {
      const response = await fetch(
        `/api/wardrobes/${wardrobeId}/clothes/${clothesId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        fetchWardrobe();
        fetchAvailableClothes();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateWardrobe = async () => {
    try {
      const response = await fetch(`/api/wardrobes/${wardrobeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wardrobeFormData),
      });

      if (response.ok) {
        fetchWardrobe();
        wardrobeModal.onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteWardrobe = async () => {
    try {
      const response = await fetch(`/api/wardrobes/${wardrobeId}`, {
        method: "DELETE",
      });

      if (response.ok) router.push("/profile");
    } catch (error) {
      console.error(error);
    } finally {
      onDeleteClose();
    }
  };

  const handleAddExistingItems = async () => {
    try {
      const response = await fetch(`/api/wardrobes/${wardrobeId}/clothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clothesIds: Array.from(selectedExistingItems) }),
      });

      if (response.ok) {
        fetchWardrobe();
        fetchAvailableClothes();
        addExistingModal.onClose();
        setSelectedExistingItems(new Set());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedExistingItems);

    newSelection.has(itemId)
      ? newSelection.delete(itemId)
      : newSelection.add(itemId);
    setSelectedExistingItems(newSelection);
  };

  if (loading || !wardrobe) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const itemsNotInWardrobe = availableClothes.filter(
    (item) =>
      !wardrobe.clothes.some((wardrobeItem) => wardrobeItem.id === item.id),
  );

  return (
    <div className="w-full min-h-screen pb-20">
      <div
        className="relative w-full h-[60vh] min-h-[500px] bg-content2 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${wardrobe.coverImage || "/images/placeholder_wardrobe.jpg"})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 md:px-8 flex flex-col">
          {/* Back Button */}
          <div className="pt-8">
            <Button
              isIconOnly
              className="bg-black/30 backdrop-blur-xl text-white border border-white/10 hover:bg-black/50 transition-all"
              radius="full"
              variant="flat"
              onPress={() => router.push("/profile")}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-end pb-12 md:pb-16">
            <div className="w-full flex flex-col md:flex-row md:justify-between md:items-end gap-8">
              <div className="flex-1 space-y-6">
                {/* Meta Info */}
                <div className="flex items-center gap-3 flex-wrap">
                  {wardrobe.isPublic ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-wider border border-white/20 rounded-full">
                      <GlobeAltIcon className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-xl text-white text-xs font-bold uppercase tracking-wider border border-white/20 rounded-full">
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </div>
                  )}
                  <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white/80 text-xs font-semibold uppercase tracking-wider border border-white/10 rounded-full">
                    {wardrobe.clothes.length}{" "}
                    {wardrobe.clothes.length === 1 ? "Piece" : "Pieces"}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 text-white text-xs font-bold uppercase">
                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                  <span>
                    {wardrobe.stats?.totalValue?.toLocaleString("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    }) || "$0.00"}
                  </span>
                </div>
                {/* Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white drop-shadow-2xl leading-none">
                  {wardrobe.title}
                </h1>

                {/* Description */}
                {wardrobe.description && (
                  <p className="max-w-2xl text-white/90 text-base md:text-lg font-light leading-relaxed drop-shadow-lg">
                    {wardrobe.description}
                  </p>
                )}
              </div>

              {/* Menu Actions */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                    radius="full"
                    variant="flat"
                  >
                    <EllipsisHorizontalIcon className="w-6 h-6" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Actions" variant="flat">
                  <DropdownItem
                    key="edit"
                    startContent={<PencilSquareIcon className="w-4 h-4" />}
                    onPress={wardrobeModal.onOpen}
                  >
                    Edit Details
                  </DropdownItem>
                  <DropdownItem
                    key="add"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={addExistingModal.onOpen}
                  >
                    Add Items
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<TrashIcon className="w-4 h-4" />}
                    onPress={onDeleteOpen}
                  >
                    Delete Collection
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {wardrobe.clothes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-300">
            <p className="text-default-400 uppercase tracking-widest text-sm mb-4">
              This collection is empty
            </p>
            <div className="flex gap-4">
              <Button
                radius="none"
                variant="bordered"
                onPress={() => router.push("/closet/new")}
              >
                New Item
              </Button>
              <Button
                color="primary"
                radius="none"
                onPress={addExistingModal.onOpen}
              >
                Add Existing
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
            {wardrobe.clothes.map((item) => (
              <div key={item.id} className="group relative">
                <div
                  className="aspect-[3/4] bg-content2 relative overflow-hidden mb-4 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/closet/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/closet/${item.id}`);
                    }
                  }}
                >
                  <Image
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    classNames={{ wrapper: "w-full h-full" }}
                    radius="none"
                    src={item.imageUrl || "/images/placeholder.png"}
                  />

                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Button
                      isIconOnly
                      className="min-w-8 w-8 h-8 bg-white/10 backdrop-blur text-danger hover:bg-danger hover:text-white border border-danger/20"
                      color="danger"
                      radius="none"
                      size="sm"
                      variant="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveFromWardrobe(item.id);
                      }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  {item.brand && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                      {item.brand}
                    </p>
                  )}
                  <h3 className="text-sm font-medium uppercase tracking-tight truncate">
                    {item.name}
                  </h3>
                  <div className="flex gap-2 items-center">
                    {item.price && (
                      <p className="text-xs text-default-500">${item.price}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div
              className="aspect-[3/4] border border-dashed border-default-300 flex flex-col items-center justify-center cursor-pointer hover:bg-default-50 transition-colors group"
              role="button"
              tabIndex={0}
              onClick={addExistingModal.onOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  addExistingModal.onOpen();
                }
              }}
            >
              <PlusIcon className="w-8 h-8 text-default-300 group-hover:text-default-500 transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest text-default-400 mt-2">
                Add Piece
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- EDIT WARDROBE MODAL --- */}
      <Modal
        isOpen={wardrobeModal.isOpen}
        radius="none"
        size="xl"
        onClose={wardrobeModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold">
            Edit Details
          </ModalHeader>
          <ModalBody className="gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                radius="none"
                value={wardrobeFormData.title}
                variant="bordered"
                onChange={(e) =>
                  setWardrobeFormData({
                    ...wardrobeFormData,
                    title: e.target.value,
                  })
                }
              />
              <Input
                label="Cover Image"
                radius="none"
                value={wardrobeFormData.coverImage}
                variant="bordered"
                onChange={(e) =>
                  setWardrobeFormData({
                    ...wardrobeFormData,
                    coverImage: e.target.value,
                  })
                }
              />
            </div>
            <Textarea
              label="Description"
              radius="none"
              value={wardrobeFormData.description}
              variant="bordered"
              onChange={(e) =>
                setWardrobeFormData({
                  ...wardrobeFormData,
                  description: e.target.value,
                })
              }
            />
            <div className="flex justify-between items-center border p-4 border-default-200">
              <span className="text-sm font-medium uppercase tracking-wide">
                Public Collection
              </span>
              <Switch
                isSelected={wardrobeFormData.isPublic}
                onValueChange={(v) =>
                  setWardrobeFormData({ ...wardrobeFormData, isPublic: v })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              radius="none"
              variant="light"
              onPress={wardrobeModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              radius="none"
              onPress={handleUpdateWardrobe}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- ADD EXISTING ITEMS MODAL --- */}
      <Modal
        isOpen={addExistingModal.isOpen}
        radius="none"
        scrollBehavior="inside"
        size="4xl"
        onClose={addExistingModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold">
            Select Pieces
          </ModalHeader>
          <ModalBody>
            {itemsNotInWardrobe.length === 0 ? (
              <div className="py-12 text-center text-default-400">
                All your items are already in this collection.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {itemsNotInWardrobe.map((item) => {
                  const isSelected = selectedExistingItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`relative aspect-[3/4] cursor-pointer group transition-all ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItemSelection(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          toggleItemSelection(item.id);
                        }
                      }}
                    >
                      <Image
                        className={`w-full h-full object-cover transition-opacity ${isSelected ? "opacity-80" : "opacity-100"}`}
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={item.imageUrl || "/images/placeholder.png"}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full z-10">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute bottom-0 w-full bg-white/90 p-2 text-xs truncate font-medium">
                        {item.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              radius="none"
              variant="light"
              onPress={addExistingModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={selectedExistingItems.size === 0}
              radius="none"
              onPress={handleAddExistingItems}
            >
              Add {selectedExistingItems.size} Piece
              {selectedExistingItems.size !== 1 ? "s" : ""}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message="This collection will be permanently deleted."
        title="Delete Collection"
        onClose={onDeleteClose}
        onConfirm={handleDeleteWardrobe}
      />
    </div>
  );
}
