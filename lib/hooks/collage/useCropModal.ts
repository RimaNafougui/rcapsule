import type { CanvasItem, CropData } from "./types";

import { useState, useCallback, useEffect, useRef } from "react";

export function useCropModal(
  updateItem: (id: string, data: Partial<CanvasItem>) => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<CanvasItem | null>(null);
  const [cropSelection, setCropSelection] = useState<CropData | null>(null);
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [cropDragType, setCropDragType] = useState<"move" | "resize" | null>(
    null,
  );
  const [cropResizeHandle, setCropResizeHandle] = useState<string | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  const openCropModal = (item: CanvasItem) => {
    setCropTarget(item);
    setCropSelection(
      item.cropData ?? {
        x: 0,
        y: 0,
        width: item.naturalWidth,
        height: item.naturalHeight,
      },
    );
    setIsOpen(true);
  };

  const closeCropModal = () => {
    setIsOpen(false);
    setCropTarget(null);
    setCropSelection(null);
  };

  const handleCropMouseDown = (
    e: React.MouseEvent,
    type: "move" | "resize",
    handle?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCropDragging(true);
    setCropDragType(type);
    setCropDragStart({ x: e.clientX, y: e.clientY });
    if (handle) setCropResizeHandle(handle);
  };

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isCropDragging ||
        !cropSelection ||
        !cropTarget ||
        !cropImageRef.current
      )
        return;

      const rect = cropImageRef.current.getBoundingClientRect();
      const scaleX = cropTarget.naturalWidth / rect.width;
      const scaleY = cropTarget.naturalHeight / rect.height;
      const deltaX = (e.clientX - cropDragStart.x) * scaleX;
      const deltaY = (e.clientY - cropDragStart.y) * scaleY;

      if (cropDragType === "move") {
        const newX = Math.max(
          0,
          Math.min(
            cropSelection.x + deltaX,
            cropTarget.naturalWidth - cropSelection.width,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            cropSelection.y + deltaY,
            cropTarget.naturalHeight - cropSelection.height,
          ),
        );

        setCropSelection((prev) =>
          prev ? { ...prev, x: newX, y: newY } : null,
        );
      } else if (cropDragType === "resize" && cropResizeHandle) {
        const minSize = 50;
        const newCrop = { ...cropSelection };

        switch (cropResizeHandle) {
          case "se":
            newCrop.width = Math.max(
              minSize,
              Math.min(
                cropSelection.width + deltaX,
                cropTarget.naturalWidth - cropSelection.x,
              ),
            );
            newCrop.height = Math.max(
              minSize,
              Math.min(
                cropSelection.height + deltaY,
                cropTarget.naturalHeight - cropSelection.y,
              ),
            );
            break;
          case "sw": {
            const newW = Math.max(minSize, cropSelection.width - deltaX);
            const newX = cropSelection.x + (cropSelection.width - newW);

            if (newX >= 0) {
              newCrop.x = newX;
              newCrop.width = newW;
            }
            newCrop.height = Math.max(
              minSize,
              Math.min(
                cropSelection.height + deltaY,
                cropTarget.naturalHeight - cropSelection.y,
              ),
            );
            break;
          }
          case "ne": {
            newCrop.width = Math.max(
              minSize,
              Math.min(
                cropSelection.width + deltaX,
                cropTarget.naturalWidth - cropSelection.x,
              ),
            );
            const newH = Math.max(minSize, cropSelection.height - deltaY);
            const newY = cropSelection.y + (cropSelection.height - newH);

            if (newY >= 0) {
              newCrop.y = newY;
              newCrop.height = newH;
            }
            break;
          }
          case "nw": {
            const newW = Math.max(minSize, cropSelection.width - deltaX);
            const newX = cropSelection.x + (cropSelection.width - newW);

            if (newX >= 0) {
              newCrop.x = newX;
              newCrop.width = newW;
            }
            const newH = Math.max(minSize, cropSelection.height - deltaY);
            const newY = cropSelection.y + (cropSelection.height - newH);

            if (newY >= 0) {
              newCrop.y = newY;
              newCrop.height = newH;
            }
            break;
          }
        }
        setCropSelection(newCrop);
      }
      setCropDragStart({ x: e.clientX, y: e.clientY });
    },
    [
      isCropDragging,
      cropSelection,
      cropTarget,
      cropDragStart,
      cropDragType,
      cropResizeHandle,
    ],
  );

  const handleCropMouseUp = useCallback(() => {
    setIsCropDragging(false);
    setCropDragType(null);
    setCropResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isCropDragging) {
      window.addEventListener("mousemove", handleCropMouseMove);
      window.addEventListener("mouseup", handleCropMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleCropMouseMove);
        window.removeEventListener("mouseup", handleCropMouseUp);
      };
    }
  }, [isCropDragging, handleCropMouseMove, handleCropMouseUp]);

  const applyCrop = () => {
    if (!cropTarget || !cropSelection) return;
    const cropAspect = cropSelection.width / cropSelection.height;
    const newHeight = cropTarget.width / cropAspect;

    updateItem(cropTarget.uniqueId, {
      cropData: cropSelection,
      height: newHeight,
    });
    closeCropModal();
  };

  const resetCrop = () => {
    if (!cropTarget) return;
    setCropSelection({
      x: 0,
      y: 0,
      width: cropTarget.naturalWidth,
      height: cropTarget.naturalHeight,
    });
  };

  const removeCrop = () => {
    if (!cropTarget) return;
    const originalAspect = cropTarget.naturalWidth / cropTarget.naturalHeight;
    const newHeight = cropTarget.width / originalAspect;

    updateItem(cropTarget.uniqueId, { cropData: undefined, height: newHeight });
    closeCropModal();
  };

  return {
    isOpen,
    cropTarget,
    cropSelection,
    cropImageRef,
    openCropModal,
    closeCropModal,
    handleCropMouseDown,
    applyCrop,
    resetCrop,
    removeCrop,
  };
}
