import axios from "axios";

export class ApiError extends Error {
  statusCode: number;
  errorType: string;
  constructor(message: string, statusCode: number, errorType: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.startsWith("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await api.post("/auth/refresh-token");
        isRefreshing = false;
        processQueue(null, "success");

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        return Promise.reject(error);
      }
    }
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
      let message = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      const statusCode = data?.statusCode || error.response?.status || 500;
      const errorType = data?.error || "Unknown Error";
      if (statusCode === 429) {
        message = "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau";
      }
      return Promise.reject(new ApiError(message, statusCode, errorType));
    }
    return Promise.reject(error);
  },
);
