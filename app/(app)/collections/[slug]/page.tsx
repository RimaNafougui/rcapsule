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
  Tabs,
  Tab,
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
  imageUrl?: string;
  addedToWardrobeAt?: string;
}

interface OutfitItem {
  id: string;
  name: string;
  imageUrl?: string;
  occasion?: string;
  season?: string;
  timesWorn?: number;
  addedToCollectionAt?: string;
}

interface Collection {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  clothes: ClothingItem[];
  outfits: OutfitItem[];
  stats?: {
    totalValue: number;
    itemCount: number;
    colorAnalysis: { color: string; count: number; percentage: number }[];
  };
}

export default function CollectionDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slugParam = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("clothes");
  const [availableClothes, setAvailableClothes] = useState<ClothingItem[]>([]);
  const [availableOutfits, setAvailableOutfits] = useState<OutfitItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const editModal = useDisclosure();
  const addClothesModal = useDisclosure();
  const addOutfitsModal = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: false,
    coverImage: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetchCollection();
      fetchAvailableClothes();
      fetchAvailableOutfits();
    }
  }, [status, router, slugParam]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${slugParam}`);

      if (res.ok) {
        const data = await res.json();
        const safe: Collection = {
          ...data,
          clothes: Array.isArray(data.clothes) ? data.clothes : [],
          outfits: Array.isArray(data.outfits) ? data.outfits : [],
        };

        setCollection(safe);
        setFormData({
          title: data.title,
          description: data.description || "",
          isPublic: data.isPublic,
          coverImage: data.coverImage || "",
        });
      } else if (res.status === 404) {
        router.push("/collections");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClothes = async () => {
    try {
      const res = await fetch("/api/clothes?status=owned");

      if (res.ok) setAvailableClothes(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAvailableOutfits = async () => {
    try {
      const res = await fetch("/api/outfits");

      if (res.ok) {
        const data = await res.json();

        setAvailableOutfits(Array.isArray(data) ? data : (data.outfits ?? []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveClothes = async (clothesId: string) => {
    if (!collection) return;
    try {
      await fetch(`/api/collections/${collection.id}/clothes/${clothesId}`, {
        method: "DELETE",
      });
      fetchCollection();
      fetchAvailableClothes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveOutfit = async (outfitId: string) => {
    if (!collection) return;
    try {
      await fetch(`/api/collections/${collection.id}/outfits/${outfitId}`, {
        method: "DELETE",
      });
      fetchCollection();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async () => {
    if (!collection) return;
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();

        editModal.onClose();
        const newSlug = updated.slug || collection.id;

        if (newSlug !== slugParam) {
          router.replace(`/collections/${newSlug}`);
        } else {
          fetchCollection();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (res.ok) router.push("/collections");
    } catch (e) {
      console.error(e);
    } finally {
      onDeleteClose();
    }
  };

  const handleAddClothes = async () => {
    if (!collection) return;
    try {
      await fetch(`/api/collections/${collection.id}/clothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clothesIds: Array.from(selectedItems) }),
      });
      fetchCollection();
      fetchAvailableClothes();
      addClothesModal.onClose();
      setSelectedItems(new Set());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddOutfits = async () => {
    if (!collection) return;
    try {
      await fetch(`/api/collections/${collection.id}/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitIds: Array.from(selectedItems) }),
      });
      fetchCollection();
      addOutfitsModal.onClose();
      setSelectedItems(new Set());
    } catch (e) {
      console.error(e);
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems);

    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedItems(next);
  };

  const openAddClothes = () => {
    setSelectedItems(new Set());
    addClothesModal.onOpen();
  };

  const openAddOutfits = () => {
    setSelectedItems(new Set());
    addOutfitsModal.onOpen();
  };

  if (loading || !collection) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const clothesNotInCollection = availableClothes.filter(
    (c) => !collection.clothes.some((wc) => wc.id === c.id),
  );
  const outfitsNotInCollection = availableOutfits.filter(
    (o) => !collection.outfits.some((wo) => wo.id === o.id),
  );

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Hero */}
      <div
        className="relative w-full h-[60vh] min-h-[500px] bg-content2 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${collection.coverImage || "/images/placeholder_wardrobe.jpg"})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/50 to-black/20" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-6 md:px-8 flex flex-col">
          <div className="pt-8">
            <Button
              isIconOnly
              className="bg-black/30 backdrop-blur-xl text-white border border-white/10 hover:bg-black/50 transition-all"
              radius="full"
              variant="flat"
              onPress={() => router.push("/collections")}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex items-end pb-12 md:pb-16">
            <div className="w-full flex flex-col md:flex-row md:justify-between md:items-end gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 flex-wrap">
                  {collection.isPublic ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white eyebrow border border-white/20">
                      <GlobeAltIcon className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-xl text-white eyebrow border border-white/20">
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </div>
                  )}
                  <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white/80 eyebrow border border-white/10">
                    <span className="num">{collection.clothes.length}</span>{" "}
                    {collection.clothes.length === 1 ? "Piece" : "Pieces"}
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 backdrop-blur-xl text-white/80 eyebrow border border-white/10">
                    <span className="num">{collection.outfits.length}</span>{" "}
                    {collection.outfits.length === 1 ? "Outfit" : "Outfits"}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 text-white text-xs font-bold uppercase">
                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                  <span>
                    {collection.stats?.totalValue?.toLocaleString("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    }) || "$0.00"}
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-light tracking-tight text-white leading-none">
                  {collection.title}
                </h1>

                {collection.description && (
                  <p className="max-w-2xl text-white/90 text-base md:text-lg font-light leading-relaxed drop-shadow-lg">
                    {collection.description}
                  </p>
                )}
              </div>

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
                    onPress={editModal.onOpen}
                  >
                    Edit Details
                  </DropdownItem>
                  <DropdownItem
                    key="add-clothes"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={openAddClothes}
                  >
                    Add Pieces
                  </DropdownItem>
                  <DropdownItem
                    key="add-outfits"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={openAddOutfits}
                  >
                    Add Outfits
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
        <Tabs
          fullWidth
          classNames={{
            tabList: "bg-default-100 p-1 w-full gap-1",
            tab: "h-10 eyebrow",
            cursor: "bg-foreground",
            tabContent: "group-data-[selected=true]:text-background",
            panel: "pt-10 px-0",
          }}
          selectedKey={activeTab}
          variant="solid"
          onSelectionChange={(k) => setActiveTab(k as string)}
        >
          <Tab key="clothes" title={`Pieces (${collection.clothes.length})`}>
            {collection.clothes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-300">
                <p className="eyebrow text-stone mb-4">No pieces yet</p>
                <Button color="primary" radius="none" onPress={openAddClothes}>
                  Add Pieces
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
                {collection.clothes.map((item) => (
                  <div key={item.id} className="group relative">
                    <div
                      className="aspect-[3/4] bg-content2 relative overflow-hidden mb-4 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/closet/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          router.push(`/closet/${item.id}`);
                      }}
                    >
                      <Image
                        alt={item.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700"
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={item.imageUrl || "/images/placeholder.png"}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          isIconOnly
                          className="min-w-8 w-8 h-8 bg-white/10 backdrop-blur text-danger hover:bg-danger hover:text-white border border-danger/20"
                          color="danger"
                          radius="none"
                          size="sm"
                          variant="solid"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveClothes(item.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {item.brand && (
                        <p className="eyebrow text-stone">{item.brand}</p>
                      )}
                      <h3 className="font-display font-light text-sm tracking-tight truncate">
                        {item.name}
                      </h3>
                      {item.price && (
                        <p className="eyebrow text-stone">
                          <span className="num">${item.price}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div
                  className="aspect-[3/4] border border-dashed border-default-300 flex flex-col items-center justify-center cursor-pointer hover:bg-default-50 transition-colors group"
                  role="button"
                  tabIndex={0}
                  onClick={openAddClothes}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openAddClothes();
                  }}
                >
                  <PlusIcon className="w-8 h-8 text-default-300 group-hover:text-default-500 transition-colors" />
                  <span className="eyebrow text-stone mt-2">Add Piece</span>
                </div>
              </div>
            )}
          </Tab>

          <Tab key="outfits" title={`Outfits (${collection.outfits.length})`}>
            {collection.outfits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-300">
                <p className="eyebrow text-stone mb-4">No outfits yet</p>
                <Button color="primary" radius="none" onPress={openAddOutfits}>
                  Add Outfits
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-6">
                {collection.outfits.map((outfit) => (
                  <div key={outfit.id} className="group relative">
                    <div
                      className="aspect-[3/4] bg-content2 relative overflow-hidden mb-4 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/outfits/${outfit.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          router.push(`/outfits/${outfit.id}`);
                      }}
                    >
                      <Image
                        alt={outfit.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700"
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={outfit.imageUrl || "/images/placeholder.png"}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          isIconOnly
                          className="min-w-8 w-8 h-8 bg-white/10 backdrop-blur text-danger hover:bg-danger hover:text-white border border-danger/20"
                          color="danger"
                          radius="none"
                          size="sm"
                          variant="solid"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOutfit(outfit.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-light text-sm tracking-tight truncate">
                        {outfit.name}
                      </h3>
                      {outfit.occasion && (
                        <p className="eyebrow text-stone">{outfit.occasion}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div
                  className="aspect-[3/4] border border-dashed border-default-300 flex flex-col items-center justify-center cursor-pointer hover:bg-default-50 transition-colors group"
                  role="button"
                  tabIndex={0}
                  onClick={openAddOutfits}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openAddOutfits();
                  }}
                >
                  <PlusIcon className="w-8 h-8 text-default-300 group-hover:text-default-500 transition-colors" />
                  <span className="eyebrow text-stone mt-2">Add Outfit</span>
                </div>
              </div>
            )}
          </Tab>
        </Tabs>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModal.isOpen}
        radius="none"
        size="xl"
        onClose={editModal.onClose}
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
                value={formData.title}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <Input
                label="Cover Image URL"
                radius="none"
                value={formData.coverImage}
                variant="bordered"
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
              />
            </div>
            <Textarea
              label="Description"
              radius="none"
              value={formData.description}
              variant="bordered"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <div className="flex justify-between items-center border p-4 border-default-200">
              <span className="text-sm font-medium uppercase tracking-wide">
                Public Collection
              </span>
              <Switch
                isSelected={formData.isPublic}
                onValueChange={(v) => setFormData({ ...formData, isPublic: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button radius="none" variant="light" onPress={editModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" radius="none" onPress={handleUpdate}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ADD PIECES MODAL */}
      <Modal
        isOpen={addClothesModal.isOpen}
        radius="none"
        scrollBehavior="inside"
        size="4xl"
        onClose={addClothesModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold">
            Select Pieces
          </ModalHeader>
          <ModalBody>
            {clothesNotInCollection.length === 0 ? (
              <div className="py-12 text-center text-default-400">
                All your items are already in this collection.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {clothesNotInCollection.map((item) => {
                  const isSelected = selectedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`relative aspect-[3/4] cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          toggleItem(item.id);
                      }}
                    >
                      <Image
                        className={`w-full h-full object-contain object-center transition-opacity ${isSelected ? "opacity-80" : ""}`}
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={item.imageUrl || "/images/placeholder.png"}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-white p-1 z-10">
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
              onPress={addClothesModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={selectedItems.size === 0}
              radius="none"
              onPress={handleAddClothes}
            >
              Add {selectedItems.size > 0 ? `${selectedItems.size} ` : ""}
              {selectedItems.size === 1 ? "Piece" : "Pieces"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ADD OUTFITS MODAL */}
      <Modal
        isOpen={addOutfitsModal.isOpen}
        radius="none"
        scrollBehavior="inside"
        size="4xl"
        onClose={addOutfitsModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold">
            Select Outfits
          </ModalHeader>
          <ModalBody>
            {outfitsNotInCollection.length === 0 ? (
              <div className="py-12 text-center text-default-400">
                All your outfits are already in this collection.
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {outfitsNotInCollection.map((outfit) => {
                  const isSelected = selectedItems.has(outfit.id);

                  return (
                    <div
                      key={outfit.id}
                      className={`relative aspect-[3/4] cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItem(outfit.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          toggleItem(outfit.id);
                      }}
                    >
                      <Image
                        className={`w-full h-full object-contain object-center transition-opacity ${isSelected ? "opacity-80" : ""}`}
                        classNames={{ wrapper: "w-full h-full" }}
                        radius="none"
                        src={outfit.imageUrl || "/images/placeholder.png"}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-white p-1 z-10">
                          <CheckCircleIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute bottom-0 w-full bg-white/90 p-2 text-xs truncate font-medium">
                        {outfit.name}
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
              onPress={addOutfitsModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={selectedItems.size === 0}
              radius="none"
              onPress={handleAddOutfits}
            >
              Add {selectedItems.size > 0 ? `${selectedItems.size} ` : ""}
              {selectedItems.size === 1 ? "Outfit" : "Outfits"}
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
        onConfirm={handleDelete}
      />
    </div>
  );
}
