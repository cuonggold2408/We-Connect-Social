"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { UserPlus, Users, X } from "lucide-react";
import { useSendFriendRequest } from "@/features/friends/hooks/useFriendActions";
import { useDismissSuggestion } from "@/features/friends/hooks/useFriendActions";
import type { Suggestion } from "@/features/friends/types/friendship.types";
import Link from "next/link";

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const sendRequest = useSendFriendRequest();
  const dismiss = useDismissSuggestion();

  const displayName = suggestion.fullname ?? suggestion.username;
  const isPending = sendRequest.isPending || dismiss.isPending;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Link href={`/${suggestion.username}`}>
        <Avatar className="h-12 w-12 shrink-0 cursor-pointer">
          <AvatarImage src={suggestion.avatarUrl ?? undefined} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/${suggestion.username}`}>
          <p className="cursor-pointer truncate font-semibold">{displayName}</p>
        </Link>
        {suggestion.mutualCount > 0 && (
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-3 w-3" />
            {suggestion.mutualCount} bạn chung
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          className="cursor-pointer"
          size="sm"
          disabled={isPending}
          onClick={() => sendRequest.mutate(suggestion.id)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Kết bạn
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          disabled={isPending}
          onClick={() => dismiss.mutate(suggestion.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
