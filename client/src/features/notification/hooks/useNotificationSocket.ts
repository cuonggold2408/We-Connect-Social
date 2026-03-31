import { useAuthStore } from "@/shared/stores/auth.store";
import { useNotificationStore } from "@/shared/stores/notification.store";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { notificationApi } from "@/shared/api/notification.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/features/feed/constants/queryKeys";

export function useNotificationSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const queryClient = useQueryClient();

  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
      return count;
    },
    enabled: !!isAuthenticated,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (socketRef.current?.connected) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("new-notification", () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    socket.on("unread-count", ({ count }) => {
      useNotificationStore.getState().setUnreadCount(count);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
