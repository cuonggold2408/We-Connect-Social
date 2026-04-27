import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { SpeechService } from '@/modules/speech/speech.service';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Get('token')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async issueToken(@CurrentUser('id') userId: string) {
    return this.speechService.grantTokenForUser(userId);
  }
}
