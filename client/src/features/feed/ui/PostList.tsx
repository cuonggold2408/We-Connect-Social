"use client";

import { useRef, useCallback } from "react";
import PostCard from "./PostCard";
import { Loader2 } from "lucide-react";
import { usePostFeed } from "@/features/feed/hooks/usePostFeed";

const PostList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = usePostFeed();

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
        {
          rootMargin: "0px 0px 300px 0px",
        },
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
        <p className="text-lg text-gray-400">Chưa có bài viết nào!</p>
        <p className="mt-1 text-sm text-gray-400">
          Bắt đầu đăng bài viết đầu tiên nào!
        </p>
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
};

export default PostList;
