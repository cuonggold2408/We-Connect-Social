import { api } from "@/shared/api/axios";
import type {
  Comment,
  CreateCommentDto,
  PaginatedResponse,
} from "@/features/feed/types/post";

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export const commentsApi = {
  getComments: async (
    postId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<PaginatedResponse<Comment>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Comment>>>(
      `/posts/${postId}/comments`,
      { params },
    );
    return data.data!;
  },

  getReplies: async (
    postId: string,
    commentId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<PaginatedResponse<Comment>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Comment>>>(
      `/posts/${postId}/comments/${commentId}/replies`,
      { params },
    );
    return data.data!;
  },

  createComment: async (
    postId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> => {
    const { data } = await api.post<ApiResponse<Comment>>(
      `/posts/${postId}/comments`,
      dto,
    );
    return data.data!;
  },

  updateComment: async (
    postId: string,
    commentId: string,
    payload: { content: string; imageUrl?: string | null },
  ): Promise<Comment> => {
    const { data } = await api.patch<ApiResponse<Comment>>(
      `/posts/${postId}/comments/${commentId}`,
      payload,
    );
    return data.data!;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },
};
