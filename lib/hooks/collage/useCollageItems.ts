import type { CanvasItem, ClothingItem, CanvasSize } from "./types";

import { useState } from "react";
import { toast } from "sonner";

interface UseCollageItemsOptions {
  canvasSize: CanvasSize;
  snapToGrid: boolean;
  gridSize: number;
  saveToHistory: (items: CanvasItem[]) => void;
}

export function useCollageItems({
  canvasSize,
  snapToGrid,
  gridSize,
  saveToHistory,
}: UseCollageItemsOptions) {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const snapValue = (value: number) => {
    if (!snapToGrid) return value;

    return Math.round(value / gridSize) * gridSize;
  };

  const placeOnCanvas = (
    item: ClothingItem,
    img: HTMLImageElement,
    corsEnabled: boolean,
  ) => {
    const baseWidth = 180;
    const aspectRatio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const calculatedHeight = baseWidth / aspectRatio;
    const centerX = canvasSize.width / 2 - baseWidth / 2;
    const centerY = canvasSize.height / 2 - calculatedHeight / 2;

    const newItem: CanvasItem = {
      ...item,
      uniqueId: `${item.id}-${Date.now()}`,
      x: centerX,
      y: centerY,
      width: baseWidth,
      height: calculatedHeight,
      zIndex: 0,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      naturalWidth: img.naturalWidth || baseWidth,
      naturalHeight: img.naturalHeight || calculatedHeight,
      corsEnabled,
    };

    setCanvasItems((prev) => {
      const withZ = { ...newItem, zIndex: prev.length + 1 };
      const next = [...prev, withZ];

      saveToHistory(next);

      return next;
    });
    setSelectedId(newItem.uniqueId);
  };

  const addToCanvas = (item: ClothingItem) => {
    const url = item.imageUrl;

    if (!url) return;

    const load = (withCors: boolean) => {
      const img = new Image();

      if (withCors) img.crossOrigin = "anonymous";
      img.onload = () => placeOnCanvas(item, img, withCors);
      img.onerror = () => {
        if (withCors) {
          // Retry without CORS — image will display but won't be exportable via html2canvas
          load(false);
        } else {
          toast.error(`Could not load "${item.name || "item"}"`);
        }
      };
      // Append a cache-buster only for the CORS attempt so it bypasses any
      // non-CORS cached entry the browser already holds for this URL.
      img.src = withCors ? `${url}${url.includes("?") ? "&" : "?"}cors=1` : url;
    };

    load(true);
  };

  const updateItem = (
    uniqueId: string,
    data: Partial<CanvasItem>,
    saveHistory = true,
  ) => {
    const newItems = canvasItems.map((item) =>
      item.uniqueId === uniqueId ? { ...item, ...data } : item,
    );

    setCanvasItems(newItems);
    if (saveHistory) saveToHistory(newItems);
  };

  const removeItem = (uniqueId: string) => {
    const newItems = canvasItems.filter((i) => i.uniqueId !== uniqueId);

    setCanvasItems(newItems);
    saveToHistory(newItems);
    setSelectedId(null);
  };

  const clearCanvas = (onConfirm: () => boolean) => {
    if (canvasItems.length === 0) return;
    if (!onConfirm()) return;
    setCanvasItems([]);
    saveToHistory([]);
    setSelectedId(null);
  };

  const duplicateItem = (uniqueId: string) => {
    const item = canvasItems.find((i) => i.uniqueId === uniqueId);

    if (!item) return;
    const newItem: CanvasItem = {
      ...item,
      uniqueId: `${item.id}-${Date.now()}`,
      x: item.x + 20,
      y: item.y + 20,
      zIndex: Math.max(...canvasItems.map((i) => i.zIndex)) + 1,
    };
    const newItems = [...canvasItems, newItem];

    setCanvasItems(newItems);
    saveToHistory(newItems);
    setSelectedId(newItem.uniqueId);
  };

  const bringToFront = (uniqueId: string) => {
    setSelectedId(uniqueId);
    const maxZ = Math.max(...canvasItems.map((i) => i.zIndex), 0);

    updateItem(uniqueId, { zIndex: maxZ + 1 });
  };

  const sendToBack = (uniqueId: string) => {
    const minZ = Math.min(...canvasItems.map((i) => i.zIndex), 0);

    updateItem(uniqueId, { zIndex: minZ - 1 });
  };

  const moveLayerUp = (uniqueId: string) => {
    const item = canvasItems.find((i) => i.uniqueId === uniqueId);

    if (!item) return;
    const higherItems = canvasItems.filter((i) => i.zIndex > item.zIndex);

    if (higherItems.length === 0) return;
    const nextItem = higherItems.reduce((a, b) =>
      a.zIndex < b.zIndex ? a : b,
    );
    const newItems = canvasItems.map((i) => {
      if (i.uniqueId === uniqueId) return { ...i, zIndex: nextItem.zIndex };
      if (i.uniqueId === nextItem.uniqueId)
        return { ...i, zIndex: item.zIndex };

      return i;
    });

    setCanvasItems(newItems);
    saveToHistory(newItems);
  };

  const moveLayerDown = (uniqueId: string) => {
    const item = canvasItems.find((i) => i.uniqueId === uniqueId);

    if (!item) return;
    const lowerItems = canvasItems.filter((i) => i.zIndex < item.zIndex);

    if (lowerItems.length === 0) return;
    const prevItem = lowerItems.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
    const newItems = canvasItems.map((i) => {
      if (i.uniqueId === uniqueId) return { ...i, zIndex: prevItem.zIndex };
      if (i.uniqueId === prevItem.uniqueId)
        return { ...i, zIndex: item.zIndex };

      return i;
    });

    setCanvasItems(newItems);
    saveToHistory(newItems);
  };

  return {
    canvasItems,
    setCanvasItems,
    selectedId,
    setSelectedId,
    snapValue,
    addToCanvas,
    updateItem,
    removeItem,
    clearCanvas,
    duplicateItem,
    bringToFront,
    sendToBack,
    moveLayerUp,
    moveLayerDown,
    selectedItem: canvasItems.find((i) => i.uniqueId === selectedId),
  };
}
