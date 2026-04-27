import { api } from "@/shared/api/axios";

export interface SpeechTokenResponse {
  accessToken: string;
  expiresIn: number;
  remainingTokensToday: number;
  model: string;
  websocketUrl: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export async function getSpeechToken(): Promise<SpeechTokenResponse> {
  const { data } =
    await api.get<ApiResponse<SpeechTokenResponse>>("/speech/token");
  return data.data!;
}
