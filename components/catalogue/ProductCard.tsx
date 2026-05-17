"use client";
import type { GlobalProduct } from "@/lib/types/globalproduct";

import { Card, CardBody, CardFooter, Image, Button, Chip } from "@heroui/react";
import {
  PlusIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import NextLink from "next/link";

interface ProductCardProps {
  product: GlobalProduct;
  onAddToCloset: (product: GlobalProduct) => void;
}

export default function ProductCard({
  product,
  onAddToCloset,
}: ProductCardProps) {
  return (
    <Card className="w-full bg-transparent group">
      <CardBody className="p-0 overflow-hidden rounded-none aspect-[3/4] bg-content2 relative flex justify-center items-center">
        <Image
          alt={product.name}
          className="w-full h-full object-contain transform transition-transform duration-500 group-hover:scale-105"
          radius="none"
          src={
            product.processed_image_url ||
            product.imageurl ||
            "/images/placeholder.png"
          }
          width="100%"
        />

        {/* Overlay with Add button on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            className="uppercase font-bold tracking-widest text-xs"
            color="primary"
            radius="none"
            size="sm"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => onAddToCloset(product)}
          >
            Add to Closet
          </Button>
        </div>

        {/* Out of stock badge */}
        {product.inStock === false && (
          <div className="absolute top-2 left-2 z-20">
            <Chip
              classNames={{
                base: "backdrop-blur-sm",
                content: "text-[10px] uppercase tracking-wider font-semibold",
              }}
              color="warning"
              size="sm"
              variant="flat"
            >
              Out of Stock
            </Chip>
          </div>
        )}

        {/* External link button */}
        {product.retaillink && (
          <div className="absolute top-2 right-2 z-20">
            <Button
              isIconOnly
              as="a"
              className="backdrop-blur-sm bg-background/80"
              href={product.retaillink}
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              variant="flat"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardBody>

      <CardFooter
        as={NextLink}
        className="flex flex-col items-start p-4 gap-1 hover:bg-content2 transition-colors"
        href={`/catalogue/${product.id}`}
      >
        <div className="flex justify-between w-full items-baseline">
          <p className="text-[10px] font-display font-light tracking-normal text-default-500">
            {product.brand || "Unknown Brand"}
          </p>
          {product.originalprice && (
            <p className="text-xs font-medium">
              {product.currency === "USD" ? "$" : product.currency || "$"}
              {product.originalprice.toFixed(2)}
            </p>
          )}
        </div>

        <h3 className="text-sm font-light text-foreground truncate w-full capitalize">
          {product.name}
        </h3>

        <p className="text-xs text-default-400 capitalize">
          {product.category}
        </p>
      </CardFooter>
    </Card>
  );
}
