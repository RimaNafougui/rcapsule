import type { CanvasSize } from "./types";

import { useState, useRef } from "react";

export function useCollagePanZoom(canvasSize: CanvasSize) {
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, toolMode: "select" | "pan") => {
    if (toolMode === "pan" || e.button === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;

      setCanvasZoom((prev) => Math.min(Math.max(prev + delta, 0.25), 3));
    }
  };

  const resetView = () => {
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasZoom(1);
  };

  const fitToView = () => {
    if (!containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const scaleX = (container.width - 40) / canvasSize.width;
    const scaleY = (container.height - 40) / canvasSize.height;

    setCanvasZoom(Math.min(scaleX, scaleY, 1));
    setCanvasOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => setCanvasZoom((z) => Math.min(z + 0.1, 3));
  const zoomOut = () => setCanvasZoom((z) => Math.max(z - 0.1, 0.25));

  return {
    canvasOffset,
    canvasZoom,
    isPanning,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetView,
    fitToView,
    zoomIn,
    zoomOut,
  };
}
