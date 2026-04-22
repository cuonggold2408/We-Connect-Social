import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TranslationState {
  targetLang: string;
  sourceLang: string;
  hoverEnabled: boolean;
  selectionEnabled: boolean;
  setTargetLang: (lang: string) => void;
  setSourceLang: (lang: string) => void;
  setHoverEnabled: (enabled: boolean) => void;
  setSelectionEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  targetLang: "vi",
  sourceLang: "en",
  hoverEnabled: true,
  selectionEnabled: true,
};

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTargetLang: (targetLang) => set({ targetLang }),
      setSourceLang: (sourceLang) => set({ sourceLang }),
      setHoverEnabled: (hoverEnabled) => set({ hoverEnabled }),
      setSelectionEnabled: (selectionEnabled) => set({ selectionEnabled }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: "weconnect:translation-pref",
    },
  ),
);
