import { useInfiniteQuery } from "@tanstack/react-query";
import { reactionsApi } from "@/shared/api/reactions.api";
import { commentReactionsApi } from "@/shared/api/comment-reactions.api";
import type { ReactionType } from "@/features/feed/types/post";

const REACTION_LIST_LIMIT = 3;

export function useReactionList(
  targetType: "post" | "comment",
  targetId: string,
  type?: ReactionType,
  enabled = false, // Khi nào enable thì mới fetch dữ liệu
) {
  return useInfiniteQuery({
    queryKey: [
      targetType === "post" ? "reactions" : "commentReactions",
      targetId,
      type ?? "ALL",
    ],
    queryFn: ({ pageParam }) => {
      const fetchFn =
        targetType === "post"
          ? reactionsApi.getAll
          : commentReactionsApi.getAll;
      return fetchFn(targetId, {
        cursor: pageParam,
        limit: REACTION_LIST_LIMIT,
        type,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled,
  });
}
