import { Module } from '@nestjs/common';
import { ChatModule } from '@/modules/chat/chat.module';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { CallAssistController } from '@/modules/call-assist/call-assist.controller';
import { CallAssistService } from '@/modules/call-assist/call-assist.service';
import { CkeyReplySuggestionProvider } from '@/modules/call-assist/providers/ckey-reply-suggestion.provider';
import { REPLY_SUGGESTION_PROVIDER } from '@/modules/call-assist/providers/reply-suggestion-provider.interface';

@Module({
  imports: [ChatModule, PrismaModule],
  controllers: [CallAssistController],
  providers: [
    CallAssistService,
    CkeyReplySuggestionProvider,
    {
      provide: REPLY_SUGGESTION_PROVIDER,
      useExisting: CkeyReplySuggestionProvider,
    },
  ],
})
export class CallAssistModule {}
