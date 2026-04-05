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

interface PhotoItem {
  id: string;
  imageUrl: string;
  postId: string;
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

  getPostsByUser: async (
    userId: string,
    cursor?: string,
    limit: number = 10,
  ): Promise<PaginatedResponse<Post>> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    const { data } = await api.get<ApiResponse<PaginatedResponse<Post>>>(
      `/posts/user/${userId}?${params}`,
    );
    return data.data!;
  },

  getPhotosByUser: async (
    userId: string,
    limit: number = 9,
  ): Promise<{ data: PhotoItem[] }> => {
    const { data } = await api.get<ApiResponse<{ data: PhotoItem[] }>>(
      `/posts/user/${userId}/photos`,
      { params: { limit } },
    );
    return data.data!;
  },
};
