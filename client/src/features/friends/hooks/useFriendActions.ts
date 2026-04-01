import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendshipsApi } from "@/shared/api/friendships.api";
import { friendshipKeys } from "@/features/friends/constants/friendship.keys";
import { toast } from "sonner";

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => friendshipsApi.sendRequest(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(userId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.sentRequests(),
      });
      toast.success("Đã gửi lời mời kết bạn");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (senderId: string) => friendshipsApi.acceptRequest(senderId),
    onSuccess: (_data, senderId) => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(senderId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.receivedRequests(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.friends(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.pendingCount(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.friendCount(),
      });
      toast.success("Đã chấp nhận lời mời kết bạn");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (senderId: string) => friendshipsApi.rejectRequest(senderId),
    onSuccess: (_data, senderId) => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(senderId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.receivedRequests(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.pendingCount(),
      });
      toast.success("Đã từ chối lời mời kết bạn");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) =>
      friendshipsApi.cancelRequest(receiverId),
    onSuccess: (_data, receiverId) => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(receiverId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.sentRequests(),
      });
      toast.success("Đã hủy lời mời kết bạn");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => friendshipsApi.unfriend(friendId),
    onSuccess: (_data, friendId) => {
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(friendId),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.friends(),
      });
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.friendCount(),
      });
      toast.success("Đã hủy kết bạn");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
