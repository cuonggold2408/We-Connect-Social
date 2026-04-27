import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpeechController } from '@/modules/speech/speech.controller';
import { SpeechService } from '@/modules/speech/speech.service';

@Module({
  imports: [HttpModule],
  controllers: [SpeechController],
  providers: [SpeechService],
})
export class SpeechModule {}
