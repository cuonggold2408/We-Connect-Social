"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";
import { feedKeys } from "@/features/feed/constants/queryKeys";

export const usePostFeed = () => {
  return useInfiniteQuery({
    queryKey: feedKeys.all,
    queryFn: ({ pageParam }) => postsApi.getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 1000 * 60,
  });
};
