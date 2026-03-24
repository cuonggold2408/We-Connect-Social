import { api } from "@/shared/api/axios";
import type {
  Post,
  PaginatedResponse,
  CreatePostDto,
} from "@/features/feed/types/post";

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export const postsApi = {
  createPost: async (dto: CreatePostDto): Promise<Post> => {
    const { data } = await api.post<Post>("/posts", dto);
    return data;
  },

  getFeed: async (
    cursor?: string,
    limit: number = 10,
  ): Promise<PaginatedResponse<Post>> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    const { data } = await api.get<ApiResponse<PaginatedResponse<Post>>>(
      `/posts/feed?${params}`,
    );
    return data.data!;
  },

  deletePost: async (postId: string): Promise<ApiResponse> => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
  },

  getPostById: async (postId: string): Promise<Post> => {
    const { data } = await api.get<ApiResponse<Post>>(`/posts/${postId}`);
    return data.data!;
  },
};
