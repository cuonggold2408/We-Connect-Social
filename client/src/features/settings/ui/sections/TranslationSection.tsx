"use client";

import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useTranslatePreference } from "@/features/translation/hooks/useTranslatePreference";
import { useTranslationStore } from "@/shared/stores/translation.store";
import {
  AUTO_LANGUAGE,
  LANGUAGES,
} from "@/features/translation/constants/languages";
import { SettingSection } from "@/features/settings/ui/primitives/SettingSection";
import { SettingRow } from "@/features/settings/ui/primitives/SettingRow";

export function TranslationSection() {
  const {
    targetLang,
    sourceLang,
    hoverEnabled,
    selectionEnabled,
    setTargetLang,
    setSourceLang,
    setHoverEnabled,
    setSelectionEnabled,
  } = useTranslatePreference();
  const reset = useTranslationStore((s) => s.reset);

  const canSwap = sourceLang !== AUTO_LANGUAGE.code;

  const swap = () => {
    if (!canSwap) return;

    const prev = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prev);
  };

  return (
    <SettingSection title="Ngôn ngữ & Dịch">
      <SettingRow
        title="Dịch khi di chuột"
        description="Hover vào một câu để xem bản dịch ngay lập tức"
        control={
          <Switch
            checked={hoverEnabled}
            onCheckedChange={setHoverEnabled}
            aria-label="Bật/tắt dịch khi hover"
          />
        }
      />
      <SettingRow
        title="Nhấp đúp để dịch"
        description="Double-click sau đó bôi đen đoạn văn bản để dịch thủ công"
        control={
          <Switch
            checked={selectionEnabled}
            onCheckedChange={setSelectionEnabled}
            aria-label="Bật/tắt dịch khi chọn văn bản"
          />
        }
      />

      <SettingRow
        title="Ngôn ngữ dịch"
        description="Chọn cặp ngôn ngữ nguồn và đích cho bản dịch"
        control={
          <div className="flex items-center gap-2">
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="h-9 min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[AUTO_LANGUAGE, ...LANGUAGES].map((lang) => (
                  <SelectItem
                    key={lang.code}
                    value={lang.code}
                    disabled={
                      lang.code !== AUTO_LANGUAGE.code &&
                      lang.code === targetLang
                    }
                  >
                    <span className="mr-1.5">{lang.flag}</span>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={swap}
              disabled={!canSwap}
              className="group rounded p-1 hover:bg-gray-100"
              aria-label="Đảo chiều"
              title={
                canSwap
                  ? "Đảo chiều"
                  : "Không thể đảo chiều khi nguồn là tự động phát hiện"
              }
            >
              <ArrowLeftRight className="h-4 w-4 text-gray-400 transition-transform group-hover:rotate-180 group-hover:text-sky-600" />
            </button>

            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="h-9 min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem
                    key={lang.code}
                    value={lang.code}
                    disabled={lang.code === sourceLang}
                  >
                    <span className="mr-1.5">{lang.flag}</span>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <SettingRow
        title="Khôi phục mặc định"
        description="Đưa mọi tuỳ chọn dịch về giá trị ban đầu (phát hiện ngôn ngữ → vi)"
        control={
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Khôi phục
          </Button>
        }
      />
    </SettingSection>
  );
}
