"use client";

import { useCallback, useEffect } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import type { PostImage } from "@/features/feed/types/post";

interface ImageLightBoxProps {
  images: PostImage[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightBox({
  images,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}: ImageLightBoxProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) onIndexChange(currentIndex - 1);
  }, [hasPrev, currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (hasNext) onIndexChange(currentIndex + 1);
  }, [hasNext, currentIndex, onIndexChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrev, goToNext]);

  if (images.length === 0) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/90" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          aria-describedby={undefined}
          onClick={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">
            Xem ảnh {currentIndex + 1} / {images.length}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close className="absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70">
            <X className="h-5 w-5" />
            <span className="sr-only">Đóng</span>
          </DialogPrimitive.Close>

          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-7 w-7" />
              <span className="sr-only">Ảnh trước</span>
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-7 w-7" />
              <span className="sr-only">Ảnh sau</span>
            </button>
          )}

          <div
            className="relative h-[85vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex].imageUrl}
              alt={`Ảnh ${currentIndex + 1} / ${images.length}`}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
