"use client";

import Image from "next/image";
import { Loader2, MessageCirclePlus } from "lucide-react";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";
import type { FriendUser } from "@/features/friends/types/friendship.types";

interface Props {
  user: FriendUser;
  isPending: boolean;
  onClick: () => void;
}

export function FriendSearchResult({ user, isPending, onClick }: Props) {
  const displayName = user.fullname ?? user.username;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
    >
      <Image
        src={user.avatarUrl ?? DEFAULT_AVATAR_URL}
        alt={displayName}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {displayName}
        </p>
        <p className="truncate text-xs text-gray-500">@{user.username}</p>
      </div>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <MessageCirclePlus className="text-blue-primary h-5 w-5" />
      )}
    </button>
  );
}
