"use client";

import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";

export const usePostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => postsApi.getPostById(postId),
    enabled: !!postId,
  });
};
