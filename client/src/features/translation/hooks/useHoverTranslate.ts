import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { translateText, TranslateResponse } from "@/shared/api/translation.api";
import { useTranslatePreference } from "@/features/translation/hooks/useTranslatePreference";
import { hashText } from "@/shared/helpers/hash-text";
import { shouldTranslate } from "@/shared/helpers/should-translate";

interface Args {
  text: string;
  entityType?: "POST" | "COMMENT" | "MESSAGE";
  entityId?: string;
}

export function useHoverTranslate({ text, entityType, entityId }: Args) {
  const { preferredLang, autoTranslateMode } = useTranslatePreference();
  const [open, setOpen] = useState(false);

  const canTranslate =
    autoTranslateMode === "ON_HOVER" && shouldTranslate(text, preferredLang);

  const query = useQuery<TranslateResponse>({
    queryKey: ["translation", hashText(text), preferredLang],
    queryFn: ({ signal }) =>
      translateText(
        { text, targetLang: preferredLang, entityType, entityId },
        signal,
      ),
    enabled: open && canTranslate,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    open,
    setOpen,
    canTranslate,
    data: query.data,
    isLoading: query.isFetching,
    error: query.error as Error | null,
  };
}
