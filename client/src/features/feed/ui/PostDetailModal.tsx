"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { usePostDetail } from "@/features/feed/hooks/usePostDetail";
import { CommentDialog } from "@/features/feed/ui/comment/CommentDialog";

const PostDetailModal = () => {
  const { id } = useParams<{ id: string }>() as { id: string };
  const searchParams = useSearchParams();
  const highlightCommentId = searchParams?.get("commentId");
  const router = useRouter();

  const { data: post, isLoading, isError } = usePostDetail(id);

  const handleClose = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="flex max-h-[85vh] max-w-lg items-center justify-center p-8">
          <DialogTitle className="sr-only">Đang tải bài viết</DialogTitle>
          <Loader2 className="text-blue-primary h-8 w-8 animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !post) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-8 text-center">
          <DialogTitle className="sr-only">Lỗi</DialogTitle>
          <p className="text-gray-500">
            Bài viết không tồn tại hoặc đã bị xoá.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <CommentDialog
      post={post}
      open
      onOpenChange={handleClose}
      highlightCommentId={highlightCommentId}
    />
  );
};

export default PostDetailModal;
