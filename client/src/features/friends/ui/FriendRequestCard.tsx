"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "@/features/friends/hooks/useFriendActions";
import type { FriendRequest } from "@/features/friends/types/friendship.types";
import { timeAgo } from "@/shared/helpers/format-time";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

export type FriendRequestCardVariant = "default" | "compact";

interface FriendRequestCardProps {
  request: FriendRequest;
  variant?: FriendRequestCardVariant;
}

export function FriendRequestCard({
  request,
  variant = "default",
}: FriendRequestCardProps) {
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const isPending = acceptRequest.isPending || rejectRequest.isPending;

  const sender = request?.sender;
  if (!sender) return null;

  const displayName =
    (sender.fullname ?? sender.username ?? "Người dùng").trim() || "Người dùng";

  const actions = (
    <>
      <Button
        className={cn(
          "cursor-pointer",
          variant === "compact" && "min-w-0 flex-1",
        )}
        size="sm"
        disabled={isPending}
        onClick={() => acceptRequest.mutate(sender.id)}
      >
        Chấp nhận
      </Button>
      <Button
        className={cn(
          "cursor-pointer",
          variant === "compact" && "min-w-0 flex-1",
        )}
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => rejectRequest.mutate(sender.id)}
      >
        Từ chối
      </Button>
    </>
  );

  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex gap-2.5">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={sender.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-gray-900">
              {displayName}
            </p>
            <p className="text-muted-foreground truncate text-xs whitespace-nowrap">
              {timeAgo(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex w-full gap-2">{actions}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Link href={`/${sender.username}`}>
        <Avatar className="h-12 w-12 shrink-0 cursor-pointer">
          <AvatarImage src={sender.avatarUrl ?? undefined} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/${sender.username}`}>
          <p className="cursor-pointer truncate font-semibold">{displayName}</p>
        </Link>
        <p className="text-muted-foreground text-sm">
          {timeAgo(request.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  );
}
