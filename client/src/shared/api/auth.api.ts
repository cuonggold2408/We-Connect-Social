import { api } from "@/shared/api/axios";

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
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

export const authApi = {
  login: async (
    payload: LoginPayload,
  ): Promise<ApiResponse<{ user: UserData }>> => {
    const { data } = await api.post<ApiResponse<{ user: UserData }>>(
      "/auth/login",
      payload,
    );
    return data;
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/register", payload);
    return data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const { data } = await api.get<ApiResponse>("/auth/verify-email", {
      params: { token },
    });
    return data;
  },

  resendVerification: async (email: string): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/resend-verification", {
      email,
    });
    return data;
  },

  refreshToken: async (): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/refresh-token");
    return data;
  },

  logout: async (): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/logout");
    return data;
  },
};
