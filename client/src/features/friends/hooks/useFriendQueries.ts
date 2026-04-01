import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { friendshipsApi } from "@/shared/api/friendships.api";
import { friendshipKeys } from "@/features/friends/constants/friendship.keys";

export function useRelationshipStatus(userId: string | undefined) {
  return useQuery({
    queryKey: friendshipKeys.status(userId ?? ""),
    queryFn: () => friendshipsApi.getStatus(userId!),
    enabled: !!userId,
  });
}

export function useReceivedRequests() {
  return useInfiniteQuery({
    queryKey: friendshipKeys.receivedRequests(),
    queryFn: ({ pageParam }) => friendshipsApi.getReceivedRequests(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useSentRequests() {
  return useInfiniteQuery({
    queryKey: friendshipKeys.sentRequests(),
    queryFn: ({ pageParam }) => friendshipsApi.getSentRequests(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useFriends() {
  return useInfiniteQuery({
    queryKey: friendshipKeys.friends(),
    queryFn: ({ pageParam }) => friendshipsApi.getFriends(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useFriendCount() {
  return useQuery({
    queryKey: friendshipKeys.friendCount(),
    queryFn: () => friendshipsApi.getFriendCount().then((r) => r.count),
  });
}

export function usePendingReceivedCount() {
  return useQuery({
    queryKey: friendshipKeys.pendingCount(),
    queryFn: () =>
      friendshipsApi.getPendingReceivedCount().then((r) => r.count),
  });
}
