"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Languages, Loader2, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  translateText,
  type TranslateResponse,
} from "@/shared/api/translation.api";
import { useTranslatePreference } from "@/features/translation/hooks/useTranslatePreference";
import { hashText } from "@/shared/helpers/hash-text";
import { shouldTranslate } from "@/shared/helpers/should-translate";

const SCOPE_SELECTOR = "[data-translatable-scope]";
const CONTENT_MARKER = "data-selection-translator";
const MIN_LENGTH = 2;
const MAX_LENGTH = 500;
const STABILIZE_DELAY_MS = 30;

interface SelectionState {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SelectionTranslator() {
  const { preferredLang } = useTranslatePreference();
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const query = useQuery<TranslateResponse>({
    queryKey: ["translation", hashText(selection?.text ?? ""), preferredLang],
    queryFn: ({ signal }) =>
      translateText(
        { text: selection!.text, targetLang: preferredLang },
        signal,
      ),
    enabled: !!selection,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const close = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  const readSelectionAndShow = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
      setSelection(null);
      return;
    }

    if (!shouldTranslate(text, preferredLang)) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const scopeEl = (
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement
    )?.closest(SCOPE_SELECTOR);

    if (!scopeEl) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setSelection({
      text,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
    });
  }, [preferredLang]);

  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.(SCOPE_SELECTOR)) return;
      window.setTimeout(readSelectionAndShow, STABILIZE_DELAY_MS);
    };
    document.addEventListener("dblclick", handleDblClick);
    return () => document.removeEventListener("dblclick", handleDblClick);
  }, [readSelectionAndShow]);

  useEffect(() => {
    if (!selection) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest(`[${CONTENT_MARKER}]`)) return;
      close();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection, close]);

  if (!selection) return null;

  return (
    <Tooltip open={true}>
      {/* Virtual anchor — span vô hình tại vị trí selection, dùng làm anchor cho Radix Popper */}
      <TooltipTrigger asChild>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: selection.y,
            left: selection.x,
            width: selection.width,
            height: selection.height,
            pointerEvents: "none",
          }}
        />
      </TooltipTrigger>

      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={6}
        collisionPadding={12}
        {...{ [CONTENT_MARKER]: "" }}
        className="min-w-[220px] p-3"
      >
        {/* Header */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-900">
            <Languages className="h-3.5 w-3.5" />
            <span>Dịch sang {preferredLang.toUpperCase()}</span>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-sm p-0.5 text-gray-400 transition-colors hover:bg-sky-100 hover:text-gray-700"
            aria-label="Đóng"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body states */}
        {query.isFetching && !query.data && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Đang dịch...</span>
          </div>
        )}

        {query.error && !query.data && (
          <p className="text-orange-600">Không dịch được. Vui lòng thử lại</p>
        )}

        {query.data && (
          <p className="leading-relaxed whitespace-pre-wrap text-gray-900">
            {query.data.translatedText}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
