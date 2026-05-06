import {
  COMPOSE_DEFAULT_SOURCE_LANG,
  COMPOSE_DEFAULT_TARGET_LANG,
} from "@/features/translation/constants/compose";
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
  setComposeSourceLang: (conversationId: string, lang: string) => void;
  reset: () => void;
}

interface ComposeConversationState {
  enabled: boolean;
  targetLang: string;
  sourceLang: string;
}

const DEFAULTS = {
  targetLang: "vi",
  sourceLang: "auto",
  hoverEnabled: true,
  selectionEnabled: true,
  composeByConversation: {} as Record<string, ComposeConversationState>,
};

const getOrInitCompose = (
  state: TranslationState,
  conversationId: string,
): ComposeConversationState => ({
  enabled: state.composeByConversation[conversationId]?.enabled ?? false,
  targetLang:
    state.composeByConversation[conversationId]?.targetLang ??
    COMPOSE_DEFAULT_TARGET_LANG,
  sourceLang:
    state.composeByConversation[conversationId]?.sourceLang ??
    COMPOSE_DEFAULT_SOURCE_LANG,
});

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
              ...getOrInitCompose(state, conversationId),
              enabled,
            },
          },
        })),

      setComposeTargetLang: (conversationId, targetLang) =>
        set((state) => ({
          composeByConversation: {
            ...state.composeByConversation,
            [conversationId]: {
              ...getOrInitCompose(state, conversationId),
              targetLang,
            },
          },
        })),
      setComposeSourceLang: (conversationId, sourceLang) =>
        set((state) => ({
          composeByConversation: {
            ...state.composeByConversation,
            [conversationId]: {
              ...getOrInitCompose(state, conversationId),
              sourceLang,
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
