"use client";

import { useRef, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Globe, Users, Lock, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { timeAgo } from "@/shared/helpers/format-time";
import { REACTION_CONFIG } from "@/features/feed/constants/config";
import {
  useComments,
  useCreateComment,
} from "@/features/feed/hooks/useComments";
import { CommentInput } from "@/features/feed/ui/comment/CommentInput";
import { CommentItem } from "@/features/feed/ui/comment/CommentItem";
import { ReactionListDialog } from "@/features/feed/ui/ReactionListDialog";
import type { Post, PostVisibility } from "@/features/feed/types/post";
import Image from "next/image";
import { ImageLightBox } from "../ImageLightBox";
import { TwemojiText } from "@/shared/components/TwemojiText";

const VISIBILITY_LABEL: Record<
  PostVisibility,
  { icon: typeof Globe; label: string }
> = {
  PUBLIC: { icon: Globe, label: "Công khai" },
  FRIENDS: { icon: Users, label: "Bạn bè" },
  PRIVATE: { icon: Lock, label: "Chỉ mình tôi" },
};

interface CommentDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightCommentId?: string | null;
}

export function CommentDialog({
  post,
  open,
  onOpenChange,
  highlightCommentId,
}: CommentDialogProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback((open: boolean) => {
    if (!open) setLightboxIndex(null);
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useComments(post.id, open);

  const createComment = useCreateComment(post.id);

  const comments = data?.pages.flatMap((page) => page.data) ?? [];

  const reactionStats = post.stats;
  const topReactions = reactionStats?.slice(0, 3);
  const totalReactionCount =
    reactionStats?.reduce((sum, stat) => sum + stat.count, 0) ??
    post.reactionCount;

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
        { rootMargin: "0px 0px 200px 0px" },
      );

      observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const handleCreateComment = (content: string, imageUrl?: string) => {
    createComment.mutate({ content, imageUrl });
  };

  const vis = VISIBILITY_LABEL[post.visibility ?? "PUBLIC"];
  const VisIcon = vis.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-gray-100 px-4 py-3">
          <DialogTitle className="text-center text-base font-semibold">
            Bài viết của {post.author.fullname || post.author.username}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4">
            {/* Post Header  */}
            <div className="flex items-center gap-3 pt-3 pb-2">
              <Avatar className="size-10">
                <AvatarImage
                  src={post.author.avatarUrl || undefined}
                  alt={post.author.username}
                />
                <AvatarFallback className="bg-blue-primary text-sm font-bold text-white">
                  {post.author.fullname?.[0] || post.author.username[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">
                  {post.author.fullname || post.author.username}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>·</span>
                  <VisIcon className="h-3.5 w-3.5" aria-label={vis.label} />
                </p>
              </div>
            </div>

            {/* Post content */}
            {post.content && (
              <TwemojiText
                text={post.content}
                className="pb-3 text-sm whitespace-pre-wrap text-gray-800"
              />
            )}

            {/* Post Images */}
            {post.images.length > 0 && (
              <>
                <div
                  className={cn(
                    "mb-3 grid cursor-pointer gap-0.5 overflow-hidden rounded-lg",
                    post.images.length === 1 && "grid-cols-1",
                    post.images.length >= 2 && "grid-cols-2",
                  )}
                >
                  {post.images.slice(0, 4).map((img, i) => (
                    <div
                      key={img.id}
                      onClick={() => openLightbox(i)}
                      className={cn(
                        "relative bg-gray-100",
                        post.images.length === 1
                          ? "aspect-video max-h-62.5"
                          : "aspect-square",
                        post.images.length === 3 && i === 0 && "row-span-2",
                      )}
                    >
                      <Image
                        src={img.imageUrl}
                        alt={`Ảnh bài viết ${i + 1}`}
                        fill
                        sizes="(max-width: 512px) 100vw, 256px"
                        className={cn(
                          post.images.length === 1
                            ? "object-contain"
                            : "object-cover",
                        )}
                      />
                      {i === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-bold text-white">
                          +{post.images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <ImageLightBox
                  images={post.images}
                  currentIndex={lightboxIndex ?? 0}
                  open={lightboxIndex !== null}
                  onOpenChange={closeLightbox}
                  onIndexChange={setLightboxIndex}
                />
              </>
            )}

            {/* Reaction, Comment Count */}
            {(totalReactionCount > 0 || post.commentCount > 0) && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[13px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  {totalReactionCount > 0 && (
                    <ReactionListDialog
                      targetType="post"
                      targetId={post.id}
                      stats={reactionStats ?? []}
                      totalCount={totalReactionCount}
                    >
                      <button className="flex cursor-pointer items-center gap-1.5">
                        <div className="flex items-center -space-x-1">
                          {topReactions?.map((stat, index) => {
                            const reactConfig = REACTION_CONFIG[stat.type];
                            if (!reactConfig) return null;
                            return (
                              <div
                                key={stat.type}
                                className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white ring-2 ring-white"
                                style={{ zIndex: 3 - index }}
                              >
                                <span className="text-sm leading-none">
                                  {reactConfig.icon}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <span className="hover:underline">
                          {totalReactionCount}
                        </span>
                      </button>
                    </ReactionListDialog>
                  )}
                </div>
                {post.commentCount > 0 && (
                  <span>{post.commentCount} bình luận</span>
                )}
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-3 py-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex animate-pulse gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-16 w-3/4 rounded-2xl bg-gray-200" />
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))
                : comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      postAuthorId={post.author.id}
                      highlightCommentId={highlightCommentId}
                    />
                  ))}

              {comments.length === 0 && !isLoading && (
                <p className="py-4 text-center text-sm text-gray-400">
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </p>
              )}

              <div ref={loadMoreRef} className="h-1" />

              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <Loader2 className="text-blue-primary h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input để Comment */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-2">
          <CommentInput
            onSubmit={handleCreateComment}
            isPending={createComment.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
