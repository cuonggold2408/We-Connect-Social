import {
  UpdateProfileData,
  UserProfile,
} from "@/features/profile/types/profile.types";
import { api } from "@/shared/api/axios";

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  isVerifiedBadge: boolean;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export const userApi = {
  getMe: async (): Promise<ApiResponse<UserData>> => {
    const { data } = await api.get<ApiResponse<UserData>>("/users/me");
    return data;
  },

  getProfile: async (username: string): Promise<UserProfile> => {
    const { data } = await api.get<ApiResponse<UserProfile>>(
      `/users/profile/${username}`,
    );
    return data.data!;
  },

  updateProfile: async (dto: UpdateProfileData): Promise<UserData> => {
    const { data } = await api.patch<ApiResponse<UserData>>("/users/me", dto);
    return data.data!;
  },

  updateAvatar: async (imageUrl: string): Promise<{ avatarUrl: string }> => {
    const { data } = await api.patch<ApiResponse<{ avatarUrl: string }>>(
      "/users/me/avatar",
      { imageUrl },
    );
    return data.data!;
  },

  updateCover: async (imageUrl: string): Promise<{ coverUrl: string }> => {
    const { data } = await api.patch<ApiResponse<{ coverUrl: string }>>(
      "/users/me/cover",
      { imageUrl },
    );
    return data.data!;
  },
};
