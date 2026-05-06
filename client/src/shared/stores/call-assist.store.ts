import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CallAssistPreference {
  enabled: boolean;
  remoteLang: string;
  userLang: string;
}

interface CallAssistState {
  byConversation: Record<string, CallAssistPreference>;
  setEnabled: (conversationId: string, enabled: boolean) => void;
  setRemoteLang: (conversationId: string, lang: string) => void;
  setUserLang: (conversationId: string, lang: string) => void;
}

const DEFAULT_PREF: CallAssistPreference = {
  enabled: false,
  remoteLang: "en",
  userLang: "vi",
};

const getPref = (
  state: CallAssistState,
  conversationId: string,
): CallAssistPreference => ({
  ...DEFAULT_PREF,
  ...state.byConversation[conversationId],
});

export const useCallAssistStore = create<CallAssistState>()(
  persist(
    (set) => ({
      byConversation: {},

      setEnabled: (conversationId, enabled) =>
        set((state) => ({
          byConversation: {
            ...state.byConversation,
            [conversationId]: {
              ...getPref(state, conversationId),
              enabled,
            },
          },
        })),

      setRemoteLang: (conversationId, remoteLang) =>
        set((state) => ({
          byConversation: {
            ...state.byConversation,
            [conversationId]: {
              ...getPref(state, conversationId),
              remoteLang,
            },
          },
        })),

      setUserLang: (conversationId, userLang) =>
        set((state) => ({
          byConversation: {
            ...state.byConversation,
            [conversationId]: {
              ...getPref(state, conversationId),
              userLang,
            },
          },
        })),
    }),
    {
      name: "weconnect:call-assist-pref",
    },
  ),
);
