import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadApi } from "@/shared/api/upload.api";
import { userApi } from "@/shared/api/users.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";
import { useAuthStore } from "@/shared/stores/auth.store";
import { toast } from "sonner";

type UploadTarget = "avatar" | "cover";

export function useProfileUpload(username: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File, target: UploadTarget) => {
      setIsUploading(true);
      try {
        const [presigned] = await uploadApi.getPresignedUrls(
          [{ mimeType: file.type, fileSize: file.size }],
          target,
        );

        await uploadApi.uploadFileToS3(presigned.uploadUrl, file);
        await uploadApi.confirmUploads([presigned.key]);

        if (target === "avatar") {
          const result = await userApi.updateAvatar(presigned.objectUrl);
          if (user) setUser({ ...user, avatarUrl: result.avatarUrl });
        } else {
          await userApi.updateCover(presigned.objectUrl);
        }

        queryClient.invalidateQueries({
          queryKey: profileKeys.detail(username),
        });
        toast.success(
          target === "avatar"
            ? "Cập nhật ảnh đại diện thành công"
            : "Cập nhật ảnh bìa thành công",
        );
      } catch {
        toast.error("Tải ảnh thất bại, vui lòng thử lại");
      } finally {
        setIsUploading(false);
      }
    },
    [username, queryClient, user, setUser],
  );

  return { upload, isUploading };
}
