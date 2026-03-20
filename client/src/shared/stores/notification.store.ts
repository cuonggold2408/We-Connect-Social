import { create } from "zustand";

export const NotificationType = {
  POST_REACTION: "POST_REACTION",
  POST_COMMENT: "POST_COMMENT",
  COMMENT_REPLY: "COMMENT_REPLY",
  COMMENT_REACTION: "COMMENT_REACTION",
  FRIEND_REQUEST: "FRIEND_REQUEST",
  FRIEND_ACCEPTED: "FRIEND_ACCEPTED",
} as const;

export enum NotificationEntityType {
  POST = "POST",
  REPLY = "REPLY",
  FRIEND = "FRIEND",
}

interface Notification {
  id: string;
  type: (typeof NotificationType)[keyof typeof NotificationType];
  actor: {
    id: string;
    username: string;
    fullname: string;
    avatarUrl: string;
  };
  entityType: NotificationEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

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
