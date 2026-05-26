import { api } from "@/shared/api/axios";

export interface SuggestCallReplyRequest {
  conversationId: string;
  callSessionId?: string;
  originalSentence: string;
  remoteLang: string;
  userLang: string;
  recentContext: string[];
  userIntent?: string;
}

export interface SuggestCallReplyResponse {
  originalQuestion: string;
  suggestedReply: string;
  translatedReply: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

const SUGGEST_REPLY_TIMEOUT_MS = 60000;

export async function suggestCallReply(
  payload: SuggestCallReplyRequest,
  signal?: AbortSignal,
): Promise<SuggestCallReplyResponse> {
  const { data } = await api.post<ApiResponse<SuggestCallReplyResponse>>(
    "/call-assist/reply-suggestions",
    payload,
    { signal, timeout: SUGGEST_REPLY_TIMEOUT_MS },
  );

  return data.data!;
}
