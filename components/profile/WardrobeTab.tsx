"use client";
import type { Wardrobe } from "@/lib/database.type";

import { useRouter } from "next/navigation";
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
} from "@heroui/react";
import {
  PlusIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface WardrobeTabProps {
  wardrobes: (Wardrobe & { clothesCount?: number })[];
  refreshData: () => void;
}

export default function WardrobeTab({
  wardrobes,
  refreshData,
}: WardrobeTabProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [newWardrobe, setNewWardrobe] = useState({
    title: "",
    description: "",
    isPublic: false,
    coverImage: "",
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wardrobes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWardrobe),
      });

      if (res.ok) {
        refreshData();
        onClose();
        setNewWardrobe({
          title: "",
          description: "",
          isPublic: false,
          coverImage: "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESPONSIVE HEADER: Column on mobile, Row on desktop */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h2 className="text-xl font-display font-light tracking-normal">
            Curated Collections
          </h2>
          <p className="text-xs text-default-400 mt-1">
            Organize your pieces by season or trip
          </p>
        </div>
        <Button
          className="uppercase font-bold tracking-widest w-full md:w-auto"
          color="primary"
          radius="none"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={onOpen}
        >
          New Wardrobe
        </Button>
      </div>

      {/* GRID: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wardrobes.map((wardrobe) => (
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
                src={wardrobe.coverImage || "/images/placeholder_wardrobe.jpg"}
              />
              <div className="absolute top-2 right-2 z-10">
                {wardrobe.isPublic && (
                  <Chip
                    classNames={{ base: "bg-white/90 backdrop-blur" }}
                    size="sm"
                    startContent={<GlobeAltIcon className="w-3 h-3" />}
                  >
                    Public
                  </Chip>
                )}
              </div>
            </CardBody>
            <CardHeader className="px-0 pt-4 flex-col items-start">
              <h3 className="text-lg font-bold uppercase tracking-normal">
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

      <Modal
        isOpen={isOpen}
        placement="center" // Better for mobile
        radius="none"
        scrollBehavior="inside" // Prevents body scroll issues on small screens
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold text-xl">
            New Collection
          </ModalHeader>
          <ModalBody className="gap-6">
            {/* INPUT GRID: Stacked on mobile, side-by-side on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
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
                <span className="text-sm font-medium uppercase tracking-wide">
                  {newWardrobe.isPublic
                    ? "Public Collection"
                    : "Private Collection"}
                </span>
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
              isLoading={loading}
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
