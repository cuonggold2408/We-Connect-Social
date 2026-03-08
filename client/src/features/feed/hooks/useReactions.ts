import { useQuery } from "@tanstack/react-query";
import { reactionsApi } from "@/shared/api/reactions.api";

export function usePostReactionStats(postId: string) {
  return useQuery({
    queryKey: ["post-reactions-stats", postId],
    queryFn: () => reactionsApi.getStats(postId),
  });
}
