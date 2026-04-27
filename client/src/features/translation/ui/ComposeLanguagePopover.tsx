"use client";

import { Languages } from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { LANGUAGES } from "@/features/translation/constants/languages";
import { cn } from "@/shared/lib/utils";

interface Props {
  enabled: boolean;
  targetLang: string;
  sourceLang: string;
  onToggle: (enabled: boolean) => void;
  onChangeLang: (lang: string) => void;
  onChangeSourceLang: (lang: string) => void;
}

export function ComposeLanguagePopover({
  enabled,
  targetLang,
  sourceLang,
  onToggle,
  onChangeLang,
  onChangeSourceLang,
}: Props) {
  const currentTarget = LANGUAGES.find((l) => l.code === targetLang);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            enabled ? "Tùy chỉnh gợi ý dịch" : "Bật gợi ý dịch khi soạn tin"
          }
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-2 text-sm transition-colors",
            enabled
              ? "text-blue-primary hover:bg-sky-50"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
        >
          <Languages className="h-5 w-5" />
          {enabled && currentTarget && (
            <span className="text-xs font-semibold uppercase">
              {currentTarget.code}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="w-64 p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Gợi ý dịch</p>
            <p className="text-xs text-gray-500">
              Tự động dịch khi đang soạn tin
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            aria-label="Bật/tắt gợi ý dịch"
          />
        </div>

        <div className="border-b border-gray-100 py-1">
          <p className="px-4 pt-2 pb-1 text-xs font-medium text-gray-500">
            Tôi đang nói
            <span className="ml-1 font-normal text-gray-400">
              (dùng cho mic)
            </span>
          </p>
          <ul role="listbox" aria-label="Chọn ngôn ngữ đang nói">
            {LANGUAGES.map((lang) => {
              const active = lang.code === sourceLang;
              return (
                <li key={`src-${lang.code}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => onChangeSourceLang(lang.code)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-gray-50",
                      active && "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.labelVi}</span>
                    </span>
                    {active && <span className="text-emerald-600">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="py-1">
          <p className="px-4 pt-2 pb-1 text-xs font-medium text-gray-500">
            Dịch sang
          </p>
          <ul role="listbox" aria-label="Chọn ngôn ngữ dịch">
            {LANGUAGES.map((lang) => {
              const active = lang.code === targetLang;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={!enabled}
                    onClick={() => onChangeLang(lang.code)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2 text-sm transition-colors",
                      !enabled && "cursor-not-allowed opacity-50",
                      enabled && "hover:bg-gray-50",
                      active && enabled && "bg-sky-50 text-sky-700",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.labelVi}</span>
                    </span>
                    {active && <span className="text-sky-600">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
