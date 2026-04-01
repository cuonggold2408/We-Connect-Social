"use client";

import { Button } from "@/shared/components/ui/button";
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from "lucide-react";
import {
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
} from "@/features/friends/hooks/useFriendActions";
import { useRelationshipStatus } from "@/features/friends/hooks/useFriendQueries";
import type { RelationshipStatus } from "@/features/friends/types/friendship.types";

interface FriendRequestButtonProps {
  userId: string;
  size?: "sm" | "default" | "lg";
}

export function FriendRequestButton({
  userId,
  size = "default",
}: FriendRequestButtonProps) {
  const { data: statusData, isLoading } = useRelationshipStatus(userId);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const unfriend = useUnfriend();

  if (isLoading) {
    return (
      <Button variant="outline" size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const status: RelationshipStatus = statusData?.data?.status ?? "NONE";
  const isPending =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    rejectRequest.isPending ||
    cancelRequest.isPending ||
    unfriend.isPending;

  switch (status) {
    case "NONE":
      return (
        <Button
          size={size}
          disabled={isPending}
          onClick={() => sendRequest.mutate(userId)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm bạn bè
        </Button>
      );

    case "PENDING_OUTGOING":
      return (
        <Button
          variant="outline"
          size={size}
          disabled={isPending}
          onClick={() => cancelRequest.mutate(userId)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Hủy lời mời
        </Button>
      );

    case "PENDING_INCOMING":
      return (
        <div className="flex gap-2">
          <Button
            size={size}
            disabled={isPending}
            onClick={() => acceptRequest.mutate(userId)}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Chấp nhận
          </Button>
          <Button
            variant="outline"
            size={size}
            disabled={isPending}
            onClick={() => rejectRequest.mutate(userId)}
          >
            <UserX className="mr-2 h-4 w-4" />
            Từ chối
          </Button>
        </div>
      );

    case "FRIENDS":
      return (
        <Button
          variant="secondary"
          size={size}
          disabled={isPending}
          onClick={() => unfriend.mutate(userId)}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Bạn bè
        </Button>
      );

    case "SELF":
      return null;
  }
}
