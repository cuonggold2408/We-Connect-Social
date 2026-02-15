export interface ApiSuccessResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
