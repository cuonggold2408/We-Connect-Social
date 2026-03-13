"use client";

import { X, RotateCcw, Loader2 } from "lucide-react";
import type { ImageFile } from "@/features/feed/hooks/useImageUpload";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";

interface ImagePreviewGridProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
}

const ImagePreviewGrid = ({ images, onRemove }: ImagePreviewGridProps) => {
  if (images.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 p-2">
      <div
        className={cn(
          "grid gap-2",
          images.length === 1 && "grid-cols-1",
          images.length === 2 && "grid-cols-2",
          images.length >= 3 && "grid-cols-3",
        )}
      >
        {images.map((img) => (
          <div key={img.id} className="group relative">
            <div
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg bg-gray-100",
                images.length === 1 && "aspect-video",
              )}
            >
              <Image
                src={img.preview}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
                loading="lazy"
              />

              {img.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="mt-1 text-xs font-medium text-white">
                    {img.progress}%
                  </span>
                </div>
              )}

              {img.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/40">
                  <RotateCcw className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {img.status !== "uploading" && (
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePreviewGrid;
