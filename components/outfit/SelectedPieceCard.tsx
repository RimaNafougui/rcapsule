"use client";

import { Image, Chip } from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface PieceItem {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Props {
  item: PieceItem;
  onRemove: (id: string) => void;
  isNew?: boolean;
}

export default function SelectedPieceCard({ item, onRemove, isNew }: Props) {
  return (
    <div
      className={`relative group w-24 flex-shrink-0 border-2 cursor-pointer hover:border-danger transition-colors ${isNew ? "border-success" : "border-default-200"}`}
      role="button"
      tabIndex={0}
      onClick={() => onRemove(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onRemove(item.id);
      }}
    >
      <div className="aspect-[3/4] overflow-hidden">
        <Image
          className="w-full h-full object-cover"
          classNames={{ wrapper: "w-full h-full" }}
          radius="none"
          src={item.imageUrl || ""}
        />
      </div>
      <div className="bg-default-50 px-1 py-1 text-[9px] uppercase tracking-wide truncate text-center border-t border-default-200">
        {item.name}
      </div>
      {isNew && (
        <div className="absolute top-1 left-1 z-10">
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
      <div className="absolute inset-0 bg-danger/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
        <div className="bg-danger text-white p-1.5 rounded-full">
          <XMarkIcon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
