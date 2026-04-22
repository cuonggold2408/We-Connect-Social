import { create } from "zustand";
import { persist } from "zustand/middleware";

type AutoMode = "ON_HOVER" | "ALWAYS_BUTTON" | "OFF";

interface TranslationState {
  preferredLang: string;
  autoTranslateMode: AutoMode;
  setPreferredLang: (lang: string) => void;
  setAutoMode: (mode: AutoMode) => void;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      preferredLang: "vi",
      autoTranslateMode: "ON_HOVER",
      setPreferredLang: (preferredLang) => set({ preferredLang }),
      setAutoMode: (autoTranslateMode) => set({ autoTranslateMode }),
    }),
    { name: "weconnect:translation-pref" },
  ),
);
