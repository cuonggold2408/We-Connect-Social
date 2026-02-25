import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      (req.ip as string) ||
      (req.connection?.remoteAddress as string) ||
      'unknown-ip';
    const email =
      (req.body?.email as string)?.toLowerCase?.() || 'unknown-email';
    return `${ip}-${email}`;
  }
}
