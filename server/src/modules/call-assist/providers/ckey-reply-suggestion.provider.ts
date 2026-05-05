import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ReplySuggestionInput,
  ReplySuggestionOutput,
  ReplySuggestionProvider,
} from '@/modules/call-assist/providers/reply-suggestion-provider.interface';

@Injectable()
export class CkeyReplySuggestionProvider implements ReplySuggestionProvider {
  private readonly logger = new Logger(CkeyReplySuggestionProvider.name);

  constructor(private readonly config: ConfigService) {}

  private systemPrompt(): string {
    return [
      'You are a real-time call assistant for a social networking app.',
      'Generate a natural reply the user can speak back immediately.',
      'Also translate that reply for the user to understand.',
      'Return JSON only with this exact shape:',
      '{"suggestedReply":"...","translatedReply":"..."}',
    ].join('\n');
  }

  private userPrompt(input: ReplySuggestionInput): string {
    return [
      `The other speaker said: "${input.originalSentence}"`,
      '',
      'Recent transcript context:',
      input.recentContext.length
        ? input.recentContext.map((c, i) => `${i + 1}. ${c}`).join('\n')
        : 'No recent context.',
      '',
      input.userIntent?.trim()
        ? `User intent: ${input.userIntent.trim()}`
        : 'User intent: none.',
      '',
      'Requirements:',
      `- suggestedReply language: ${input.remoteLang}`,
      `- translatedReply language: ${input.userLang}`,
      '- suggestedReply must be 2-3 short sentences.',
      '- Conversational, clear, and easy to say aloud.',
      '- If user intent is provided, follow it.',
      '- Do not mention AI.',
      '- Do not add explanations.',
      '- Preserve technical terms, product names, framework names, architectural patterns, acronyms, and proper nouns exactly as they are.',
      '- Do not translate terms such as NestJS, Redis, BullMQ, Socket.IO, WebRTC, Deepgram, PostgreSQL, Prisma, JWT, REST API, API, backend, frontend, monolith, modular monolith, microservices, event-driven, realtime, WebSocket, Docker, Kubernetes, CI/CD.',
      '- If a term is commonly used in its original English form in the target language, keep it unchanged.',
      '- Return JSON only.',
      '',
      'Expected JSON:',
      '{"suggestedReply":"...","translatedReply":"..."}',
    ].join('\n');
  }

  private extractJson(raw: string): Record<string, unknown> {
    const cleaned = raw
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch (error) {
      this.logger.error(`Unexpected JSON error: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Invalid LLM response');
    }
  }

  private limitText(text: string, maxLength: number): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, maxLength).trim();
  }

  private limitReply(reply: string): string {
    const trimmed = this.limitText(reply, 700);
    const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed];
    return sentences.slice(0, 3).join(' ').trim();
  }

  private parseOutput(raw: string): ReplySuggestionOutput {
    const parsed = this.extractJson(raw);

    if (
      typeof parsed.suggestedReply !== 'string' ||
      typeof parsed.translatedReply !== 'string'
    ) {
      throw new ServiceUnavailableException('Invalid LLM response');
    }

    const suggestedReply = this.limitReply(parsed.suggestedReply);
    const translatedReply = this.limitText(parsed.translatedReply, 1000);

    if (!suggestedReply || !translatedReply) {
      throw new ServiceUnavailableException('Empty LLM response');
    }

    return {
      suggestedReply,
      translatedReply,
    };
  }

  async suggestReply(
    input: ReplySuggestionInput,
  ): Promise<ReplySuggestionOutput> {
    const apiKey = this.config.get<string>('CKEY_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('LLM provider is not configured');
    }

    const baseUrl = this.config.get<string>('CKEY_LLM_BASE_URL');
    const model = this.config.get<string>('CKEY_LLM_MODEL');
    const timeoutMs = Number(this.config.get<string>('AI_REPLY_TIMEOUT_MS'));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: this.systemPrompt() },
            { role: 'user', content: this.userPrompt(input) },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`CKEY failed: ${res.status} ${body.slice(0, 300)}`);
        throw new ServiceUnavailableException('Cannot generate reply');
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) throw new ServiceUnavailableException('Empty LLM response');

      return this.parseOutput(raw);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ServiceUnavailableException('LLM request timed out');
      }
      if (error instanceof ServiceUnavailableException) throw error;

      this.logger.error(`Unexpected LLM error: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Cannot generate reply');
    } finally {
      clearTimeout(timeout);
    }
  }
}
