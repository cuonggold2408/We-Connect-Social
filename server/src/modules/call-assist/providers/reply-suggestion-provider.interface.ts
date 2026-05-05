export const REPLY_SUGGESTION_PROVIDER = Symbol('REPLY_SUGGESTION_PROVIDER');

export interface ReplySuggestionInput {
  originalSentence: string;
  remoteLang: string;
  userLang: string;
  recentContext: string[];
  userIntent?: string;
}

export interface ReplySuggestionOutput {
  suggestedReply: string;
  translatedReply: string;
}

export interface ReplySuggestionProvider {
  suggestReply(input: ReplySuggestionInput): Promise<ReplySuggestionOutput>;
}
