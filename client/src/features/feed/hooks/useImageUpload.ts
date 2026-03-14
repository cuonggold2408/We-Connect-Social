import { useState, useCallback, useRef } from "react";
import { uploadApi } from "@/shared/api/upload.api";
import { toast } from "sonner";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/shared/helpers/constants";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  objectUrl?: string;
}

export function useImageUpload() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const remaining = MAX_FILES - images.length;

      if (remaining <= 0) {
        toast.error(`Tối đa ${MAX_FILES} ảnh`);
        return;
      }

      const validFiles = files.slice(0, remaining).filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Định dạng không hỗ trợ`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: Vượt quá ${MAX_FILE_SIZE}MB`);
          return false;
        }
        return true;
      });

      const newImages: ImageFile[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending",
      }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const uploadAll = useCallback(async (): Promise<string[]> => {
    const pending = images.filter((img) => img.status === "pending");
    if (pending.length === 0) {
      return images
        .filter((img) => img.status === "done" && img.objectUrl)
        .map((img) => img.objectUrl!);
    }

    const metadata = pending.map((img) => ({
      mimeType: img.file.type,
      fileSize: img.file.size,
    }));

    const presigned = await uploadApi.getPresignedUrls(metadata);

    setImages((prev) =>
      prev.map((img) =>
        pending.some((p) => p.id === img.id)
          ? { ...img, status: "uploading" as const }
          : img,
      ),
    );

    const results = await Promise.allSettled(
      pending.map(async (img, i) => {
        const { uploadUrl, objectUrl } = presigned[i];

        await uploadApi.uploadFileToS3(uploadUrl, img.file, (percent) => {
          setImages((prev) =>
            prev.map((item) =>
              item.id === img.id ? { ...item, progress: percent } : item,
            ),
          );
        });

        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, status: "done" as const, progress: 100, objectUrl }
              : item,
          ),
        );

        return objectUrl;
      }),
    );

    const successKeys = presigned
      .filter((_, i) => results[i].status === "fulfilled")
      .map((p) => p.key);
    if (successKeys.length > 0) {
      await uploadApi.confirmUploads(successKeys);
    }

    const failedIds: string[] = [];
    const urls: string[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        urls.push(result.value);
      } else {
        failedIds.push(pending[i].id);
      }
    });

    if (failedIds.length > 0) {
      setImages((prev) =>
        prev.map((img) =>
          failedIds.includes(img.id)
            ? { ...img, status: "error" as const }
            : img,
        ),
      );
      throw new Error(`${failedIds.length} ảnh upload thất bại`);
    }

    const existingUrls = images
      .filter((img) => img.status === "done" && img.objectUrl)
      .map((img) => img.objectUrl!);

    return [...existingUrls, ...urls];
  }, [images]);

  const reset = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    images,
    inputRef,
    addFiles,
    removeImage,
    uploadAll,
    reset,
    openFilePicker,
    hasImages: images.length > 0,
    isUploading: images.some((img) => img.status === "uploading"),
  };
}
