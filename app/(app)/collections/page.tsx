"use client";
import type { Wardrobe } from "@/lib/database.type";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Image,
  Chip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
  Spinner,
} from "@heroui/react";
import { toast } from "sonner";
import {
  PlusIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

export default function CollectionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Data State
  const [wardrobes, setWardrobes] = useState<
    (Wardrobe & { clothesCount?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  // New Wardrobe Form
  const [newWardrobe, setNewWardrobe] = useState({
    title: "",
    description: "",
    isPublic: false,
    coverImage: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchWardrobes();
    }
  }, [status, router]);

  const fetchWardrobes = async () => {
    try {
      const res = await fetch("/api/wardrobes");

      if (res.ok) {
        const data = await res.json();

        setWardrobes(data);
      }
    } catch (error) {
      console.error("Failed to fetch wardrobes:", error);
      toast.error("Failed to load collections. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newWardrobe.title.trim()) return;

    setCreateLoading(true);
    try {
      const res = await fetch("/api/wardrobes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWardrobe),
      });

      if (res.ok) {
        fetchWardrobes();
        onClose();
        setNewWardrobe({
          title: "",
          description: "",
          isPublic: false,
          coverImage: "",
        });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter and search
  const filteredWardrobes = wardrobes.filter((wardrobe) => {
    const matchesSearch =
      wardrobe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wardrobe.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "public" && wardrobe.isPublic) ||
      (filter === "private" && !wardrobe.isPublic);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
          Collections
        </h1>
        <p className="text-default-500 text-sm uppercase tracking-widest">
          Organize your wardrobe by season, occasion, or mood
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        {/* Search */}
        <div className="w-full md:w-auto flex-1 md:max-w-sm">
          <Input
            classNames={{
              inputWrapper: "h-10",
            }}
            placeholder="Search collections..."
            radius="none"
            startContent={
              <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
            }
            value={searchQuery}
            variant="bordered"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Filter Chips */}
          <div className="flex gap-2">
            {(["all", "public", "private"] as const).map((f) => (
              <Chip
                key={f}
                classNames={{
                  base: `cursor-pointer rounded-none ${
                    filter === f
                      ? "bg-foreground text-background"
                      : "border-default-300"
                  }`,
                  content: "font-bold text-[10px] uppercase tracking-widest",
                }}
                size="sm"
                variant={filter === f ? "solid" : "bordered"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Chip>
            ))}
          </div>

          {/* View Toggle */}
          <div className="hidden md:flex border border-default-200">
            <Button
              isIconOnly
              className={viewMode === "grid" ? "bg-default-100" : ""}
              radius="none"
              size="sm"
              variant="light"
              onPress={() => setViewMode("grid")}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              className={viewMode === "list" ? "bg-default-100" : ""}
              radius="none"
              size="sm"
              variant="light"
              onPress={() => setViewMode("list")}
            >
              <ListBulletIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Create Button */}
          <Button
            className="uppercase font-bold tracking-widest text-xs"
            color="primary"
            radius="none"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={onOpen}
          >
            <span className="hidden sm:inline">New Collection</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-6 mb-8 pb-6 border-b border-default-200">
        <div>
          <span className="text-2xl font-light">{wardrobes.length}</span>
          <span className="text-xs text-default-400 uppercase tracking-widest ml-2">
            Total
          </span>
        </div>
        <div>
          <span className="text-2xl font-light">
            {wardrobes.filter((w) => w.isPublic).length}
          </span>
          <span className="text-xs text-default-400 uppercase tracking-widest ml-2">
            Public
          </span>
        </div>
        <div>
          <span className="text-2xl font-light">
            {wardrobes.reduce((sum, w) => sum + (w.clothesCount || 0), 0)}
          </span>
          <span className="text-xs text-default-400 uppercase tracking-widest ml-2">
            Items
          </span>
        </div>
      </div>

      {/* Content */}
      {filteredWardrobes.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-default-300">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-default-100 flex items-center justify-center">
            <Squares2X2Icon className="w-8 h-8 text-default-400" />
          </div>
          {wardrobes.length === 0 ? (
            <>
              <h3 className="text-xl font-bold mb-2">No collections yet</h3>
              <p className="text-default-500 text-sm mb-6">
                Create your first collection to organize your wardrobe
              </p>
              <Button
                className="uppercase font-bold tracking-widest"
                color="primary"
                radius="none"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={onOpen}
              >
                Create Collection
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-default-500 text-sm">
                Try adjusting your search or filter
              </p>
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWardrobes.map((wardrobe) => (
            <Card
              key={wardrobe.id}
              isPressable
              className="bg-transparent group border border-transparent hover:border-default-200 transition-all"
              radius="none"
              shadow="none"
              onPress={() => router.push(`/wardrobe/${wardrobe.id}`)}
            >
              <CardBody className="p-0 aspect-[4/3] overflow-hidden relative">
                <Image
                  removeWrapper
                  alt={wardrobe.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  radius="none"
                  src={
                    wardrobe.coverImage || "/images/placeholder_wardrobe.jpg"
                  }
                />
                <div className="absolute top-3 right-3 z-10">
                  <Chip
                    classNames={{
                      base: "bg-background/80 backdrop-blur-sm rounded-none",
                      content:
                        "text-[10px] font-bold uppercase tracking-widest",
                    }}
                    size="sm"
                    startContent={
                      wardrobe.isPublic ? (
                        <GlobeAltIcon className="w-3 h-3" />
                      ) : (
                        <LockClosedIcon className="w-3 h-3" />
                      )
                    }
                  >
                    {wardrobe.isPublic ? "Public" : "Private"}
                  </Chip>
                </div>
              </CardBody>
              <CardHeader className="px-0 pt-4 flex-col items-start">
                <h3 className="text-lg font-bold uppercase tracking-tighter">
                  {wardrobe.title}
                </h3>
                <p className="text-xs text-default-400 uppercase tracking-widest">
                  {wardrobe.clothesCount || 0} Items •{" "}
                  {new Date(wardrobe.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredWardrobes.map((wardrobe) => (
            <div
              key={wardrobe.id}
              className="flex gap-4 p-4 border border-default-200 hover:border-default-400 transition-colors cursor-pointer group"
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/wardrobe/${wardrobe.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/wardrobe/${wardrobe.id}`);
                }
              }}
            >
              <div className="w-24 h-24 shrink-0 overflow-hidden">
                <Image
                  removeWrapper
                  alt={wardrobe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  radius="none"
                  src={
                    wardrobe.coverImage || "/images/placeholder_wardrobe.jpg"
                  }
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold uppercase tracking-tighter">
                    {wardrobe.title}
                  </h3>
                  <Chip
                    classNames={{
                      base: "rounded-none h-5",
                      content: "text-[9px] font-bold uppercase tracking-widest",
                    }}
                    size="sm"
                    startContent={
                      wardrobe.isPublic ? (
                        <GlobeAltIcon className="w-3 h-3" />
                      ) : (
                        <LockClosedIcon className="w-3 h-3" />
                      )
                    }
                    variant="flat"
                  >
                    {wardrobe.isPublic ? "Public" : "Private"}
                  </Chip>
                </div>
                {wardrobe.description && (
                  <p className="text-sm text-default-500 line-clamp-1 mb-2">
                    {wardrobe.description}
                  </p>
                )}
                <p className="text-xs text-default-400 uppercase tracking-widest">
                  {wardrobe.clothesCount || 0} Items • Updated{" "}
                  {new Date(wardrobe.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isOpen}
        placement="center"
        radius="none"
        scrollBehavior="inside"
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold text-xl">
            New Collection
          </ModalHeader>
          <ModalBody className="gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                isRequired
                label="Title"
                placeholder="Summer 2026"
                radius="none"
                value={newWardrobe.title}
                variant="bordered"
                onChange={(e) =>
                  setNewWardrobe({ ...newWardrobe, title: e.target.value })
                }
              />
              <Input
                label="Cover Image URL"
                placeholder="https://..."
                radius="none"
                value={newWardrobe.coverImage}
                variant="bordered"
                onChange={(e) =>
                  setNewWardrobe({ ...newWardrobe, coverImage: e.target.value })
                }
              />
            </div>
            <Input
              label="Description"
              placeholder="Vibes for the upcoming trip..."
              radius="none"
              value={newWardrobe.description}
              variant="bordered"
              onChange={(e) =>
                setNewWardrobe({ ...newWardrobe, description: e.target.value })
              }
            />
            <div className="flex justify-between items-center border p-4 border-default-200">
              <div className="flex gap-2 items-center">
                {newWardrobe.isPublic ? (
                  <GlobeAltIcon className="w-5 h-5" />
                ) : (
                  <LockClosedIcon className="w-5 h-5" />
                )}
                <div>
                  <span className="text-sm font-medium uppercase tracking-wide block">
                    {newWardrobe.isPublic
                      ? "Public Collection"
                      : "Private Collection"}
                  </span>
                  <span className="text-xs text-default-400">
                    {newWardrobe.isPublic
                      ? "Anyone can view this collection"
                      : "Only you can see this collection"}
                  </span>
                </div>
              </div>
              <Switch
                isSelected={newWardrobe.isPublic}
                onValueChange={(v) =>
                  setNewWardrobe({ ...newWardrobe, isPublic: v })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button radius="none" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              className="uppercase font-bold"
              color="primary"
              isDisabled={!newWardrobe.title.trim()}
              isLoading={createLoading}
              radius="none"
              onPress={handleCreate}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
