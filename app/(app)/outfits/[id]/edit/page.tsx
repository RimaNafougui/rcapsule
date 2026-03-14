"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Image,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { ImageUpload } from "@/components/closet/ImageUpload";
import CollageBuilder from "@/components/outfit/CollageBuilder";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  imageUrl?: string;
  colors: string[];
  price?: number;
}

interface Wardrobe {
  id: string;
  title: string;
}

const ACCESSORY_CATEGORIES = [
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

const SEASONS = ["Spring", "Summer", "Fall", "Winter", "All Season"];
const OCCASIONS = [
  "Casual",
  "Work",
  "Formal",
  "Date Night",
  "Athletic",
  "Lounge",
  "Party",
  "Travel",
  "Wedding",
  "Interview",
];

export default function EditOutfitPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const outfitId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [availableClothes, setAvailableClothes] = useState<ClothingItem[]>([]);
  const [availableWardrobes, setAvailableWardrobes] = useState<Wardrobe[]>([]);
  const [selectedClothes, setSelectedClothes] = useState<ClothingItem[]>([]);
  const [selectedWardrobes, setSelectedWardrobes] = useState<Set<string>>(
    new Set(),
  );

  const [originalClothesIds, setOriginalClothesIds] = useState<Set<string>>(
    new Set(),
  );
  const [originalWardrobeIds, setOriginalWardrobeIds] = useState<Set<string>>(
    new Set(),
  );
  const [originalFormData, setOriginalFormData] = useState<
    typeof formData | null
  >(null);

  const [showCollageBuilder, setShowCollageBuilder] = useState(false);
  const [imageMethod, setImageMethod] = useState<"builder" | "upload" | "url">(
    "upload",
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    season: "",
    occasion: "",
    imageUrl: "",
    isFavorite: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const addClothesModal = useDisclosure();
  const confirmLeaveModal = useDisclosure();
  const confirmDeleteModal = useDisclosure();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!originalFormData) return false;
    const formChanged =
      formData.name !== originalFormData.name ||
      formData.description !== originalFormData.description ||
      formData.season !== originalFormData.season ||
      formData.occasion !== originalFormData.occasion ||
      formData.imageUrl !== originalFormData.imageUrl ||
      formData.isFavorite !== originalFormData.isFavorite;
    const currentClothesIds = new Set(selectedClothes.map((c) => c.id));
    const clothesChanged =
      currentClothesIds.size !== originalClothesIds.size ||
      [...currentClothesIds].some((id) => !originalClothesIds.has(id));
    const wardrobesChanged =
      selectedWardrobes.size !== originalWardrobeIds.size ||
      [...selectedWardrobes].some((id) => !originalWardrobeIds.has(id));

    return formChanged || clothesChanged || wardrobesChanged;
  }, [
    formData,
    originalFormData,
    selectedClothes,
    originalClothesIds,
    selectedWardrobes,
    originalWardrobeIds,
  ]);

  const changesSummary = useMemo(() => {
    if (!originalFormData) return null;
    const changes: string[] = [];

    if (formData.name !== originalFormData.name) changes.push("title");
    if (formData.description !== originalFormData.description)
      changes.push("notes");
    if (formData.season !== originalFormData.season) changes.push("season");
    if (formData.occasion !== originalFormData.occasion)
      changes.push("occasion");
    if (formData.imageUrl !== originalFormData.imageUrl) changes.push("image");
    if (formData.isFavorite !== originalFormData.isFavorite)
      changes.push("favorite");
    const currentClothesIds = new Set(selectedClothes.map((c) => c.id));
    const addedClothes = [...currentClothesIds].filter(
      (id) => !originalClothesIds.has(id),
    ).length;
    const removedClothes = [...originalClothesIds].filter(
      (id) => !currentClothesIds.has(id),
    ).length;

    if (addedClothes > 0) changes.push(`+${addedClothes} items`);
    if (removedClothes > 0) changes.push(`-${removedClothes} items`);

    return changes;
  }, [formData, originalFormData, selectedClothes, originalClothesIds]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchAllData();
  }, [status, router, outfitId]);

  const fetchAllData = async () => {
    try {
      const [clothesRes, wardrobesRes, outfitRes] = await Promise.all([
        fetch("/api/clothes?status=owned"),
        fetch("/api/wardrobes"),
        fetch(`/api/outfits/${outfitId}`),
      ]);

      if (clothesRes.ok) setAvailableClothes(await clothesRes.json());
      if (wardrobesRes.ok) setAvailableWardrobes(await wardrobesRes.json());
      if (outfitRes.ok) {
        const outfit = await outfitRes.json();
        const initialFormData = {
          name: outfit.name || "",
          description: outfit.description || "",
          season: outfit.season || "",
          occasion: outfit.occasion || "",
          imageUrl: outfit.imageUrl || "",
          isFavorite: outfit.isFavorite || false,
        };

        setFormData(initialFormData);
        setOriginalFormData(initialFormData);
        if (outfit.clothes && Array.isArray(outfit.clothes)) {
          setSelectedClothes(outfit.clothes);
          setOriginalClothesIds(new Set(outfit.clothes.map((c: any) => c.id)));
        }
        if (outfit.wardrobes && Array.isArray(outfit.wardrobes)) {
          const ids = outfit.wardrobes.map((w: any) => w.id);

          setSelectedWardrobes(new Set(ids));
          setOriginalWardrobeIds(new Set(ids));
        }
        if (outfit.imageUrl) {
          setImageMethod(
            outfit.imageUrl.includes("base64") ? "builder" : "url",
          );
        }
      } else {
        toast.error("Outfit not found");
        router.push("/outfits");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClothes = (item: ClothingItem) => {
    if (selectedClothes.find((c) => c.id === item.id)) return;
    const isAccessory = ACCESSORY_CATEGORIES.includes(item.category);

    if (!isAccessory) {
      const filtered = selectedClothes.filter(
        (c) => c.category !== item.category,
      );

      setSelectedClothes([...filtered, item]);
    } else {
      setSelectedClothes([...selectedClothes, item]);
    }
  };

  const handleRemoveClothes = (itemId: string) => {
    setSelectedClothes(selectedClothes.filter((c) => c.id !== itemId));
  };

  const getSelectedInCategory = (
    category: string,
  ): ClothingItem | undefined => {
    return selectedClothes.find((c) => c.category === category);
  };

  const toggleWardrobe = (id: string) => {
    const s = new Set(selectedWardrobes);

    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedWardrobes(s);
  };

  const handleCollageSave = async (file: File) => {
    try {
      const uploadData = new FormData();

      uploadData.append("file", file);
      uploadData.append("folder", "outfits");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();

        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        setShowCollageBuilder(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const totalCost = selectedClothes.reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );

  const handleNavigateAway = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      confirmLeaveModal.onOpen();
    } else {
      router.push(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) router.push(pendingNavigation);
    confirmLeaveModal.onClose();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || selectedClothes.length === 0) {
      toast.error("Name and items required.");

      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          clothesIds: selectedClothes.map((c) => c.id),
          wardrobeIds: Array.from(selectedWardrobes),
        }),
      });

      if (response.ok) {
        router.push(`/outfits/${outfitId}`);
      } else {
        const err = await response.json();

        const msg =
          typeof err.error === "string" ? err.error : "Failed to save outfit";

        toast.error(msg);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: "DELETE",
      });

      if (response.ok) router.push("/outfits");
      else toast.error("Failed to delete");
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
      confirmDeleteModal.onClose();
    }
  };

  const resetChanges = () => {
    if (originalFormData) setFormData(originalFormData);
    const originalClothes = availableClothes.filter((c) =>
      originalClothesIds.has(c.id),
    );

    setSelectedClothes(originalClothes);
    setSelectedWardrobes(new Set(originalWardrobeIds));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const unselectedClothes = availableClothes.filter(
    (item) => !selectedClothes.find((s) => s.id === item.id),
  );

  const filteredClothes = unselectedClothes.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedClothes = filteredClothes.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);

      return acc;
    },
    {} as Record<string, ClothingItem[]>,
  );

  const allCategories = [
    ...new Set(availableClothes.map((c) => c.category)),
  ].sort();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            radius="full"
            variant="light"
            onPress={() => handleNavigateAway(`/outfits/${outfitId}`)}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
              Edit Look
            </h1>
            <p className="text-xs uppercase tracking-widest text-default-500">
              Refine your curation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <>
              <Tooltip content={`Changes: ${changesSummary?.join(", ")}`}>
                <Chip
                  color="warning"
                  size="sm"
                  startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                  variant="flat"
                >
                  {changesSummary?.length} changes
                </Chip>
              </Tooltip>
              <Button
                size="sm"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                variant="light"
                onPress={resetChanges}
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        onSubmit={handleUpdate}
      >
        <div className="lg:col-span-5 h-fit lg:sticky lg:top-24 space-y-6">
          <div className="aspect-[3/4] bg-content2 border border-dashed border-default-300 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-4 z-10">
              <Tabs
                classNames={{
                  tabList:
                    "bg-background/80 backdrop-blur border border-default-200",
                }}
                radius="none"
                selectedKey={imageMethod}
                size="sm"
                onSelectionChange={(k) =>
                  setImageMethod(k as typeof imageMethod)
                }
              >
                <Tab key="builder" title="Collage" />
                <Tab key="upload" title="Upload" />
                <Tab key="url" title="URL" />
              </Tabs>
            </div>
            <div className="w-full h-full p-8 flex items-center justify-center">
              {formData.imageUrl ? (
                <div className="relative w-full h-full group">
                  <Image
                    alt="Preview"
                    className="w-full h-full object-contain shadow-xl"
                    src={formData.imageUrl}
                  />
                  <Button
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100"
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }
                  >
                    Change
                  </Button>
                </div>
              ) : imageMethod === "builder" ? (
                <div className="text-center">
                  <Button
                    className="uppercase font-bold text-xs tracking-widest h-14 px-8"
                    isDisabled={selectedClothes.length === 0}
                    radius="none"
                    size="lg"
                    startContent={<SparklesIcon className="w-5 h-5" />}
                    variant="flat"
                    onPress={() => setShowCollageBuilder(true)}
                  >
                    Open Collage Studio
                  </Button>
                  <p className="text-[10px] text-default-400 mt-4 uppercase tracking-wider">
                    {selectedClothes.length === 0
                      ? "Select clothes first"
                      : `${selectedClothes.length} items ready`}
                  </p>
                </div>
              ) : imageMethod === "upload" ? (
                <ImageUpload
                  folder="outfits"
                  label="Upload"
                  value={formData.imageUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, imageUrl: url }))
                  }
                />
              ) : (
                <div className="w-full max-w-xs">
                  <Input
                    label="Image URL"
                    placeholder="https://..."
                    radius="none"
                    value={formData.imageUrl}
                    variant="bordered"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {selectedClothes.length > 0 && (
            <div className="bg-content2 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-default-500">
                  Items
                </span>
                <span className="text-2xl font-light">
                  {selectedClothes.length}
                </span>
              </div>
              {totalCost > 0 && (
                <div className="flex justify-between items-center border-t border-divider pt-3">
                  <span className="text-xs uppercase tracking-widest text-default-500">
                    Total Value
                  </span>
                  <span className="text-xl font-light">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="border border-danger-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-danger mb-3">
              Danger Zone
            </h4>
            <Button
              className="uppercase tracking-widest text-xs"
              color="danger"
              radius="none"
              size="sm"
              startContent={<TrashIcon className="w-4 h-4" />}
              variant="flat"
              onPress={confirmDeleteModal.onOpen}
            >
              Delete This Look
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-12">
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-divider pb-2">
              Look Details
            </h3>
            <Input
              isRequired
              classNames={{ inputWrapper: "h-12" }}
              label="Title"
              radius="none"
              value={formData.name}
              variant="bordered"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Textarea
              label="Notes"
              minRows={2}
              placeholder="Styling notes..."
              radius="none"
              value={formData.description}
              variant="bordered"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Season"
                radius="none"
                selectedKeys={formData.season ? [formData.season] : []}
                variant="bordered"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, season: e.target.value }))
                }
              >
                {SEASONS.map((s) => (
                  <SelectItem key={s}>{s}</SelectItem>
                ))}
              </Select>
              <Select
                label="Occasion"
                radius="none"
                selectedKeys={formData.occasion ? [formData.occasion] : []}
                variant="bordered"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occasion: e.target.value }))
                }
              >
                {OCCASIONS.map((o) => (
                  <SelectItem key={o}>{o}</SelectItem>
                ))}
              </Select>
            </div>
            <Checkbox
              isSelected={formData.isFavorite}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, isFavorite: v }))
              }
            >
              <span className="text-sm uppercase tracking-wide">Favorite</span>
            </Checkbox>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-divider pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest">
                Pieces ({selectedClothes.length})
              </h3>
              <Button
                className="uppercase font-bold text-[10px]"
                radius="none"
                size="sm"
                startContent={<PlusIcon className="w-4 h-4" />}
                variant="light"
                onPress={addClothesModal.onOpen}
              >
                Add Items
              </Button>
            </div>
            {selectedClothes.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-default-300">
                <p className="text-default-400 text-sm italic mb-4">
                  No items selected
                </p>
                <Button
                  radius="none"
                  size="sm"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  variant="flat"
                  onPress={addClothesModal.onOpen}
                >
                  Browse Closet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  selectedClothes.reduce(
                    (acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);

                      return acc;
                    },
                    {} as Record<string, ClothingItem[]>,
                  ),
                )
                  .sort(([catA], [catB]) => catA.localeCompare(catB))
                  .map(([category, items]) => (
                    <div key={category}>
                      <div className="text-[10px] uppercase tracking-widest text-default-500 mb-2">
                        {category}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {items.map((item) => {
                          const isNew = !originalClothesIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              className={`relative group aspect-[3/4] border-2 cursor-pointer hover:border-danger transition-colors ${isNew ? "border-success" : "border-default-200"}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleRemoveClothes(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleRemoveClothes(item.id);
                                }
                              }}
                            >
                              <Image
                                className="w-full h-full object-cover"
                                classNames={{ wrapper: "w-full h-full" }}
                                radius="none"
                                src={item.imageUrl || ""}
                              />
                              <div className="absolute bottom-0 w-full bg-white/90 p-1 text-[9px] uppercase truncate text-center">
                                {item.name}
                              </div>
                              {isNew && (
                                <div className="absolute top-1 left-1">
                                  <Chip
                                    className="text-[8px] h-4"
                                    color="success"
                                    size="sm"
                                    variant="flat"
                                  >
                                    NEW
                                  </Chip>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-danger/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <div className="bg-danger text-white p-2 rounded-full">
                                  <XMarkIcon className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {availableWardrobes.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest border-b border-divider pb-2">
                Collections
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableWardrobes.map((w) => {
                  const isSelected = selectedWardrobes.has(w.id);
                  const isNew = isSelected && !originalWardrobeIds.has(w.id);

                  return (
                    <button
                      key={w.id}
                      className={`relative px-4 py-2 border text-xs uppercase tracking-wide transition-all ${isSelected ? "border-primary bg-primary text-white" : "border-default-200 hover:border-default-400"}`}
                      type="button"
                      onClick={() => toggleWardrobe(w.id)}
                    >
                      {w.title}
                      {isNew && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="pt-8 flex gap-4">
            <Button
              fullWidth
              className="h-12 uppercase tracking-widest"
              radius="none"
              variant="bordered"
              onPress={() => handleNavigateAway(`/outfits/${outfitId}`)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              className="h-12 uppercase tracking-widest font-bold"
              color="primary"
              isDisabled={
                !formData.name.trim() ||
                selectedClothes.length === 0 ||
                !hasUnsavedChanges
              }
              isLoading={submitting}
              radius="none"
              type="submit"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        isOpen={addClothesModal.isOpen}
        radius="none"
        scrollBehavior="inside"
        size="5xl"
        onClose={addClothesModal.onClose}
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
                placeholder="Search..."
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
            {Object.keys(groupedClothes).length === 0 ? (
              <div className="py-12 text-center text-default-400">
                No items found
              </div>
            ) : (
              Object.entries(groupedClothes)
                .sort(([catA], [catB]) => catA.localeCompare(catB))
                .map(([category, items]) => {
                  const isAccessory = ACCESSORY_CATEGORIES.includes(category);
                  const selectedInCategory = getSelectedInCategory(category);

                  return (
                    <div key={category} className="mb-8">
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-default-200">
                        <h4 className="text-xs font-bold uppercase tracking-widest">
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
                                className={`aspect-[3/4] cursor-pointer group relative border-2 transition-all ${isSelected ? "border-primary shadow-lg" : wouldReplace ? "border-warning-300 hover:border-warning" : "border-transparent hover:border-default-300"}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleAddClothes(item)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    handleAddClothes(item);
                                  }
                                }}
                              >
                                <Image
                                  className="w-full h-full object-cover group-hover:opacity-90"
                                  radius="none"
                                  src={item.imageUrl || ""}
                                />
                                <div
                                  className={`absolute bottom-0 w-full p-1 text-[9px] uppercase truncate text-center ${isSelected ? "bg-primary text-white" : "bg-white/90 text-foreground"}`}
                                >
                                  {item.name}
                                </div>
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
              </span>
              <Button
                color="primary"
                radius="none"
                onPress={addClothesModal.onClose}
              >
                Done
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        classNames={{ body: "p-0", header: "border-b border-default-200" }}
        isOpen={showCollageBuilder}
        radius="none"
        size="5xl"
        onClose={() => setShowCollageBuilder(false)}
      >
        <ModalContent className="h-[85vh]">
          <ModalHeader className="uppercase tracking-widest font-bold">
            Collage Studio
          </ModalHeader>
          <ModalBody className="overflow-hidden">
            <CollageBuilder
              items={selectedClothes}
              onSave={handleCollageSave}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={confirmLeaveModal.isOpen}
        radius="none"
        size="sm"
        onClose={confirmLeaveModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
            Unsaved Changes
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              You have unsaved changes. Are you sure you want to leave?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              radius="none"
              variant="light"
              onPress={confirmLeaveModal.onClose}
            >
              Stay
            </Button>
            <Button color="danger" radius="none" onPress={confirmNavigation}>
              Leave
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={confirmDeleteModal.isOpen}
        radius="none"
        size="sm"
        onClose={confirmDeleteModal.onClose}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <TrashIcon className="w-5 h-5 text-danger" />
            Delete Outfit
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete{" "}
              <strong>&quot;{formData.name}&quot;</strong>? This cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              radius="none"
              variant="light"
              onPress={confirmDeleteModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={deleting}
              radius="none"
              onPress={handleDelete}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
