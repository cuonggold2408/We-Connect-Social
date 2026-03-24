import { useEffect, useRef } from "react";
import { CheckCheck, Loader2, BellOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/features/notification/hooks/useNotifications";
import NotificationItem from "./NotificationItem";
import type { Notification } from "@/shared/types/notification.types";
import { useNotificationStore } from "@/shared/stores/notification.store";
import { useRouter } from "next/navigation";
import { getNotificationHref } from "@/features/notification/utility/getNotificationHref";

interface Props {
  onClose: () => void;
}

const NotificationDropdown = ({ onClose }: Props) => {
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  const sentinelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleItemClick = (notification: Notification) => {
    if (!notification.isRead) {
      const currentCount = useNotificationStore.getState().unreadCount;
      useNotificationStore
        .getState()
        .setUnreadCount(Math.max(0, currentCount - 1));
      markAsRead.mutate([notification.id]);
    }

    onClose();
    router.push(getNotificationHref(notification));
  };

  const handleMarkAllAsRead = () => {
    useNotificationStore.getState().setUnreadCount(0);
    markAllAsRead.mutate();
  };

  return (
    <div className="flex h-[480px] w-[360px] flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="size-4" />
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-4/5 rounded bg-gray-200" />
                  <div className="h-3 w-3/5 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <BellOff className="size-10 stroke-[1.5]" />
            <p className="text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={handleItemClick}
              />
            ))}

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 className="size-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationDropdown;
