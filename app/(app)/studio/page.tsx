"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import useSWR from "swr";

import CollageBuilder from "@/components/outfit/CollageBuilder";

interface ClothingItem {
  id: string;
  name?: string;
  imageUrl?: string;
  category?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StudioPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [outfitName, setOutfitName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);

  // Peek at the outfit draft to know which items are pre-selected
  useEffect(() => {
    if (!returnTo) return;
    let key: string | null = null;

    if (returnTo === "/outfits/new") {
      key = "outfit_draft";
    } else {
      const match = returnTo.match(/^\/outfits\/([^/]+)\/edit$/);
      if (match) key = `outfit_draft_${match[1]}`;
    }
    if (!key) return;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (Array.isArray(draft.selectedClothes)) {
        setSelectedItems(draft.selectedClothes);
      }
    } catch {
      // ignore corrupt draft
    }
  }, [returnTo]);

  const { data: clothes = [], isLoading } = useSWR<ClothingItem[]>(
    status === "authenticated" ? "/api/clothes?status=owned" : null,
    fetcher,
    { dedupingInterval: 30_000 },
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((c) => c.id)),
    [selectedItems],
  );

  const otherItems = useMemo(
    () => clothes.filter((c) => !selectedIds.has(c.id)),
    [clothes, selectedIds],
  );

  const filteredItems = search.trim()
    ? otherItems.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.category?.toLowerCase().includes(search.toLowerCase()),
      )
    : otherItems;

  // Called by CollageBuilder when user hits Save
  const handleCanvasSave = async (file: File) => {
    if (returnTo) {
      // Upload the image and hand the URL back to the caller page
      setIsSaving(true);
      try {
        const formData = new FormData();

        formData.append("file", file, "collage.png");
        formData.append("folder", "studio");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { url: imageUrl } = await uploadRes.json();

        router.push(`${returnTo}?imageUrl=${encodeURIComponent(imageUrl)}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save collage");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    // Standalone mode: prompt for outfit name then create outfit
    setPendingFile(file);
    onOpen();
  };

  const handleCreateOutfit = async () => {
    if (!pendingFile || !outfitName.trim()) return;
    setIsSaving(true);
    try {
      // 1. Upload the transparent PNG via the server route (uses service-role key)
      const formData = new FormData();

      formData.append("file", pendingFile, "collage.png");
      formData.append("folder", "studio");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { url: imageUrl } = await uploadRes.json();

      // 2. Create the outfit
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: outfitName.trim(),
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to create outfit");

      const outfit = await res.json();

      toast.success("Outfit saved!");
      onClose();
      router.push(`/outfits/${outfit.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save outfit");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {/* Break out of the (app) layout container so the studio is full-width */}
      <div
        className="-mx-6 flex flex-col"
        style={{ height: "calc(100vh - 65px)" }}
      >
        {/* Studio header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-default-200 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              radius="none"
              size="sm"
              variant="light"
              onPress={() => (returnTo ? router.push(returnTo) : router.back())}
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-display font-light tracking-[0.15em] uppercase">
                Collage Studio
              </h1>
              <p className="text-[10px] text-default-400 tracking-widest uppercase">
                Design your look
              </p>
            </div>
          </div>

          <div className="w-56">
            <Input
              classNames={{ inputWrapper: "h-8" }}
              placeholder="Search items…"
              radius="none"
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-default-400" />
              }
              value={search}
              variant="bordered"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* CollageBuilder fills remaining height */}
        <div className="flex-1 overflow-hidden">
          <CollageBuilder
            items={filteredItems}
            selectedItems={selectedItems}
            onSave={handleCanvasSave}
          />
        </div>
      </div>

      {/* Save Outfit Modal */}
      <Modal isOpen={isOpen} radius="none" size="sm" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold text-sm">
            Save as Outfit
          </ModalHeader>
          <ModalBody>
            <Input
              isRequired
              label="Outfit name"
              labelPlacement="outside"
              placeholder="Summer Casual, Date Night…"
              radius="none"
              value={outfitName}
              variant="bordered"
              onChange={(e) => setOutfitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateOutfit();
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button radius="none" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              className="uppercase font-bold tracking-widest text-xs"
              color="primary"
              isDisabled={!outfitName.trim()}
              isLoading={isSaving}
              radius="none"
              onPress={handleCreateOutfit}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
