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
};
