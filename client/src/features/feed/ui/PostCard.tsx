"use client";

import {
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Share2,
  Globe,
  Users,
  Lock,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type {
  Post,
  PostVisibility,
  ReactionType,
} from "@/features/feed/types/post";
import Image from "next/image";
import { timeAgo } from "@/shared/helpers/format-time";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/components/ui/hover-card";
import { motion } from "motion/react";
import { useReaction } from "@/features/feed/hooks/useReactions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { useCallback, useState } from "react";
import { REACTION_CONFIG } from "@/features/feed/constants/config";
import { ReactionListDialog } from "@/features/feed/ui/ReactionListDialog";
import { ImageLightBox } from "@/features/feed/ui/ImageLightBox";
import { CommentDialog } from "@/features/feed/ui/comment/CommentDialog";
import { TwemojiText } from "@/shared/components/TwemojiText";
import Link from "next/link";

const VISIBILITY_ICON: Record<
  PostVisibility,
  { icon: typeof Globe; label: string }
> = {
  PUBLIC: { icon: Globe, label: "Công khai" },
  FRIENDS: { icon: Users, label: "Bạn bè" },
  PRIVATE: { icon: Lock, label: "Chỉ mình tôi" },
};

interface PostCardProps {
  post: Post;
  defaultCommentOpen?: boolean;
  highlightCommentId?: string | null;
}

const PostCard = ({
  post,
  defaultCommentOpen = false,
  highlightCommentId,
}: PostCardProps) => {
  const [reactionOpen, setReactionOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] =
    useState(defaultCommentOpen);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback((open: boolean) => {
    if (!open) setLightboxIndex(null);
  }, []);

  const { toggleReaction } = useReaction(post.id);

  const currentReaction = post.currentUserReaction;
  const reactionStats = post.stats;
  const topReactions = reactionStats?.slice(0, 3);

  const totalReactionCount =
    reactionStats?.reduce((sum, stat) => sum + stat.count, 0) ??
    post.reactionCount;

  const handleReaction = (type: ReactionType | null) => {
    setReactionOpen(false);
    if (type === null || type === currentReaction) {
      toggleReaction(null);
    } else {
      toggleReaction(type);
    }
  };

  const reactionDisplay = currentReaction
    ? REACTION_CONFIG[currentReaction]
    : null;

  return (
    <article className="mb-4 rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <Link href={`/${post.author.username}`}>
            <Avatar className="size-10 cursor-pointer">
              <AvatarImage
                src={post.author.avatarUrl || undefined}
                alt={post.author.username[0] ?? "User Avatar"}
              />
              <AvatarFallback className="bg-blue-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-white">
                {post.author.fullname?.[0] || post.author.username[0]}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/${post.author.username}`}>
              <p className="cursor-pointer text-sm font-semibold">
                {post.author.fullname || post.author.username}
              </p>
            </Link>
            <p className="flex items-center gap-1 text-xs text-gray-600">
              <span>{timeAgo(post.createdAt)}</span>
              <span>·</span>
              {(() => {
                const vis = VISIBILITY_ICON[post.visibility ?? "PUBLIC"];
                const Icon = vis.icon;
                return <Icon className="h-4 w-4" aria-label={vis.label} />;
              })()}
            </p>
          </div>
        </div>
        <button className="rounded-full p-1.5 hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <TwemojiText
          text={post.content}
          className="px-4 pb-3 text-sm whitespace-pre-wrap text-gray-800"
        />
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <>
          <div
            className={cn(
              "grid gap-0.5",
              post.images.length === 1 && "grid-cols-1",
              post.images.length === 2 && "grid-cols-2",
              post.images.length >= 3 && "grid-cols-2",
            )}
          >
            {post.images.slice(0, 4).map((img, i) => (
              <div
                key={img.id}
                onClick={() => openLightbox(i)}
                className={cn(
                  "relative cursor-pointer overflow-hidden bg-gray-100",
                  post.images.length === 1 && "aspect-video max-h-[500px]",
                  post.images.length >= 2 && "aspect-square",
                  post.images.length >= 3 && "aspect-square",
                  post.images.length === 3 && i === 0 && "row-span-2",
                )}
              >
                <Image
                  src={img.imageUrl}
                  alt={`Ảnh bài viết ${i + 1}`}
                  fill
                  sizes={
                    post.images.length === 1
                      ? "(max-width: 768px) 100vw, 680px"
                      : "(max-width: 768px) 50vw, 340px"
                  }
                  className={cn(
                    post.images.length === 1
                      ? "object-contain"
                      : "object-cover",
                  )}
                  loading="lazy"
                />

                {/* Overlay nếu nhiều hơn 4 ảnh */}
                {i === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
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

      {/* UI để hiện reaction count, comment count, share count */}
      {(totalReactionCount > 0 ||
        post.commentCount > 0 ||
        post.shareCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-[13px] text-gray-500">
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
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white"
                          style={{ zIndex: 3 - index }} // Cái nào count nhiều hơn thì đè lên đầu
                        >
                          <span className="text-lg leading-none">
                            {reactConfig.icon}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="ml-1 text-[17px] hover:underline">
                    {totalReactionCount}
                  </span>
                </button>
              </ReactionListDialog>
            )}
          </div>

          <div className="flex gap-3 text-[15px]">
            <div className="flex gap-3">
              {post.commentCount > 0 && (
                <button
                  onClick={() => setCommentDialogOpen(true)}
                  className="cursor-pointer hover:underline"
                >
                  {post.commentCount} bình luận
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {post.shareCount > 0 && (
                <span className="cursor-pointer hover:underline">
                  {post.shareCount} lượt chia sẻ
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 flex items-center justify-between border-t border-gray-100 py-1">
        <HoverCard
          openDelay={500}
          closeDelay={200}
          open={reactionOpen}
          onOpenChange={setReactionOpen}
        >
          <HoverCardTrigger asChild>
            <button
              onClick={() => handleReaction(currentReaction ? null : "LIKE")}
              className="group flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 transition-colors hover:bg-gray-100"
            >
              {reactionDisplay ? (
                <>
                  <span className="text-[20px] leading-none">
                    {reactionDisplay.icon}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      reactionDisplay.color,
                    )}
                  >
                    {reactionDisplay.label}
                  </span>
                </>
              ) : (
                <>
                  <ThumbsUp className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-500">
                    Thích
                  </span>
                </>
              )}
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align="start"
            sideOffset={15}
            className="w-auto rounded-[50px] border-gray-50 bg-white p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-1">
              {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.35, y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="group/reaction relative flex cursor-pointer items-center justify-center px-1.5"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReaction(type as ReactionType);
                  }}
                >
                  <div className="origin-bottom text-[32px] leading-none select-none active:scale-95 md:text-[36px]">
                    {config.icon}
                  </div>

                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover/reaction:opacity-100">
                    {config.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>

        <button
          onClick={() => setCommentDialogOpen(true)}
          className="flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 transition-colors hover:bg-gray-100"
        >
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-500">Bình luận</span>
        </button>

        <button className="flex w-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-2 transition-colors hover:bg-gray-100">
          <Share2 className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-500">Chia sẻ</span>
        </button>
      </div>

      {commentDialogOpen && (
        <CommentDialog
          post={post}
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          highlightCommentId={highlightCommentId}
        />
      )}
    </article>
  );
};

export default PostCard;
