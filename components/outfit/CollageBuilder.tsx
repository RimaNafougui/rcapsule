"use client";
import type { ClothingItem, ToolMode } from "@/lib/hooks/collage/types";

import { useState, useRef, useCallback, useEffect } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import {
  Button,
  Slider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  useDisclosure,
} from "@heroui/react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ViewfinderCircleIcon,
  MinusIcon,
  PlusIcon,
  ArrowsPointingInIcon,
  DocumentDuplicateIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  HandRaisedIcon,
  CursorArrowRaysIcon,
  Square2StackIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { CANVAS_PRESETS } from "@/lib/hooks/collage/types";
import { useCollageHistory } from "@/lib/hooks/collage/useCollageHistory";
import { useCollageItems } from "@/lib/hooks/collage/useCollageItems";
import { useCollagePanZoom } from "@/lib/hooks/collage/useCollagePanZoom";
import { useCropModal } from "@/lib/hooks/collage/useCropModal";

interface CollageBuilderProps {
  items: ClothingItem[];
  selectedItems?: ClothingItem[];
  onSave: (file: File) => Promise<void>;
}

export default function CollageBuilder({ items, selectedItems, onSave }: CollageBuilderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
  const {
    isOpen: isClearOpen,
    onOpen: onClearOpen,
    onClose: onClearClose,
  } = useDisclosure();
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, _setSnapToGrid] = useState(false);
  const gridSize = 20;
  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");
  const [canvasBgOpacity, setCanvasBgOpacity] = useState(1);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const canvasRef = useRef<HTMLDivElement>(null);

  // Hooks
  const {
    historyIndex: _historyIndex,
    history: _history,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCollageHistory();

  const {
    canvasItems,
    setCanvasItems,
    selectedId,
    setSelectedId,
    selectedItem,
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
  } = useCollageItems({ canvasSize, snapToGrid, gridSize, saveToHistory });

  const {
    canvasOffset,
    canvasZoom,
    isPanning,
    containerRef: canvasContainerRef,
    handleMouseDown: handlePanMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetView,
    fitToView,
    zoomIn,
    zoomOut,
  } = useCollagePanZoom(canvasSize);

  const crop = useCropModal(updateItem);

  // Wire undo/redo to setCanvasItems
  const handleUndo = useCallback(
    () => undo(setCanvasItems),
    [undo, setCanvasItems],
  );
  const handleRedo = useCallback(
    () => redo(setCanvasItems),
    [redo, setCanvasItems],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeItem(selectedId);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setToolMode("select");
      }
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        setToolMode("pan");
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setToolMode("select");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleUndo, handleRedo, selectedId, removeItem, setSelectedId]);

  const toBase64 = (url: string): Promise<string> => {
    // Already a data URL — return as-is (the route will strip the prefix)
    if (url.startsWith("data:")) return Promise.resolve(url);

    return new Promise((resolve, reject) => {
      const img = new window.Image();

      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleRemoveBg = async (uniqueId: string) => {
    const item = canvasItems.find((i) => i.uniqueId === uniqueId);

    if (!item?.imageUrl) return;
    setRemovingBgId(uniqueId);
    try {
      const imageBase64 = await toBase64(item.imageUrl);
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();

      if (res.ok && data.image) {
        updateItem(uniqueId, { imageUrl: data.image });
        toast.success("Background removed");
      } else {
        toast.error(data.error || "Background removal failed");
      }
    } catch {
      toast.error("Background removal failed");
    } finally {
      setRemovingBgId(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    handlePanMouseDown(e, toolMode);
    if (
      toolMode === "select" &&
      (e.target === canvasContainerRef.current ||
        e.target === canvasRef.current)
    ) {
      setSelectedId(null);
    }
  };

  const getImageStyle = (
    item: (typeof canvasItems)[0],
  ): React.CSSProperties => {
    if (!item.cropData) {
      return {
        width: "100%",
        height: "100%",
        objectFit: "fill" as const,
        transform:
          `${item.flipX ? "scaleX(-1)" : ""} ${item.flipY ? "scaleY(-1)" : ""}`.trim() ||
          undefined,
      };
    }
    const { cropData, naturalWidth, naturalHeight, width, height } = item;
    const scaleX = width / cropData.width;
    const scaleY = height / cropData.height;

    return {
      position: "absolute" as const,
      width: naturalWidth * scaleX,
      height: naturalHeight * scaleY,
      left: -cropData.x * scaleX,
      top: -cropData.y * scaleY,
      maxWidth: "none",
      transform:
        `${item.flipX ? "scaleX(-1)" : ""} ${item.flipY ? "scaleY(-1)" : ""}`.trim() ||
        undefined,
    };
  };

  const handleSave = async () => {
    if (!canvasRef.current || canvasItems.length === 0) return;
    setIsSaving(true);
    setSelectedId(null);
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor:
          canvasBgOpacity === 0
            ? null
            : hexToRgba(canvasBgColor, canvasBgOpacity),
        scale: 2,
        width: canvasSize.width,
        height: canvasSize.height,
      });

      canvas.toBlob(async (blob) => {
        if (blob)
          await onSave(new File([blob], "collage.png", { type: "image/png" }));
      }, "image/png");
    } catch (err) {
      console.error("Collage failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* MAIN TOOLBAR */}
      <div className="flex justify-between items-center bg-default-50 px-3 py-2 border-b border-default-200 gap-2 flex-wrap">
        {/* Left: Tools */}
        <div className="flex items-center gap-1">
          <Tooltip content="Select (V)">
            <Button
              isIconOnly
              color={toolMode === "select" ? "primary" : "default"}
              radius="none"
              size="sm"
              variant={toolMode === "select" ? "solid" : "light"}
              onPress={() => setToolMode("select")}
            >
              <CursorArrowRaysIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Pan (Space / Middle Click)">
            <Button
              isIconOnly
              color={toolMode === "pan" ? "primary" : "default"}
              radius="none"
              size="sm"
              variant={toolMode === "pan" ? "solid" : "light"}
              onPress={() => setToolMode("pan")}
            >
              <HandRaisedIcon className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Divider className="h-6 mx-2" orientation="vertical" />

          <Tooltip content="Undo (Ctrl+Z)">
            <Button
              isIconOnly
              isDisabled={!canUndo}
              radius="none"
              size="sm"
              variant="light"
              onPress={handleUndo}
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Y)">
            <Button
              isIconOnly
              isDisabled={!canRedo}
              radius="none"
              size="sm"
              variant="light"
              onPress={handleRedo}
            >
              <ArrowUturnRightIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>

        {/* Center: Zoom */}
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            radius="none"
            size="sm"
            variant="light"
            onPress={zoomOut}
          >
            <MinusIcon className="w-4 h-4" />
          </Button>
          <span className="text-xs font-mono w-12 text-center">
            {Math.round(canvasZoom * 100)}%
          </span>
          <Button
            isIconOnly
            radius="none"
            size="sm"
            variant="light"
            onPress={zoomIn}
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
          <Tooltip content="Fit to View">
            <Button
              isIconOnly
              radius="none"
              size="sm"
              variant="light"
              onPress={fitToView}
            >
              <ArrowsPointingInIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Reset View">
            <Button
              isIconOnly
              radius="none"
              size="sm"
              variant="light"
              onPress={resetView}
            >
              <ViewfinderCircleIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button
                className="text-xs"
                radius="none"
                size="sm"
                variant="flat"
              >
                {canvasSize.width}×{canvasSize.height}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <div className="space-y-1">
                <p className="text-xs font-display font-light tracking-normal text-default-500 pb-1">
                  Canvas Size
                </p>
                {CANVAS_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    className="w-full justify-start text-xs"
                    radius="none"
                    size="sm"
                    variant="light"
                    onPress={() =>
                      setCanvasSize({
                        width: preset.width,
                        height: preset.height,
                      })
                    }
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Background colour picker */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button
                isIconOnly
                className="border border-default-300 overflow-hidden"
                radius="none"
                size="sm"
                title="Canvas Background"
                variant="flat"
              >
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      canvasBgOpacity === 0
                        ? "repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px"
                        : hexToRgba(canvasBgColor, canvasBgOpacity),
                  }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 w-52">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                  Background
                </p>

                {/* Preset swatches */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    "#ffffff",
                    "#000000",
                    "#f5f5f5",
                    "#fdf6e3",
                    "#fce7f3",
                    "#eff6ff",
                    "#f0fdf4",
                    "#fef9c3",
                  ].map((c) => (
                    <button
                      key={c}
                      className={`w-6 h-6 border-2 transition-transform hover:scale-110 ${
                        canvasBgColor === c && canvasBgOpacity > 0
                          ? "border-primary"
                          : "border-default-200"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                      onClick={() => {
                        setCanvasBgColor(c);
                        if (canvasBgOpacity === 0) setCanvasBgOpacity(1);
                      }}
                    />
                  ))}
                  {/* Transparent swatch */}
                  <button
                    className={`w-6 h-6 border-2 transition-transform hover:scale-110 ${
                      canvasBgOpacity === 0
                        ? "border-primary"
                        : "border-default-200"
                    }`}
                    style={{
                      background:
                        "repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px",
                    }}
                    title="Transparent"
                    onClick={() => setCanvasBgOpacity(0)}
                  />
                </div>

                {/* Custom colour input */}
                <div className="flex items-center gap-2">
                  <input
                    className="w-8 h-8 cursor-pointer border border-default-200 p-0.5 bg-transparent rounded-none"
                    style={{ WebkitAppearance: "none" } as React.CSSProperties}
                    type="color"
                    value={canvasBgColor}
                    onChange={(e) => {
                      setCanvasBgColor(e.target.value);
                      if (canvasBgOpacity === 0) setCanvasBgOpacity(1);
                    }}
                  />
                  <span className="text-[11px] font-mono text-default-500 uppercase">
                    {canvasBgColor}
                  </span>
                </div>

                {/* Opacity slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-default-400">
                      Opacity
                    </p>
                    <span className="text-[10px] font-mono text-default-500">
                      {Math.round(canvasBgOpacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    className="max-w-full"
                    maxValue={1}
                    minValue={0}
                    size="sm"
                    step={0.01}
                    value={canvasBgOpacity}
                    onChange={(val) => setCanvasBgOpacity(val as number)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip content="Toggle Grid">
            <Button
              isIconOnly
              radius="none"
              size="sm"
              variant={showGrid ? "flat" : "light"}
              onPress={() => setShowGrid(!showGrid)}
            >
              <Square2StackIcon className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Clear Canvas">
            <Button
              isIconOnly
              color="danger"
              isDisabled={canvasItems.length === 0}
              radius="none"
              size="sm"
              variant="light"
              onPress={onClearOpen}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Button
            className="uppercase font-bold tracking-widest text-[10px]"
            color="primary"
            isDisabled={canvasItems.length === 0}
            isLoading={isSaving}
            radius="none"
            size="sm"
            startContent={
              !isSaving && <ArrowDownTrayIcon className="w-4 h-4" />
            }
            onPress={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR: Available Items */}
        <div className="w-28 flex-shrink-0 overflow-y-auto border-r border-default-200 bg-default-50">
          {/* Outfit items — pre-selected by the user in the form */}
          {selectedItems && selectedItems.length > 0 && (
            <>
              <p className="sticky top-0 z-10 text-[9px] text-center uppercase tracking-widest text-primary bg-primary-50 border-b border-primary-100 px-2 py-1">
                Outfit
              </p>
              <div className="p-2 space-y-2">
                {selectedItems.map((item) => (
                  <Tooltip
                    key={item.id}
                    content={item.name || "Add to canvas"}
                    placement="right"
                  >
                    <div
                      className="aspect-square bg-white border-2 border-primary/20 cursor-pointer hover:border-primary hover:shadow-sm transition-all p-1"
                      role="button"
                      tabIndex={0}
                      onClick={() => addToCanvas(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") addToCanvas(item);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.name || "Item"}
                        className="w-full h-full object-contain"
                        src={item.imageUrl || ""}
                      />
                    </div>
                  </Tooltip>
                ))}
              </div>
            </>
          )}

          {/* Rest of wardrobe */}
          {items.length > 0 && (
            <>
              <p className="sticky top-0 z-10 text-[9px] text-center uppercase tracking-widest text-default-400 bg-default-50 border-b border-default-200 px-2 py-1">
                {selectedItems && selectedItems.length > 0 ? "More" : "Items"}
              </p>
              <div className="p-2 space-y-2">
                {items.map((item) => (
                  <Tooltip
                    key={item.id}
                    content={item.name || "Add to canvas"}
                    placement="right"
                  >
                    <div
                      className="aspect-square bg-white border border-default-200 cursor-pointer hover:border-primary hover:shadow-sm transition-all p-1"
                      role="button"
                      tabIndex={0}
                      onClick={() => addToCanvas(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") addToCanvas(item);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.name || "Item"}
                        className="w-full h-full object-contain"
                        src={item.imageUrl || ""}
                      />
                    </div>
                  </Tooltip>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {(!selectedItems || selectedItems.length === 0) && items.length === 0 && (
            <p className="text-[9px] text-center uppercase tracking-widest text-default-400 p-4">
              No items
            </p>
          )}
        </div>

        {/* CANVAS AREA */}
        <div
          ref={canvasContainerRef}
          className={`flex-1 overflow-hidden bg-default-100 relative ${toolMode === "pan" || isPanning ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
          role="presentation"
          onMouseDown={handleCanvasMouseDown}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            }}
          >
            <div
              ref={canvasRef}
              className="relative shadow-xl"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                transform: `scale(${canvasZoom})`,
                transformOrigin: "center center",
                backgroundImage: showGrid
                  ? `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`
                  : "none",
                backgroundSize: showGrid
                  ? `${gridSize}px ${gridSize}px`
                  : "auto",
                backgroundColor: hexToRgba(canvasBgColor, canvasBgOpacity),
              }}
            >
              {canvasItems.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-default-300 pointer-events-none">
                  <ArrowsPointingOutIcon className="w-16 h-16 mb-3 opacity-30" />
                  <span className="uppercase tracking-widest text-xs font-bold">
                    Click items to add
                  </span>
                </div>
              )}

              {canvasItems
                .filter((item) => item.visible)
                .map((item) => (
                  <Rnd
                    key={item.uniqueId}
                    bounds="parent"
                    className={`${selectedId === item.uniqueId ? "ring-2 ring-primary ring-offset-1" : ""} ${item.locked ? "cursor-not-allowed" : ""}`}
                    disableDragging={item.locked || toolMode !== "select"}
                    enableResizing={
                      selectedId === item.uniqueId && !item.locked
                        ? {
                            top: true,
                            right: true,
                            bottom: true,
                            left: true,
                            topRight: true,
                            bottomRight: true,
                            bottomLeft: true,
                            topLeft: true,
                          }
                        : false
                    }
                    lockAspectRatio={true}
                    position={{ x: item.x, y: item.y }}
                    size={{ width: item.width, height: item.height }}
                    style={{ zIndex: item.zIndex, opacity: item.opacity }}
                    onDragStop={(_e, d) =>
                      updateItem(item.uniqueId, {
                        x: snapValue(d.x),
                        y: snapValue(d.y),
                      })
                    }
                    onMouseDown={() => {
                      if (toolMode === "select" && !item.locked)
                        bringToFront(item.uniqueId);
                    }}
                    onResizeStop={(_e, _dir, ref, _delta, position) =>
                      updateItem(item.uniqueId, {
                        width: snapValue(parseInt(ref.style.width)),
                        height: snapValue(parseInt(ref.style.height)),
                        x: snapValue(position.x),
                        y: snapValue(position.y),
                      })
                    }
                  >
                    <div
                      className="w-full h-full relative overflow-hidden"
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="collage-item"
                        className="pointer-events-none"
                        crossOrigin={item.corsEnabled ? "anonymous" : undefined}
                        src={item.imageUrl}
                        style={getImageStyle(item)}
                      />

                      {selectedId === item.uniqueId && !item.locked && (
                        <>
                          <button
                            className="absolute -top-3 -right-3 bg-danger text-white rounded-full p-1 shadow-md z-50 hover:scale-110 transition-transform"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              removeItem(item.uniqueId);
                            }}
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                          <button
                            className="absolute -top-3 -left-3 bg-primary text-white rounded-full p-1 shadow-md z-50 hover:scale-110 transition-transform"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              crop.openCropModal(item);
                            }}
                          >
                            <ScissorsIcon className="w-3 h-3" />
                          </button>
                          <button
                            className="absolute -bottom-3 -left-3 bg-secondary text-white rounded-full p-1 shadow-md z-50 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={removingBgId === item.uniqueId}
                            title="Remove background"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleRemoveBg(item.uniqueId);
                            }}
                          >
                            {removingBgId === item.uniqueId ? (
                              <span className="w-3 h-3 block animate-spin border border-white border-t-transparent rounded-full" />
                            ) : (
                              <SparklesIcon className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}

                      {item.locked && (
                        <div className="absolute top-1 right-1 bg-black/50 text-white rounded p-0.5">
                          <LockClosedIcon className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </Rnd>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Item Properties */}
        {selectedItem && (
          <div className="w-52 flex-shrink-0 overflow-y-auto border-l border-default-200 bg-default-50 p-3 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-default-400 mb-2">
                Selected Item
              </p>
              <p className="text-sm font-medium truncate">
                {selectedItem.name || "Unnamed"}
              </p>
            </div>

            <Divider />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-default-400">
                Actions
              </p>
              <div className="grid grid-cols-4 gap-1">
                <Tooltip content="Crop">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => crop.openCropModal(selectedItem)}
                  >
                    <ScissorsIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Duplicate">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => duplicateItem(selectedItem.uniqueId)}
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content={selectedItem.locked ? "Unlock" : "Lock"}>
                  <Button
                    isIconOnly
                    color={selectedItem.locked ? "warning" : "default"}
                    radius="none"
                    size="sm"
                    variant={selectedItem.locked ? "solid" : "flat"}
                    onPress={() =>
                      updateItem(selectedItem.uniqueId, {
                        locked: !selectedItem.locked,
                      })
                    }
                  >
                    {selectedItem.locked ? (
                      <LockClosedIcon className="w-4 h-4" />
                    ) : (
                      <LockOpenIcon className="w-4 h-4" />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip content={selectedItem.visible ? "Hide" : "Show"}>
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      updateItem(selectedItem.uniqueId, {
                        visible: !selectedItem.visible,
                      })
                    }
                  >
                    {selectedItem.visible ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <EyeSlashIcon className="w-4 h-4" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-default-400">
                Layer
              </p>
              <div className="flex gap-1">
                <Tooltip content="Bring Forward">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => moveLayerUp(selectedItem.uniqueId)}
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Send Backward">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => moveLayerDown(selectedItem.uniqueId)}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Bring to Front">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => bringToFront(selectedItem.uniqueId)}
                  >
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Send to Back">
                  <Button
                    isIconOnly
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={() => sendToBack(selectedItem.uniqueId)}
                  >
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            <Divider />

            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-[10px] uppercase tracking-widest text-default-400">
                  Opacity
                </p>
                <span className="text-[10px] text-default-500">
                  {Math.round(selectedItem.opacity * 100)}%
                </span>
              </div>
              <Slider
                className="max-w-full"
                maxValue={1}
                minValue={0.1}
                size="sm"
                step={0.05}
                value={selectedItem.opacity}
                onChange={(val) =>
                  updateItem(
                    selectedItem.uniqueId,
                    { opacity: val as number },
                    false,
                  )
                }
                onChangeEnd={(val) =>
                  updateItem(selectedItem.uniqueId, { opacity: val as number })
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-default-400">
                Flip
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-[10px]"
                  color={selectedItem.flipX ? "primary" : "default"}
                  radius="none"
                  size="sm"
                  variant={selectedItem.flipX ? "solid" : "flat"}
                  onPress={() =>
                    updateItem(selectedItem.uniqueId, {
                      flipX: !selectedItem.flipX,
                    })
                  }
                >
                  Horizontal
                </Button>
                <Button
                  className="flex-1 text-[10px]"
                  color={selectedItem.flipY ? "primary" : "default"}
                  radius="none"
                  size="sm"
                  variant={selectedItem.flipY ? "solid" : "flat"}
                  onPress={() =>
                    updateItem(selectedItem.uniqueId, {
                      flipY: !selectedItem.flipY,
                    })
                  }
                >
                  Vertical
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-[10px] uppercase tracking-widest text-default-400">
                  Rotation
                </p>
                <span className="text-[10px] text-default-500">
                  {Math.round(selectedItem.rotation)}°
                </span>
              </div>
              <Slider
                className="max-w-full"
                maxValue={180}
                minValue={-180}
                size="sm"
                step={1}
                value={selectedItem.rotation}
                onChange={(val) =>
                  updateItem(
                    selectedItem.uniqueId,
                    { rotation: val as number },
                    false,
                  )
                }
                onChangeEnd={(val) =>
                  updateItem(selectedItem.uniqueId, {
                    rotation: val as number,
                  })
                }
              />
              <Button
                fullWidth
                radius="none"
                size="sm"
                variant="flat"
                onPress={() =>
                  updateItem(selectedItem.uniqueId, { rotation: 0 })
                }
              >
                Reset Rotation
              </Button>
            </div>

            <Divider />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-default-400">
                Background
              </p>
              <Button
                fullWidth
                color="secondary"
                isLoading={removingBgId === selectedItem.uniqueId}
                radius="none"
                size="sm"
                startContent={
                  removingBgId !== selectedItem.uniqueId && (
                    <SparklesIcon className="w-4 h-4" />
                  )
                }
                variant="flat"
                onPress={() => handleRemoveBg(selectedItem.uniqueId)}
              >
                Remove Background
              </Button>
            </div>

            <Divider />

            <Button
              fullWidth
              color="danger"
              radius="none"
              size="sm"
              startContent={<TrashIcon className="w-4 h-4" />}
              variant="flat"
              onPress={() => removeItem(selectedItem.uniqueId)}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {/* CROP MODAL */}
      <Modal
        isOpen={crop.isOpen}
        radius="none"
        scrollBehavior="inside"
        size="3xl"
        onClose={crop.closeCropModal}
      >
        <ModalContent>
          <ModalHeader className="uppercase tracking-widest font-bold text-sm">
            Crop Image
          </ModalHeader>
          <ModalBody>
            {crop.cropTarget && crop.cropSelection && (
              <div className="relative bg-default-100 flex items-center justify-center p-4 min-h-[400px]">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={crop.cropImageRef}
                    alt="Crop preview"
                    className="max-w-full max-h-[400px] object-contain"
                    crossOrigin="anonymous"
                    src={crop.cropTarget.imageUrl}
                    style={{ opacity: 0.5 }}
                  />
                  {crop.cropImageRef.current && (
                    <div
                      className="absolute border-2 border-primary bg-transparent cursor-move"
                      role="presentation"
                      style={{
                        left: `${(crop.cropSelection.x / crop.cropTarget.naturalWidth) * 100}%`,
                        top: `${(crop.cropSelection.y / crop.cropTarget.naturalHeight) * 100}%`,
                        width: `${(crop.cropSelection.width / crop.cropTarget.naturalWidth) * 100}%`,
                        height: `${(crop.cropSelection.height / crop.cropTarget.naturalHeight) * 100}%`,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                      }}
                      onMouseDown={(e) => crop.handleCropMouseDown(e, "move")}
                    >
                      {["nw", "ne", "sw", "se"].map((handle) => (
                        <div
                          key={handle}
                          className={`absolute w-4 h-4 bg-white border-2 border-primary cursor-${handle === "nw" || handle === "se" ? "nwse" : "nesw"}-resize`}
                          role="presentation"
                          style={{
                            top: handle.includes("n") ? -8 : "auto",
                            bottom: handle.includes("s") ? -8 : "auto",
                            left: handle.includes("w") ? -8 : "auto",
                            right: handle.includes("e") ? -8 : "auto",
                          }}
                          onMouseDown={(e) =>
                            crop.handleCropMouseDown(e, "resize", handle)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <div className="text-xs text-default-500">
                {crop.cropSelection && (
                  <span>
                    {Math.round(crop.cropSelection.width)} ×{" "}
                    {Math.round(crop.cropSelection.height)} px
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  radius="none"
                  size="sm"
                  variant="flat"
                  onPress={crop.resetCrop}
                >
                  Reset
                </Button>
                {crop.cropTarget?.cropData && (
                  <Button
                    color="warning"
                    radius="none"
                    size="sm"
                    variant="flat"
                    onPress={crop.removeCrop}
                  >
                    Remove Crop
                  </Button>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button radius="none" variant="light" onPress={crop.closeCropModal}>
              Cancel
            </Button>
            <Button
              color="primary"
              radius="none"
              startContent={<CheckIcon className="w-4 h-4" />}
              onPress={crop.applyCrop}
            >
              Apply Crop
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        confirmLabel="Clear"
        isOpen={isClearOpen}
        message="Clear all items from canvas? This cannot be undone."
        title="Clear Canvas"
        onClose={onClearClose}
        onConfirm={() => {
          clearCanvas(() => true);
          onClearClose();
        }}
      />
    </div>
  );
}
