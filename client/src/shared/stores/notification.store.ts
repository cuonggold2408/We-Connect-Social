import { create } from "zustand";

export {
  NotificationType,
  NotificationEntityType,
} from "@/shared/types/notification.types";

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (c: number) => void;
  incrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,

  setUnreadCount: (c) => set({ unreadCount: c }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));
