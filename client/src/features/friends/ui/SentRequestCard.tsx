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

interface SentRequestCardProps {
  request: SentRequest;
}

export function SentRequestCard({ request }: SentRequestCardProps) {
  const cancelRequest = useCancelFriendRequest();
  const displayName = request.receiver.fullname ?? request.receiver.username;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={request.receiver.avatarUrl ?? undefined} />
        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{displayName}</p>
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
      >
        Hủy lời mời
      </Button>
    </div>
  );
}
