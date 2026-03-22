import { api } from "@/shared/api/axios";
import type { Notification } from "@/shared/types/notification.types";

export interface GetNotificationsResponse {
  data: Notification[];
  nextCursor: string | null;
}

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export const notificationApi = {
  getNotifications: async (
    cursor?: string,
    limit: number = 20,
  ): Promise<GetNotificationsResponse> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));

    const { data } = await api.get<ApiResponse<GetNotificationsResponse>>(
      `/notifications?${params}`,
    );

    return data.data ?? { data: [], nextCursor: null };
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<number>>(
      "/notifications/unread-count",
    );

    return data.data ?? 0;
  },

  markAsRead: async (ids: string[]): Promise<void> => {
    await api.patch("/notifications/read", { ids });
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
