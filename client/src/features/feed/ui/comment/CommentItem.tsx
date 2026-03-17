"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Camera,
  X,
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/components/ui/hover-card";
import { motion } from "motion/react";
import { timeAgo } from "@/shared/helpers/format-time";
import { useAuthStore } from "@/shared/stores/auth.store";
import {
  useReplies,
  useCreateComment,
  useDeleteComment,
} from "@/features/feed/hooks/useComments";
import { useEditComment } from "@/features/feed/hooks/useEditComment";
import { useCommentReaction } from "@/features/feed/hooks/useCommentReaction";
import { CommentInput } from "@/features/feed/ui/comment/CommentInput";
import { ReactionListDialog } from "@/features/feed/ui/ReactionListDialog";
import { REACTION_CONFIG } from "@/features/feed/constants/config";
import type { Comment, ReactionType } from "@/features/feed/types/post";
import { TwemojiText } from "@/shared/components/TwemojiText";
import Image from "next/image";
import { ImageLightBox } from "@/features/feed/ui/ImageLightBox";

/* ─── Action Menu ── */

interface CommentActionMenuProps {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  triggerClassName?: string;
}

function CommentActionMenu({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  triggerClassName,
}: CommentActionMenuProps) {
  if (!canEdit && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "shrink-0 cursor-pointer rounded-full p-1 hover:bg-gray-200",
            triggerClassName,
          )}
        >
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        {canEdit && (
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={onDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── CommentItem ─── */

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postAuthorId: string;
  isReply?: boolean;
  onReplyTo?: (username: string) => void;
}

export const CommentItem = ({
  comment,
  postId,
  postAuthorId,
  isReply = false,
  onReplyTo,
}: CommentItemProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replyMention, setReplyMention] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthor = user?.id === comment.author.id;
  const isPostOwner = user?.id === postAuthorId;
  const canDelete = isAuthor || isPostOwner;
  const canEdit = isAuthor;

  const {
    data: repliesData,
    fetchNextPage: fetchMoreReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
    isLoading: isLoadingReplies,
  } = useReplies(postId, comment.id, showReplies && !isReply);

  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const { toggleReaction } = useCommentReaction(
    postId,
    comment.id,
    comment.parentId,
  );

  const {
    isEditing,
    editContent,
    setEditContent,
    editImageUrl,
    editImagePreview,
    isUploading: isUploadingEditImage,
    textareaRef: editTextareaRef,
    fileInputRef,
    startEditing,
    resetEditState,
    handleEditKeyDown,
    handleImageSelect,
    removeImage,
  } = useEditComment(postId, comment);

  const isDeleting = deleteComment.isPending;
  const replies = repliesData?.pages.flatMap((p) => p.data) ?? [];
  const isImageOnly = !comment.content?.trim() && !!comment.imageUrl;

  const mentionMatch = isReply ? comment.content.match(/^@(\S+)\s/) : null;
  const displayContent = mentionMatch
    ? comment.content.slice(mentionMatch[0].length)
    : comment.content;

  const currentReaction = comment.currentUserReaction;
  const reactionDisplay = currentReaction
    ? REACTION_CONFIG[currentReaction]
    : null;
  const topReactions = comment.stats?.slice(0, 2);

  const handleReply = (content: string, imageUrl?: string) => {
    createComment.mutate(
      { content, parentId: comment.parentId ?? comment.id, imageUrl },
      {
        onSuccess: () => {
          setShowReplyInput(false);
          setReplyMention(null);
        },
      },
    );
  };

  const handleReplyToReply = (username: string) => {
    setReplyMention(username);
    setShowReplyInput(true);
    setShowReplies(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    deleteComment.mutate(comment.id);
  };

  const handleReaction = (type: ReactionType | null) => {
    setReactionOpen(false);
    toggleReaction(type);
  };

  return (
    <div
      className={cn(
        "flex gap-2",
        isReply && "ml-10",
        isDeleting && "pointer-events-none opacity-50",
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={comment.author.avatarUrl || undefined} />
        <AvatarFallback className="bg-blue-primary text-xs font-bold text-white">
          {comment.author.fullname?.[0] || comment.author.username[0]}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "group/comment flex flex-col items-start",
            comment.reactionCount > 0 && !isEditing && "mb-1.5",
          )}
        >
          <div className="flex max-w-[calc(100%-2rem)] items-center gap-2">
            <div className="relative">
              <div
                className={cn(
                  "w-fit rounded-2xl px-3 py-2",
                  !isImageOnly && "bg-gray-100",
                )}
              >
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

                    {(editImageUrl || editImagePreview) && (
                      <div className="relative my-1 inline-block">
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                          <Image
                            src={editImagePreview || editImageUrl || ""}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          {isUploadingEditImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={removeImage}
                          disabled={isUploadingEditImage}
                          className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full bg-gray-700 p-0.5 text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>Enter để lưu</span>
                        <span>·</span>
                        <button
                          onClick={resetEditState}
                          className="cursor-pointer hover:underline"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingEditImage}
                          className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-200 disabled:opacity-50"
                        >
                          <Camera className="h-4 w-4 text-gray-500" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {mentionMatch ? (
                      <p className="text-sm whitespace-pre-wrap text-gray-800">
                        <span className="font-semibold text-blue-600">
                          @{mentionMatch[1]}
                        </span>{" "}
                        <TwemojiText
                          text={displayContent}
                          as="span"
                          className="text-sm text-gray-800"
                        />
                      </p>
                    ) : (
                      <TwemojiText
                        text={comment.content}
                        className="text-sm whitespace-pre-wrap text-gray-800"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {!isEditing && !isImageOnly && (
              <CommentActionMenu
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={startEditing}
                onDelete={() => setShowDeleteConfirm(true)}
                triggerClassName="mt-2 opacity-0 transition-opacity group-hover/comment:opacity-100"
              />
            )}
          </div>

          {!isEditing && comment.imageUrl && (
            <div className="group/image relative mt-1.5 ml-1 inline-block">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block text-left"
              >
                <Image
                  src={comment.imageUrl}
                  alt="Ảnh bình luận"
                  width={280}
                  height={280}
                  className="max-h-70 w-auto cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
                />
              </button>

              {isImageOnly && (
                <CommentActionMenu
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={startEditing}
                  onDelete={() => setShowDeleteConfirm(true)}
                  triggerClassName="absolute top-1/2 -right-10 z-10 mt-2 -translate-y-1/2 p-1.5"
                />
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="mt-0.5 flex items-center gap-3 px-2 text-[12px] text-gray-500">
            <span>{timeAgo(comment.createdAt)}</span>
            {comment.updatedAt && <span className="italic">đã chỉnh sửa</span>}

            {/* Reaction */}
            <HoverCard
              openDelay={500}
              closeDelay={200}
              open={reactionOpen}
              onOpenChange={setReactionOpen}
            >
              <HoverCardTrigger asChild>
                <button
                  onClick={() =>
                    handleReaction(currentReaction ? null : "LIKE")
                  }
                  className={cn(
                    "cursor-pointer font-semibold hover:underline",
                    reactionDisplay?.color,
                  )}
                >
                  {reactionDisplay?.label ?? "Thích"}
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side="top"
                align="start"
                sideOffset={10}
                className="w-auto rounded-[50px] border-gray-50 bg-white p-1 shadow-lg"
              >
                <div className="flex items-center gap-0.5">
                  {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.3, y: -4 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                      className="group/reaction relative flex cursor-pointer items-center justify-center px-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReaction(type as ReactionType);
                      }}
                    >
                      <div className="origin-bottom text-[26px] leading-none select-none active:scale-95">
                        {config.icon}
                      </div>
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover/reaction:opacity-100">
                        {config.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>

            {!isReply && (
              <button
                onClick={() => {
                  setShowReplyInput(!showReplyInput);
                  setReplyMention(null);
                }}
                className="cursor-pointer font-semibold hover:underline"
              >
                Trả lời
              </button>
            )}
            {isReply && onReplyTo && (
              <button
                onClick={() => onReplyTo(comment.author.username)}
                className="cursor-pointer font-semibold hover:underline"
              >
                Trả lời
              </button>
            )}

            {/* Reaction badge */}
            {comment.reactionCount > 0 && !isEditing && (
              <ReactionListDialog
                targetType="comment"
                targetId={comment.id}
                stats={comment.stats ?? []}
                totalCount={comment.reactionCount}
              >
                <button className="flex cursor-pointer items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                  {topReactions?.map((stat) => (
                    <span key={stat.type} className="text-xs leading-none">
                      {REACTION_CONFIG[stat.type].icon}
                    </span>
                  ))}
                  <span className="ml-0.5 text-[11px] font-medium text-gray-500">
                    {comment.reactionCount}
                  </span>
                </button>
              </ReactionListDialog>
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
                onReplyTo={handleReplyToReply}
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

        {showReplyInput && !isReply && (
          <div className="mt-2 ml-10">
            <CommentInput
              key={replyMention ?? "default"}
              onSubmit={handleReply}
              isPending={createComment.isPending}
              placeholder={`Trả lời ${comment.author.fullname || comment.author.username}...`}
              autoFocus
              initialValue={replyMention ? `@${replyMention} ` : undefined}
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
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </span>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {comment.imageUrl && (
        <ImageLightBox
          images={[{ id: comment.id, imageUrl: comment.imageUrl }]}
          currentIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={() => {}}
        />
      )}
    </div>
  );
};
