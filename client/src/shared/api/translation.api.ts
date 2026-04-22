import { api } from "@/shared/api/axios";

export interface TranslateRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
  entityType?: "POST" | "COMMENT" | "MESSAGE";
  entityId?: string;
}

export interface TranslateResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  cached: boolean;
  confidence?: number;
}

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export async function translateText(
  payload: TranslateRequest,
  signal?: AbortSignal,
): Promise<TranslateResponse> {
  const { data } = await api.post<ApiResponse<TranslateResponse>>(
    "/translations",
    payload,
    {
      signal,
    },
  );

  return data.data!;
}
