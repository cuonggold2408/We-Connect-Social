"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useUnfriend } from "@/features/friends/hooks/useFriendActions";
import type { Friend } from "@/features/friends/types/friendship.types";
import { MoreHorizontal, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import Link from "next/link";

interface FriendCardProps {
  data: Friend;
}

export function FriendCard({ data }: FriendCardProps) {
  const unfriend = useUnfriend();

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <Link href={`/${data.friend.username}`}>
        <Avatar className="h-12 w-12 cursor-pointer">
          <AvatarImage src={data.friend.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-blue-primary flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-white">
            {(data.friend.fullname ?? data.friend.username)
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/${data.friend.username}`}>
          <p className="cursor-pointer truncate font-semibold">
            {data.friend.fullname ?? data.friend.username}
          </p>
        </Link>
        <p className="text-muted-foreground text-sm">@{data.friend.username}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-fit">
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            disabled={unfriend.isPending}
            onClick={() => unfriend.mutate(data.friend.id)}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Hủy kết bạn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
