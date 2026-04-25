import { COMPOSE_DEFAULT_TARGET_LANG } from "@/features/translation/constants/compose";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TranslationState {
  targetLang: string;
  sourceLang: string;
  hoverEnabled: boolean;
  selectionEnabled: boolean;
  composeByConversation: Record<string, ComposeConversationState>;

  setTargetLang: (lang: string) => void;
  setSourceLang: (lang: string) => void;
  setHoverEnabled: (enabled: boolean) => void;
  setSelectionEnabled: (enabled: boolean) => void;
  setComposeEnabled: (conversationId: string, enabled: boolean) => void;
  setComposeTargetLang: (conversationId: string, lang: string) => void;
  reset: () => void;
}

interface ComposeConversationState {
  enabled: boolean;
  targetLang: string;
}

const DEFAULTS = {
  targetLang: "vi",
  sourceLang: "en",
  hoverEnabled: true,
  selectionEnabled: true,
  composeByConversation: {} as Record<string, ComposeConversationState>,
};

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTargetLang: (targetLang) => set({ targetLang }),
      setSourceLang: (sourceLang) => set({ sourceLang }),
      setHoverEnabled: (hoverEnabled) => set({ hoverEnabled }),
      setSelectionEnabled: (selectionEnabled) => set({ selectionEnabled }),

      setComposeEnabled: (conversationId, enabled) =>
        set((state) => ({
          composeByConversation: {
            ...state.composeByConversation,
            [conversationId]: {
              enabled,
              targetLang:
                state.composeByConversation[conversationId]?.targetLang ??
                COMPOSE_DEFAULT_TARGET_LANG,
            },
          },
        })),

      setComposeTargetLang: (conversationId, targetLang) =>
        set((state) => ({
          composeByConversation: {
            ...state.composeByConversation,
            [conversationId]: {
              enabled:
                state.composeByConversation[conversationId]?.enabled ?? false,
              targetLang,
            },
          },
        })),

      reset: () => set(DEFAULTS),
    }),
    {
      name: "weconnect:translation-pref",
    },
  ),
);
