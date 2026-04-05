"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useProfilePhotos } from "@/features/profile/hooks/useProfilePhotos";
import { useProfilePhotosGallery } from "@/features/profile/hooks/useProfilePhotosGallery";
import { ImageLightBox } from "@/features/feed/ui/ImageLightBox";

interface ProfilePhotoGridProps {
  userId: string;
}

export function ProfilePhotoGrid({ userId }: ProfilePhotoGridProps) {
  const { data } = useProfilePhotos(userId);
  const previewPhotos = data?.data ?? [];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const { data: galleryData, isLoading: galleryLoading } =
    useProfilePhotosGallery(userId, galleryOpen);
  const allPhotos = galleryData?.data ?? previewPhotos;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback((open: boolean) => {
    if (!open) setLightboxIndex(null);
  }, []);

  const previewLightboxImages = previewPhotos.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
  }));

  const galleryLightboxImages = allPhotos.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
  }));

  const showSeeAll = previewPhotos.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Ảnh</h3>
        {showSeeAll && (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="text-blue-primary hover:text-blue-secondary shrink-0 cursor-pointer text-sm font-medium"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {previewPhotos.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {previewPhotos.map((photo, i) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-90"
              >
                <Image
                  src={photo.imageUrl}
                  alt={`Ảnh ${i + 1}`}
                  fill
                  sizes="(max-width: 450px) 33vw, 140px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <ImageLightBox
            images={previewLightboxImages}
            currentIndex={lightboxIndex ?? 0}
            open={lightboxIndex !== null && !galleryOpen}
            onOpenChange={closeLightbox}
            onIndexChange={setLightboxIndex}
          />
        </>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">
          Chưa có ảnh nào
        </p>
      )}

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-gray-100 px-4 py-3">
            <DialogTitle className="text-center text-base font-semibold">
              Ảnh
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {galleryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="text-blue-primary h-8 w-8 animate-spin" />
              </div>
            ) : allPhotos.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Chưa có ảnh nào
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 pt-3">
                {allPhotos.map((photo, i) => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-90"
                  >
                    <Image
                      src={photo.imageUrl}
                      alt={`Ảnh ${i + 1}`}
                      fill
                      sizes="(max-width: 512px) 33vw, 170px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageLightBox
        images={galleryLightboxImages}
        currentIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null && galleryOpen}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
