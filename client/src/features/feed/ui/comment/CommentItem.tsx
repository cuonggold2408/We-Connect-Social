"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { timeAgo } from "@/shared/helpers/format-time";
import { useAuthStore } from "@/shared/stores/auth.store";
import {
  useReplies,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "@/features/feed/hooks/useComments";
import { CommentInput } from "@/features/feed/ui/comment/CommentInput";
import type { Comment } from "@/features/feed/types/post";
import { TwemojiText } from "@/shared/components/TwemojiText";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postAuthorId: string;
  isReply?: boolean;
}

export const CommentItem = ({
  comment,
  postId,
  postAuthorId,
  isReply = false,
}: CommentItemProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthor = user?.id === comment.author.id;
  const isPostOwner = user?.id === postAuthorId;
  const canDelete = isAuthor || isPostOwner;
  const canEdit = isAuthor;

  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    data: repliesData,
    fetchNextPage: fetchMoreReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
    isLoading: isLoadingReplies,
  } = useReplies(postId, comment.id, showReplies && !isReply);

  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const updateComment = useUpdateComment(postId);

  const replies = repliesData?.pages.flatMap((p) => p.data) ?? [];

  const handleReply = (content: string) => {
    createComment.mutate(
      { content, parentId: comment.parentId ?? comment.id },
      { onSuccess: () => setShowReplyInput(false) },
    );
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteComment.mutate(comment.id);
  };

  const handleEditSubmit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    updateComment.mutate(
      { commentId: comment.id, content: trimmed },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  };

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      const el = editTextareaRef.current;
      const len = el.value.length;
      el.selectionStart = len;
      el.selectionEnd = len;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [isEditing]);

  return (
    <div className={cn("flex gap-2", isReply && "ml-10")}>
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={comment.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-blue-primary text-xs font-bold text-white">
          {comment.author.fullname?.[0] || comment.author.username[0]}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="group/comment flex items-start gap-1">
          <div className="rounded-2xl bg-gray-100 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-gray-900">
                {comment.author.fullname || comment.author.username}
              </span>
              {comment.isPostAuthor && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                  Tác giả
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-1">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  rows={1}
                  maxLength={2000}
                  className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  }}
                />
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>Enter để lưu</span>
                  <span>·</span>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="cursor-pointer hover:underline"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <TwemojiText
                text={comment.content}
                className="text-sm whitespace-pre-wrap text-gray-800"
              />
            )}
          </div>

          {/* Edit, Delete Comment */}
          {(canEdit || canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mt-2 shrink-0 cursor-pointer rounded-full p-1 opacity-0 transition-opacity group-hover/comment:opacity-100 hover:bg-gray-200">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {!isEditing && (
          <div className="mt-0.5 flex items-center gap-3 px-2 text-[12px] text-gray-500">
            <span>{timeAgo(comment.createdAt)}</span>
            {comment.updatedAt && <span className="italic">đã chỉnh sửa</span>}
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="cursor-pointer font-semibold hover:underline"
              >
                Trả lời
              </button>
            )}
          </div>
        )}

        {!isReply && comment.replyCount > 0 && (
          <button
            onClick={() => setShowReplies((prev) => !prev)}
            className="mt-1 px-2 text-[13px] font-semibold text-blue-500 hover:underline"
          >
            {showReplies ? (
              <span className="flex cursor-pointer items-center gap-1">
                <ChevronDown className="h-4 w-4" /> Ẩn phản hồi
              </span>
            ) : (
              <span className="flex cursor-pointer items-center gap-1">
                <ChevronRight className="h-4 w-4" /> Xem {comment.replyCount}{" "}
                phản hồi
              </span>
            )}
          </button>
        )}

        {/* Danh sách replies */}
        {showReplies && !isReply && (
          <div className="mt-2 space-y-3">
            {isLoadingReplies && (
              <div className="ml-10 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải...</span>
              </div>
            )}
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                postAuthorId={postAuthorId}
                isReply
              />
            ))}
            {hasMoreReplies && (
              <button
                onClick={() => fetchMoreReplies()}
                disabled={isFetchingMoreReplies}
                className="ml-10 text-[13px] font-semibold text-blue-500 hover:underline disabled:text-gray-400"
              >
                {isFetchingMoreReplies ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Đang tải...
                  </span>
                ) : (
                  "Xem thêm phản hồi"
                )}
              </button>
            )}
          </div>
        )}

        {/* Input để trả lời */}
        {showReplyInput && !isReply && (
          <div className="mt-2 ml-10">
            <CommentInput
              onSubmit={handleReply}
              isPending={createComment.isPending}
              placeholder={`Trả lời ${comment.author.fullname || comment.author.username}...`}
              autoFocus
            />
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              className="cursor-pointer"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
