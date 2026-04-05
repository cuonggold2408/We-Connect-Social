import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";

export function useProfilePosts(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: profileKeys.posts(userId ?? ""),
    queryFn: ({ pageParam }) => postsApi.getPostsByUser(userId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
