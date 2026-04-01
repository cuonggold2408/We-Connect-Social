import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { friendshipKeys } from "@/features/friends/constants/friendship.keys";
import type { FriendshipUpdateEvent } from "@/features/friends/types/friendship.types";

export function useFriendshipSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent<FriendshipUpdateEvent>).detail;

      switch (data.action) {
        case "REQUEST_RECEIVED":
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.receivedRequests(),
          });
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.pendingCount(),
          });
          break;

        case "REQUEST_ACCEPTED":
        case "UNFRIENDED":
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.all,
          });
          break;

        case "REQUEST_CANCELLED":
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.receivedRequests(),
          });
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.pendingCount(),
          });
          break;

        default:
          queryClient.invalidateQueries({
            queryKey: friendshipKeys.all,
          });
      }
    };

    window.addEventListener("friendship-updated", handler);
    return () => window.removeEventListener("friendship-updated", handler);
  }, [queryClient]);
}
