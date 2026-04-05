import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";

export function useProfilePhotos(userId: string) {
  return useQuery({
    queryKey: profileKeys.photos(userId),
    queryFn: () => postsApi.getPhotosByUser(userId, 9),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
