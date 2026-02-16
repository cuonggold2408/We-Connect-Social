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

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>("/auth/login", payload);
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
};
