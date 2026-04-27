import { useTranslationStore } from "@/shared/stores/translation.store";
import {
  COMPOSE_DEFAULT_SOURCE_LANG,
  COMPOSE_DEFAULT_TARGET_LANG,
} from "@/features/translation/constants/compose";

export function useComposePreference(conversationId: string) {
  const pref = useTranslationStore(
    (s) => s.composeByConversation[conversationId],
  );
  const setComposeEnabled = useTranslationStore((s) => s.setComposeEnabled);
  const setComposeTargetLang = useTranslationStore(
    (s) => s.setComposeTargetLang,
  );
  const setComposeSourceLang = useTranslationStore(
    (s) => s.setComposeSourceLang,
  );
  return {
    enabled: pref?.enabled ?? false,
    targetLang: pref?.targetLang ?? COMPOSE_DEFAULT_TARGET_LANG,
    sourceLang: pref?.sourceLang ?? COMPOSE_DEFAULT_SOURCE_LANG,
    setEnabled: (enabled: boolean) =>
      setComposeEnabled(conversationId, enabled),
    setTargetLang: (lang: string) => setComposeTargetLang(conversationId, lang),
    setSourceLang: (lang: string) => setComposeSourceLang(conversationId, lang),
  };
}
