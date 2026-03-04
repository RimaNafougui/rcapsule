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
} from "@heroicons/react/24/outline";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { CANVAS_PRESETS } from "@/lib/hooks/collage/types";
import { useCollageHistory } from "@/lib/hooks/collage/useCollageHistory";
import { useCollageItems } from "@/lib/hooks/collage/useCollageItems";
import { useCollagePanZoom } from "@/lib/hooks/collage/useCollagePanZoom";
import { useCropModal } from "@/lib/hooks/collage/useCropModal";

interface CollageBuilderProps {
  items: ClothingItem[];
  onSave: (file: File) => Promise<void>;
}

export default function CollageBuilder({ items, onSave }: CollageBuilderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
  const {
    isOpen: isClearOpen,
    onOpen: onClearOpen,
    onClose: onClearClose,
  } = useDisclosure();
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, _setSnapToGrid] = useState(false);
  const gridSize = 20;

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
        backgroundColor: "#ffffff",
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
                <p className="text-xs font-bold uppercase tracking-widest text-default-500 pb-1">
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
        <div className="w-28 flex-shrink-0 overflow-y-auto border-r border-default-200 p-2 space-y-2 bg-default-50">
          <p className="text-[9px] text-center uppercase tracking-widest text-default-400 mb-2">
            Click to Add
          </p>
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
                  if (e.key === "Enter" || e.key === " ") {
                    addToCanvas(item);
                  }
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
              className="relative bg-white shadow-xl"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                transform: `scale(${canvasZoom})`,
                transformOrigin: "center center",
                backgroundImage: showGrid
                  ? `linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)`
                  : undefined,
                backgroundSize: showGrid
                  ? `${gridSize}px ${gridSize}px`
                  : undefined,
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
                        crossOrigin="anonymous"
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
