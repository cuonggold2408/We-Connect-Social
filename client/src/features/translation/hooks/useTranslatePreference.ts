import { useTranslationStore } from "@/shared/stores/translation.store";

export function useTranslatePreference() {
  const preferredLang = useTranslationStore((s) => s.preferredLang);
  const autoTranslateMode = useTranslationStore((s) => s.autoTranslateMode);
  const setPreferredLang = useTranslationStore((s) => s.setPreferredLang);
  const setAutoMode = useTranslationStore((s) => s.setAutoMode);

  return {
    preferredLang,
    autoTranslateMode,
    setPreferredLang,
    setAutoMode,
  };
}
