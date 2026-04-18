import { Controller } from '@nestjs/common';
import { CallsService } from '@/modules/calls/calls.service';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}
}
