"use client";
import { Card, CardBody, CardFooter, Skeleton } from "@heroui/react";

export default function ProductCardSkeleton() {
  return (
    <Card className="w-full bg-transparent">
      <CardBody className="p-0 overflow-hidden rounded-none aspect-[3/4]">
        <Skeleton className="w-full h-full rounded-none" />
      </CardBody>
      <CardFooter className="flex flex-col items-start p-4 gap-2">
        <div className="flex justify-between w-full">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-3 w-12 rounded-sm" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded-sm" />
        <Skeleton className="h-3 w-1/2 rounded-sm" />
      </CardFooter>
    </Card>
  );
}
