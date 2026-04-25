"use client";

import { useQuery } from "@tanstack/react-query";
import {
  translateText,
  type TranslateResponse,
} from "@/shared/api/translation.api";
import { hashText } from "@/shared/helpers/hash-text";
import { shouldTranslate } from "@/shared/helpers/should-translate";
import {
  COMPOSE_DEBOUNCE_MS,
  COMPOSE_MAX_LENGTH,
  COMPOSE_MIN_LENGTH,
} from "@/features/translation/constants/compose";
import { useDebouncedValue } from "@/shared/helpers/use-debounced-value";

interface Args {
  text: string;
  targetLang: string;
  enabled: boolean;
  isComposing?: boolean;
}

interface ComposeTranslateResult {
  suggestion: string | null;
  isLoading: boolean;
  error: Error | null;
  targetLang: string;
}

export function useComposeTranslate({
  text,
  targetLang,
  enabled,
  isComposing = false,
}: Args): ComposeTranslateResult {
  const debouncedText = useDebouncedValue(text, COMPOSE_DEBOUNCE_MS);
  const trimmed = debouncedText.trim();

  const canTranslate =
    enabled &&
    !isComposing &&
    trimmed.length >= COMPOSE_MIN_LENGTH &&
    trimmed.length <= COMPOSE_MAX_LENGTH &&
    shouldTranslate(trimmed, targetLang);

  const query = useQuery<TranslateResponse>({
    queryKey: ["compose-translation", hashText(trimmed), targetLang],
    queryFn: ({ signal }) =>
      translateText(
        {
          text: trimmed,
          targetLang,
          sourceLang: "auto",
        },
        signal,
      ),
    enabled: canTranslate,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const suggestion =
    canTranslate && query.data?.translatedText
      ? query.data.translatedText
      : null;

  return {
    suggestion: suggestion && suggestion.trim() !== trimmed ? suggestion : null,
    isLoading: canTranslate && query.isFetching,
    error: (query.error as Error) ?? null,
    targetLang,
  };
}
