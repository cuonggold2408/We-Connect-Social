"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";

export const usePostFeed = () => {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => postsApi.getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 1000 * 60,
  });
};
