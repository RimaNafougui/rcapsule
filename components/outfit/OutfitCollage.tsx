"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Button, Card, CardBody, Spinner } from "@heroui/react";

interface ClothingItem {
  id: string;
  name: string;
  url: string;
  layer: number;
}

interface OutfitCollageProps {
  outfitId: string;
  outfitName?: string;
  onSave?: (imageUrl: string) => void;
  autoGenerate?: boolean;
}

type LayoutType = "grid" | "horizontal" | "vertical";

export function OutfitCollage({
  outfitId,
  outfitName,
  onSave,
  autoGenerate = false,
}: OutfitCollageProps) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [collageUrl, setCollageUrl] = useState<string>("");
  const [layout, setLayout] = useState<LayoutType>("grid");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchOutfitData();
  }, [outfitId]);

  const fetchOutfitData = async () => {
    try {
      const response = await fetch(`/api/outfits/${outfitId}/collage`);

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to fetch outfit data");
      }

      const data = await response.json();

      setItems(data.clothes || []);

      if (autoGenerate && data.clothes?.length > 0) {
        // Auto-generate after data loads
        setTimeout(() => generateCollage(data.clothes), 100);
      }
    } catch (error) {
      console.error("Error fetching outfit:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load outfit",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();

      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  };

  const generateCollage = async (itemsToUse?: ClothingItem[]) => {
    const clothingItems = itemsToUse || items;

    if (!canvasRef.current || clothingItems.length === 0) {
      toast.error("No images to generate collage");

      return;
    }

    setGenerating(true);
    setCollageUrl(""); // Clear previous collage

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Canvas dimensions
      const collageWidth = 1200;
      const collageHeight = 1200;

      canvas.width = collageWidth;
      canvas.height = collageHeight;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, collageWidth, collageHeight);

      // Load all images
      const images = await Promise.all(
        clothingItems.map((item) => loadImage(item.url)),
      );

      // Calculate layout
      let cols = 2;
      let rows = 2;

      if (layout === "grid") {
        cols = Math.ceil(Math.sqrt(clothingItems.length));
        rows = Math.ceil(clothingItems.length / cols);
      } else if (layout === "horizontal") {
        cols = clothingItems.length;
        rows = 1;
      } else if (layout === "vertical") {
        cols = 1;
        rows = clothingItems.length;
      }

      const cellWidth = collageWidth / cols;
      const cellHeight = collageHeight / rows;
      const padding = 10;

      // Draw each image
      images.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * cellWidth;
        const y = row * cellHeight;

        // Calculate scaling to fit cell while maintaining aspect ratio
        const availableWidth = cellWidth - padding * 2;
        const availableHeight = cellHeight - padding * 2;
        const scale = Math.min(
          availableWidth / img.width,
          availableHeight / img.height,
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center in cell
        const offsetX = x + (cellWidth - scaledWidth) / 2;
        const offsetY = y + (cellHeight - scaledHeight) / 2;

        // Draw image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        // Draw subtle border around cell
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
      });

      // Add outfit name if provided
      if (outfitName) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, collageWidth, 60);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(outfitName, collageWidth / 2, 40);
      }

      // Convert to blob and upload
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            throw new Error("Failed to generate collage image");
          }

          try {
            const formData = new FormData();

            formData.append("file", blob, `outfit-${outfitId}-collage.png`);
            formData.append("folder", "outfits");

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!uploadResponse.ok) {
              const error = await uploadResponse.json();

              throw new Error(error.error || "Upload failed");
            }

            const uploadData = await uploadResponse.json();

            setCollageUrl(uploadData.url);

            // Update outfit with collage URL
            const updateResponse = await fetch(`/api/outfits/${outfitId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: uploadData.url }),
            });

            if (!updateResponse.ok) {
              throw new Error("Failed to update outfit");
            }

            if (onSave) onSave(uploadData.url);

            toast.success("Collage generated and saved!");
          } catch (error) {
            console.error("Error uploading collage:", error);
            throw error;
          }
        },
        "image/png",
        0.95,
      );
    } catch (error) {
      console.error("Error generating collage:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate collage",
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center p-8">
          <Spinner size="lg" />
          <p className="mt-4 text-default-600">Loading outfit...</p>
        </CardBody>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <p className="text-default-500">
            No clothing items with images in this outfit
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Preview Items ({items.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-default-200 bg-default-50"
              >
                <Image
                  fill
                  unoptimized
                  alt={item.name}
                  className="object-contain p-2"
                  src={item.url}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium mb-2">Layout Style</p>
          <div className="flex gap-2">
            <Button
              color={layout === "grid" ? "primary" : "default"}
              size="sm"
              variant={layout === "grid" ? "solid" : "bordered"}
              onPress={() => setLayout("grid")}
            >
              Grid
            </Button>
            <Button
              color={layout === "horizontal" ? "primary" : "default"}
              size="sm"
              variant={layout === "horizontal" ? "solid" : "bordered"}
              onPress={() => setLayout("horizontal")}
            >
              Horizontal
            </Button>
            <Button
              color={layout === "vertical" ? "primary" : "default"}
              size="sm"
              variant={layout === "vertical" ? "solid" : "bordered"}
              onPress={() => setLayout("vertical")}
            >
              Vertical
            </Button>
          </div>
        </div>

        <Button
          className="w-full"
          color="primary"
          isLoading={generating}
          size="lg"
          onPress={() => generateCollage()}
        >
          {generating ? "Generating Collage..." : "Generate Outfit Collage"}
        </Button>

        {collageUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Generated Collage:</h4>
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-success">
              <Image
                fill
                unoptimized
                alt="Generated collage"
                className="object-contain"
                src={collageUrl}
              />
            </div>
            <p className="text-xs text-success">Saved to outfit</p>
          </div>
        )}

        {/* Hidden canvas for collage generation */}
        <canvas ref={canvasRef} className="hidden" />
      </CardBody>
    </Card>
  );
}
