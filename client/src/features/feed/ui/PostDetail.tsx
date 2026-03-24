"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PostCard from "@/features/feed/ui/PostCard";
import { usePostDetail } from "@/features/feed/hooks/usePostDetail";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>() as { id: string };
  const searchParams = useSearchParams();
  const highlightCommentId = searchParams?.get("commentId");

  const { data: post, isLoading, isError } = usePostDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-blue-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">
          Bài viết không tồn tại hoặc đã bị xoá
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <PostCard
      post={post}
      defaultCommentOpen
      highlightCommentId={highlightCommentId}
    />
  );
};

export default PostDetail;
