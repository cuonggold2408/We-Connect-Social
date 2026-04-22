const EMOJI_PATTERN = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
const URL_PATTERN = /https?:\/\/\S+/g;
const MENTION_PATTERN = /@\w+/g;
const HASHTAG_PATTERN = /#\w+/g;

export function shouldTranslate(text: string, preferredLang: string): boolean {
  if (!text || !preferredLang) return false;

  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > 2000) return false;

  const textOnly = trimmed
    .replace(URL_PATTERN, "")
    .replace(MENTION_PATTERN, "")
    .replace(HASHTAG_PATTERN, "")
    .replace(EMOJI_PATTERN, "")
    .trim();

  return textOnly.length >= 2;
}
