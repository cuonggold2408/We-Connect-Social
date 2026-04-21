import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import {
  ITranslationProvider,
  TranslateInput,
  TranslateOutput,
} from '@/modules/translation/providers/translation-provider.interface';

@Injectable()
export class LibreTranslateProvider implements ITranslationProvider {
  readonly name = 'libretranslate';
  private readonly logger = new Logger(LibreTranslateProvider.name);
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('LIBRETRANSLATE_URL');
  }

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const body = {
      q: input.text,
      source: input.sourceLang ?? 'auto',
      target: input.targetLang,
      format: 'text',
    };

    const response = this.http.post(`${this.baseUrl}/translate`, body).pipe(
      timeout(3000),
      catchError((err) => {
        this.logger.error(`LibreTranslate failed: ${err.message}`);
        throw err;
      }),
    );

    const { data } = await firstValueFrom(response);
    return {
      translatedText: data.translatedText,
      sourceLang: data.detectedLanguage?.language ?? input.sourceLang ?? 'auto',
      provider: this.name,
      confidence: data.detectedLanguage?.confidence,
    };
  }

  async detectLanguage(text: string): Promise<string> {
    const response = this.http
      .post(`${this.baseUrl}/detect`, { q: text })
      .pipe(timeout(2000));
    const { data } = await firstValueFrom(response);
    return data[0]?.language ?? 'auto';
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = this.http
        .get(`${this.baseUrl}/languages`)
        .pipe(timeout(1000));
      await firstValueFrom(response);
      return true;
    } catch {
      return false;
    }
  }
}
