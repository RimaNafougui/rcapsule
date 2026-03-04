"use client";
import { Card, CardBody, CardFooter, Image, Chip, Button } from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  status?: string;
  condition?: string;
  timesworn?: number;
}

interface ClothingCardProps {
  item: ClothingItem;
  onClick: (id: string) => void;
}

export default function ClothingCard({ item, onClick }: ClothingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isWishlist = item.status === "wishlist";

  const handleMarkAsPurchased = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/clothes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "owned",
          purchaseDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        // Refresh the page or trigger a refetch
        window.location.reload();
      } else {
        toast.error("Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Error updating item status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    if (!isUpdating) {
      onClick(item.id);
    }
  };

  return (
    <Card
      className="w-full bg-transparent group cursor-pointer"
      isPressable={false} // Disable isPressable to prevent button wrapper
    >
      <CardBody
        className="p-0 overflow-hidden rounded-none aspect-[3/4] bg-content2 relative flex justify-center items-center cursor-pointer"
        onClick={handleCardClick}
      >
        <Image
          alt={item.name}
          className="w-full h-full object-contain transform transition-transform duration-500 group-hover:scale-105"
          radius="none"
          src={item.imageUrl || "/images/placeholder.png"}
          width="100%"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-10" />

        {/* Mark as Purchased button for wishlist items */}
        {isWishlist && (
          <div
            className="absolute top-2 right-2 z-20"
            role="button"
            tabIndex={0}
            onClick={(e) => e.stopPropagation()} // Prevent card click
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
          >
            <Button
              isIconOnly
              className="backdrop-blur-sm bg-success-50/90 hover:bg-success-100"
              color="success"
              isLoading={isUpdating}
              size="sm"
              variant="flat"
              onPress={handleMarkAsPurchased}
            >
              {!isUpdating && <CheckIcon className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Condition badge for owned items */}
        {!isWishlist && item.condition && item.condition !== "excellent" && (
          <div className="absolute top-2 left-2 z-20">
            <Chip
              classNames={{
                base: "backdrop-blur-sm",
                content:
                  "text-[10px] uppercase tracking-wider font-semibold px-1 capitalize",
              }}
              color={
                item.condition === "new"
                  ? "success"
                  : item.condition === "good"
                    ? "primary"
                    : item.condition === "fair"
                      ? "warning"
                      : "default"
              }
              size="sm"
              variant="flat"
            >
              {item.condition}
            </Chip>
          </div>
        )}

        {/* Wear count badge */}
        {!isWishlist && item.timesworn !== undefined && item.timesworn > 0 && (
          <div className="absolute bottom-2 left-2 z-20">
            <Chip
              classNames={{
                base: "bg-default-50/90 backdrop-blur-sm",
                content:
                  "text-default-700 text-[10px] uppercase tracking-wider font-semibold px-1",
              }}
              size="sm"
              variant="flat"
            >
              Worn {item.timesworn}x
            </Chip>
          </div>
        )}
      </CardBody>

      <CardFooter
        className="flex flex-col items-start p-4 gap-1 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex justify-between w-full items-baseline">
          <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">
            {item.brand || "Unbranded"}
          </p>
          {item.price && (
            <p className="text-xs font-medium">${item.price.toFixed(2)}</p>
          )}
        </div>

        <h3 className="text-sm font-light text-foreground truncate w-full capitalize">
          {item.name}
        </h3>

        <p className="text-xs text-default-400 capitalize">{item.category}</p>
      </CardFooter>
    </Card>
  );
}
