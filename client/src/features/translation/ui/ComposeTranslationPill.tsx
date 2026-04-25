"use client";

import { Languages, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Props {
  suggestion: string | null;
  isLoading: boolean;
  error: Error | null;
  targetLang: string;
  onApply: () => void;
}

export function ComposeTranslationPill({
  suggestion,
  isLoading,
  error,
  targetLang,
  onApply,
}: Props) {
  const visible = isLoading || !!suggestion || !!error;
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mx-4 mt-2 flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm",
        "animate-in fade-in-0 slide-in-from-bottom-1 duration-150",
        error ? "border-orange-200" : "border-sky-100",
      )}
    >
      <Languages
        className={cn(
          "h-4 w-4 shrink-0",
          error ? "text-orange-500" : "text-sky-600",
        )}
      />

      <span className="shrink-0 text-xs font-medium text-gray-500 uppercase">
        {targetLang}
      </span>

      <span className="mx-1 h-4 w-px shrink-0 bg-gray-200" />

      <div className="min-w-0 flex-1">
        {isLoading && !suggestion && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang dịch...
          </span>
        )}

        {error && !suggestion && (
          <span className="text-orange-600">Không dịch được. Thử lại sau</span>
        )}

        {suggestion && (
          <span className="block truncate text-gray-900" title={suggestion}>
            {suggestion}
          </span>
        )}
      </div>

      {suggestion && (
        <button
          type="button"
          onClick={onApply}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1",
            "text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100",
            "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none",
          )}
          aria-label="Áp dụng bản dịch"
        >
          <CornerDownLeft className="h-3 w-3" />
          Tab
        </button>
      )}
    </div>
  );
}
