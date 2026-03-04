export interface ClothingItem {
  id: string;
  name?: string;
  imageUrl?: string;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasItem extends ClothingItem {
  uniqueId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  flipX: boolean;
  flipY: boolean;
  cropData?: CropData;
  naturalWidth: number;
  naturalHeight: number;
}

export type ToolMode = "select" | "pan";

export interface CanvasSize {
  width: number;
  height: number;
}

export const CANVAS_PRESETS: Array<{
  name: string;
  width: number;
  height: number;
}> = [
  { name: "Portrait (3:4)", width: 600, height: 800 },
  { name: "Square (1:1)", width: 700, height: 700 },
  { name: "Landscape (4:3)", width: 800, height: 600 },
  { name: "Story (9:16)", width: 450, height: 800 },
  { name: "Wide (16:9)", width: 800, height: 450 },
];
