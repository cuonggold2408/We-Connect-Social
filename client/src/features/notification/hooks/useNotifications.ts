import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { notificationApi } from "@/shared/api/notification.api";
import { notificationKeys } from "@/features/feed/constants/queryKeys";

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.all,
    queryFn: ({ pageParam }) => notificationApi.getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => notificationApi.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}
