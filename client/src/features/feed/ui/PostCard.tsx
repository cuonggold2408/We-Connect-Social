"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Post } from "@/features/feed/types/post";
import Image from "next/image";
import { timeAgo } from "@/shared/helpers/format-time";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  return (
    <article className="mb-4 rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500">
            {post.author.fullname?.[0] || post.author.username[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {post.author.fullname || post.author.username}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <button className="rounded-full p-1.5 hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm whitespace-pre-wrap text-gray-800">
          {post.content}
        </p>
      )}

      {/* Images */}
      {post.images.length > 0 && (
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
              className={cn(
                "relative overflow-hidden bg-gray-100",
                post.images.length === 1 && "aspect-video",
                post.images.length >= 2 && "aspect-square",
                post.images.length === 3 && i === 0 && "row-span-2",
              )}
            >
              <Image
                src="https://images.unsplash.com/photo-1769708526549-05310c4ade1d?q=80&w=985&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
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
      )}
    </article>
  );
};

export default PostCard;
