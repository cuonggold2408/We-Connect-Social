"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Clock } from "lucide-react";
import { useCancelFriendRequest } from "@/features/friends/hooks/useFriendActions";
import type { SentRequest } from "@/features/friends/types/friendship.types";
import { timeAgo } from "@/shared/helpers/format-time";
import Link from "next/link";

interface SentRequestCardProps {
  request: SentRequest;
}

export function SentRequestCard({ request }: SentRequestCardProps) {
  const cancelRequest = useCancelFriendRequest();
  const displayName = request.receiver.fullname ?? request.receiver.username;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Link href={`/${request.receiver.username}`}>
        <Avatar className="h-12 w-12 shrink-0 cursor-pointer">
          <AvatarImage src={request.receiver.avatarUrl ?? undefined} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/${request.receiver.username}`}>
          <p className="cursor-pointer truncate font-semibold">{displayName}</p>
        </Link>
        <p className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-3 w-3" />
          {timeAgo(request.createdAt)}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={cancelRequest.isPending}
        onClick={() => cancelRequest.mutate(request.receiver.id)}
        className="cursor-pointer"
      >
        Hủy lời mời
      </Button>
    </div>
  );
}
