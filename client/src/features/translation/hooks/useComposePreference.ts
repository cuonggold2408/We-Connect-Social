import { useTranslationStore } from "@/shared/stores/translation.store";
import { COMPOSE_DEFAULT_TARGET_LANG } from "@/features/translation/constants/compose";

export function useComposePreference(conversationId: string) {
  const pref = useTranslationStore(
    (s) => s.composeByConversation[conversationId],
  );
  const setComposeEnabled = useTranslationStore((s) => s.setComposeEnabled);
  const setComposeTargetLang = useTranslationStore(
    (s) => s.setComposeTargetLang,
  );
  return {
    enabled: pref?.enabled ?? false,
    targetLang: pref?.targetLang ?? COMPOSE_DEFAULT_TARGET_LANG,
    setEnabled: (enabled: boolean) =>
      setComposeEnabled(conversationId, enabled),
    setTargetLang: (lang: string) => setComposeTargetLang(conversationId, lang),
  };
}
