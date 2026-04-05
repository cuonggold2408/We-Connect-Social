"use client";

import { useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import PostCard from "@/features/feed/ui/PostCard";
import { useProfilePosts } from "@/features/profile/hooks/useProfilePosts";

interface ProfilePostListProps {
  userId: string;
}

export function ProfilePostList({ userId }: ProfilePostListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProfilePosts(userId);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (isFetchingNextPage || !node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "0px 0px 300px 0px" },
      );

      observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-blue-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-gray-500">
        Không thể tải bài viết. Vui lòng thử lại
      </div>
    );
  }

  const seen = new Set<string>();
  const posts =
    data?.pages
      .flatMap((page) => page.data)
      .filter((post) => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      }) ?? [];

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-400">Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-blue-primary h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
