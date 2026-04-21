import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TranslationService } from '@/modules/translation/translation.service';
import { TranslateRequestDto } from '@/modules/translation/dto/translate-request.dto';

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async translate(@Body() translateRequestDto: TranslateRequestDto) {
    return this.translationService.translate(translateRequestDto);
  }
}
