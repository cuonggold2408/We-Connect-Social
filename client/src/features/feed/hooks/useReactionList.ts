import { useInfiniteQuery } from "@tanstack/react-query";
import { reactionsApi } from "@/shared/api/reactions.api";
import type { ReactionType } from "@/features/feed/types/post";

const REACTION_LIST_LIMIT = 3;

export function useReactionList(
  postId: string,
  type?: ReactionType,
  enabled = false, // khi nào enable thì mới fetch dữ liệu
) {
  return useInfiniteQuery({
    queryKey: ["reactions", postId, type ?? "ALL"],
    queryFn: ({ pageParam }) =>
      reactionsApi.getAll(postId, {
        cursor: pageParam,
        limit: REACTION_LIST_LIMIT,
        type,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled,
  });
}
