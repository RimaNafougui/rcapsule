"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Button,
  Spinner,
  Chip,
  Image as HeroImage,
  useDisclosure,
} from "@heroui/react";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import ConfirmModal from "@/components/ui/ConfirmModal";

interface Outfit {
  id: string;
  name: string;
  description?: string;
  season?: string;
  occasion?: string;
  imageUrl?: string;
  isFavorite: boolean;
  timesWorn: number;
  lastWornAt?: string;
  clothes: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    category: string;
    brand?: string;
  }>;
}

export default function OutfitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchOutfit();
  }, [status, params.id]);

  const fetchOutfit = async () => {
    try {
      const response = await fetch(`/api/outfits/${params.id}`);

      if (response.ok) setOutfit(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/outfits/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/outfits");
      } else {
        toast.error("Failed to delete outfit");
      }
    } catch (error) {
      console.error(error);
    } finally {
      onDeleteClose();
    }
  };

  if (loading || !outfit)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <Button
          className="uppercase tracking-widest text-xs font-bold pl-0"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          variant="light"
          onPress={() => router.back()}
        >
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        {/* IMAGE SECTION */}
        <div className="bg-content2 flex items-center justify-center p-8 lg:p-20 order-2 lg:order-1">
          <div className="w-full max-w-lg shadow-2xl bg-white overflow-hidden aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={outfit.name}
              className="w-full h-full object-cover block"
              src={outfit.imageUrl || "/images/placeholder.png"}
            />
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-24 order-1 lg:order-2">
          <div className="mb-2 flex gap-2">
            {outfit.season && (
              <Chip
                className="uppercase text-[10px]"
                radius="none"
                size="sm"
                variant="bordered"
              >
                {outfit.season}
              </Chip>
            )}
            {outfit.occasion && (
              <Chip
                className="uppercase text-[10px]"
                radius="none"
                size="sm"
                variant="bordered"
              >
                {outfit.occasion}
              </Chip>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-2">
            {outfit.name}
          </h1>
          {outfit.description && (
            <p className="text-default-500 font-light text-lg mb-8 border-l-2 border-foreground pl-4 italic">
              &quot;{outfit.description}&quot;
            </p>
          )}
          <div className="flex items-center gap-8 mb-12 border-y border-divider py-4">
            <div>
              <span className="block text-3xl font-light">
                {outfit.timesWorn}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-default-400">
                Times Worn
              </span>
            </div>
            {outfit.lastWornAt && (
              <div>
                <span className="block text-xl font-light mt-1.5">
                  {new Date(outfit.lastWornAt).toLocaleDateString()}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-default-400">
                  Last Outing
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6">
              Deconstructed Look
            </h3>
            <div className="space-y-4">
              {outfit.clothes.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 items-center group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/closet/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/closet/${item.id}`);
                    }
                  }}
                >
                  <div className="w-16 h-16 bg-default-50 border border-default-200">
                    <HeroImage
                      removeWrapper
                      alt={item.name}
                      className="w-full h-full object-cover"
                      radius="none"
                      src={item.imageUrl || ""}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                      {item.brand || item.category}
                    </p>
                    <p className="font-medium uppercase tracking-tight group-hover:underline">
                      {item.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex gap-4">
            <Button
              fullWidth
              className="uppercase font-bold tracking-widest h-12"
              color="primary"
              radius="none"
              startContent={<PencilSquareIcon className="w-4 h-4" />}
              variant="solid"
              onPress={() => router.push(`/outfits/${outfit.id}/edit`)}
            >
              Edit Look
            </Button>
            <Button
              className="uppercase font-bold tracking-widest h-12 min-w-[100px]"
              color="danger"
              radius="none"
              startContent={<TrashIcon className="w-4 h-4" />}
              variant="bordered"
              onPress={onDeleteOpen}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message="Are you sure you want to delete this look? This cannot be undone."
        title="Delete Look"
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      />
    </div>
  );
}
