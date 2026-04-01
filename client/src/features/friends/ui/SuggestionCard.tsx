"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { UserPlus } from "lucide-react";
import { useSendFriendRequest } from "@/features/friends/hooks/useFriendActions";
import type { FriendUser } from "@/features/friends/types/friendship.types";

interface SuggestionCardProps {
  user: FriendUser;
}

export function SuggestionCard({ user }: SuggestionCardProps) {
  const sendRequest = useSendFriendRequest();

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatarUrl ?? undefined} />
        <AvatarFallback>
          {(user.fullname ?? user.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {user.fullname ?? user.username}
        </p>
      </div>

      <Button
        size="sm"
        disabled={sendRequest.isPending}
        onClick={() => sendRequest.mutate(user.id)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Kết bạn
      </Button>
    </div>
  );
}
