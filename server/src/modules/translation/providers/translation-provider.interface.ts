export interface TranslateInput {
  text: string;
  sourceLang?: string;
  targetLang: string;
}

export interface TranslateOutput {
  translatedText: string;
  sourceLang: string;
  provider: string;
  confidence?: number;
}

export interface ITranslationProvider {
  readonly name: string;
  translate(input: TranslateInput): Promise<TranslateOutput>;
  detectLanguage(text: string): Promise<string>;
  isHealthy(): Promise<boolean>;
}

export const TRANSLATION_PROVIDER = Symbol('TRANSLATION_PROVIDER');
