import { create } from "zustand";
import type { Notification } from "@/shared/types/notification.types";

export {
  NotificationType,
  NotificationEntityType,
} from "@/shared/types/notification.types";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (list: Notification[]) => void;
  addNotification: (n: Notification) => void;
  setUnreadCount: (c: number) => void;
  markAsRead: (ids: string[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (list) => set({ notifications: list }),

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  setUnreadCount: (c) => set({ unreadCount: c }),

  markAsRead: (ids) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - ids.length),
    })),
}));
