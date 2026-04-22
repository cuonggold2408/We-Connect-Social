import { useTranslationStore } from "@/shared/stores/translation.store";

export function useTranslatePreference() {
  const targetLang = useTranslationStore((s) => s.targetLang);
  const sourceLang = useTranslationStore((s) => s.sourceLang);
  const hoverEnabled = useTranslationStore((s) => s.hoverEnabled);
  const selectionEnabled = useTranslationStore((s) => s.selectionEnabled);
  const setTargetLang = useTranslationStore((s) => s.setTargetLang);
  const setSourceLang = useTranslationStore((s) => s.setSourceLang);
  const setHoverEnabled = useTranslationStore((s) => s.setHoverEnabled);
  const setSelectionEnabled = useTranslationStore((s) => s.setSelectionEnabled);
  const reset = useTranslationStore((s) => s.reset);

  return {
    targetLang,
    sourceLang,
    hoverEnabled,
    selectionEnabled,
    setTargetLang,
    setSourceLang,
    setHoverEnabled,
    setSelectionEnabled,
    reset,
  };
}
