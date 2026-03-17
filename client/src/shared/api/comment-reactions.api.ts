import { api } from "@/shared/api/axios";
import type {
  PaginatedResponse,
  ReactionItem,
  ReactionType,
} from "@/features/feed/types/post";

export const commentReactionsApi = {
  react: async (commentId: string, type: ReactionType): Promise<void> => {
    await api.post(`/comments/${commentId}/reactions`, { type });
  },

  removeReaction: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}/reactions`);
  },

  getAll: async (
    commentId: string,
    params?: { cursor?: string; limit?: number; type?: ReactionType },
  ): Promise<PaginatedResponse<ReactionItem>> => {
    const { data } = await api.get(`/comments/${commentId}/reactions`, {
      params,
    });
    return data.data!;
  },
};
