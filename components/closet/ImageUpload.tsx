"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Tooltip, Input } from "@heroui/react";
import {
  SparklesIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  LinkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

import { useUser } from "@/lib/contexts/UserContext";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: "clothes" | "outfits" | "profile" | "profile_covers";
  label?: string;
  maxSize?: number;
  showRemoveBackground?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "clothes",
  label = "Upload Image",
  maxSize = 5,
  showRemoveBackground = true,
  className = "h-64",
}: ImageUploadProps) {
  const router = useRouter();
  const { isPremium } = useUser();
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WEBP, or GIF image");

      return;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);

      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setCurrentFile(file);
    await uploadFile(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    // Basic image URL validation
    if (!urlInput.match(/^https?:\/\/.+/)) {
      setError("Please enter a valid URL (http/https)");

      return;
    }

    setError("");
    setPreview(urlInput);
    onChange(urlInput);
    setUrlInput(""); // Clear input after setting
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(value);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentFile && !preview) return;

    setRemovingBg(true);
    setError("");

    try {
      const formData = new FormData();

      if (currentFile) {
        const arrayBuffer = await currentFile.arrayBuffer();
        let contentType = currentFile.type;

        // Fallback content type detection
        if (!contentType || contentType === "application/octet-stream") {
          const nameLower = currentFile.name.toLowerCase();

          if (nameLower.endsWith(".png")) contentType = "image/png";
          else if (nameLower.endsWith(".webp")) contentType = "image/webp";
          else contentType = "image/jpeg";
        }

        const blob = new Blob([arrayBuffer], { type: contentType });
        const extension = contentType.split("/")[1] || "jpg";

        formData.append("file", blob, `image.${extension}`);
      } else if (preview) {
        // If preview is a URL (not base64)
        if (!preview.startsWith("data:")) {
          formData.append("imageUrl", preview);
        } else {
          // Convert base64 to blob
          const response = await fetch(preview);
          const blob = await response.blob();
          const contentType = blob.type || "image/png";
          const extension = contentType.split("/")[1] || "png";
          const properBlob = new Blob([await blob.arrayBuffer()], {
            type: contentType,
          });

          formData.append("file", properBlob, `image.${extension}`);
        }
      }

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || "Background removal failed");
      }

      const data = await response.json();

      setPreview(data.image);

      const base64Response = await fetch(data.image);
      const blob = await base64Response.blob();
      const processedFile = new File([blob], "image-no-bg.png", {
        type: "image/png",
      });

      setCurrentFile(processedFile);
      await uploadFile(processedFile);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Background removal failed",
      );
    } finally {
      setRemovingBg(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    setCurrentFile(null);
    onChange("");
    setError("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`space-y-3 ${className.includes("h-full") ? "h-full flex flex-col" : ""}`}
    >
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {/* Toggle Mode only visible if no image selected */}
        {!preview && (
          <div className="flex bg-default-100 rounded-lg p-1 gap-1">
            <button
              className={`p-1.5 rounded-md transition-all ${uploadMode === "file" ? "bg-background shadow-sm text-foreground" : "text-default-400 hover:text-default-600"}`}
              title="Upload File"
              onClick={() => setUploadMode("file")}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-all ${uploadMode === "url" ? "bg-background shadow-sm text-foreground" : "text-default-400 hover:text-default-600"}`}
              title="Paste URL"
              onClick={() => setUploadMode("url")}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {preview ? (
        <div
          className={`relative w-full ${className} overflow-hidden border-2 border-default-200 bg-[url('/images/transparent-grid.png')] bg-repeat rounded-lg group`}
        >
          <Image
            fill
            unoptimized
            alt="Preview"
            className="object-contain"
            src={preview}
          />

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Remove Background Button */}
            {showRemoveBackground && folder === "clothes" && (
              <Tooltip
                content={isPremium ? "Remove background" : "Upgrade to Premium"}
                placement="bottom"
              >
                <span>
                  <Button
                    isIconOnly
                    className={`bg-background/90 backdrop-blur-sm ${!isPremium ? "opacity-50 cursor-not-allowed" : ""}`}
                    isDisabled={!isPremium || uploading || removingBg}
                    isLoading={removingBg}
                    size="sm"
                    variant="flat"
                    onPress={isPremium ? handleRemoveBackground : undefined}
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Remove Image Button */}
            <Button
              isIconOnly
              className="bg-background/90 backdrop-blur-sm"
              color="danger"
              isDisabled={uploading || removingBg}
              size="sm"
              variant="flat"
              onPress={handleRemove}
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Premium Badge for non-premium users */}
          {showRemoveBackground && folder === "clothes" && !isPremium && (
            <div className="absolute bottom-2 left-2 z-10">
              <Tooltip content="Upgrade to remove backgrounds">
                <Button
                  className="bg-background/90 backdrop-blur-sm text-[10px] uppercase tracking-widest font-bold"
                  size="sm"
                  startContent={<SparklesIcon className="w-3 h-3" />}
                  variant="flat"
                  onPress={() => router.push("/pricing")}
                >
                  Magic Edit
                </Button>
              </Tooltip>
            </div>
          )}

          {/* Loading Overlay */}
          {(uploading || removingBg) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
                <p className="text-xs text-default-600 uppercase tracking-widest font-bold">
                  {removingBg ? "Removing Background..." : "Uploading..."}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // EMPTY STATE CONTAINER
        <div
          className={`w-full ${className}border-2 border-dashed rounded-lg transition-all overflow-hidden ${
            uploadMode === "file"
              ? "hover:border-foreground hover:bg-default-50 cursor-pointer border-default-300"
              : "border-default-300 bg-background"
          }`}
        >
          {/* MODE 1: FILE UPLOAD */}
          {uploadMode === "file" && (
            <div
              className="w-full h-full flex flex-col items-center justify-center"
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (!uploading) fileInputRef.current?.click();
                }
              }}
            >
              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm text-default-600 font-medium">
                    Uploading...
                  </p>
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-12 h-12 text-default-400 mb-3" />
                  <p className="text-sm text-default-600 font-bold uppercase tracking-widest">
                    Click to upload
                  </p>
                  <p className="text-xs text-default-400 mt-2">
                    PNG, JPG, WEBP, GIF up to {maxSize}MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* MODE 2: URL INPUT */}
          {uploadMode === "url" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
              <div className="text-center space-y-2 w-full max-w-xs">
                <div className="bg-default-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <LinkIcon className="w-6 h-6 text-default-500" />
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-default-600">
                  Add from URL
                </p>
                <div className="flex gap-2">
                  <Input
                    classNames={{ inputWrapper: "bg-background" }}
                    placeholder="https://example.com/image.png"
                    radius="none"
                    size="sm"
                    value={urlInput}
                    variant="bordered"
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    isDisabled={!urlInput}
                    radius="none"
                    size="sm"
                    onPress={handleUrlSubmit}
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-default-400">
                  Paste a direct link to an image file.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        type="file"
        onChange={handleFileSelect}
      />

      {error && (
        <p className="text-xs font-medium text-danger animate-pulse">{error}</p>
      )}
    </div>
  );
}
