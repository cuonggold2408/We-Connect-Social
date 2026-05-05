import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { CallAssistService } from '@/modules/call-assist/call-assist.service';
import { SuggestReplyDto } from '@/modules/call-assist/dto/suggest-reply.dto';

@Controller('call-assist')
export class CallAssistController {
  constructor(private readonly callAssistService: CallAssistService) {}

  @Post('reply-suggestions')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  suggestReply(
    @CurrentUser('id') userId: string,
    @Body() dto: SuggestReplyDto,
  ) {
    return this.callAssistService.suggestReply(userId, dto);
  }
}
