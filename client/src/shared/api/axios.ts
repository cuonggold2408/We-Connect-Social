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
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
      const message = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      const statusCode = data?.statusCode || error.response?.status || 500;
      const errorType = data?.error || "Unknown Error";
      return Promise.reject(new ApiError(message, statusCode, errorType));
    }
    return Promise.reject(error);
  },
);
