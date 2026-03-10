import { api } from "@/shared/api/axios";
import type { ReactionType } from "@/features/feed/types/post";

interface ReactionStats {
  type: ReactionType;
  count: number;
}

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export const reactionsApi = {
  getStats: async (postId: string): Promise<ReactionStats[]> => {
    const { data } = await api.get<ApiResponse<ReactionStats[]>>(
      `/posts/${postId}/reactions/stats`,
    );
    return data.data || [];
  },

  react: async (postId: string, type: ReactionType): Promise<void> => {
    await api.post(`/posts/${postId}/reactions`, { type });
  },
  removeReaction: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/reactions`);
  },
};
