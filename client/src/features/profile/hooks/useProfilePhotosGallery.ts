import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";

const GALLERY_LIMIT = 200;

export function useProfilePhotosGallery(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.photosGallery(userId),
    queryFn: () => postsApi.getPhotosByUser(userId, GALLERY_LIMIT),
    enabled: !!userId && enabled,
    staleTime: 1000 * 60,
  });
}
