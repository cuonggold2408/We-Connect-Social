import VerificationEmailTemplate from '@/shared/mail/template/VerificationEmailTemplate';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly mailFrom: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.mailFrom = this.configService.getOrThrow<string>('MAIL_FROM');
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    verificationUrl: string,
  ): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.mailFrom,
        to,
        subject: 'Xác thực tài khoản We Connect',
        react: VerificationEmailTemplate({ username, verificationUrl }),
      });

      if (error) {
        this.logger.error(`Lỗi khi gửi email xác thực đến ${to}`, error);
        throw new Error(`Lỗi khi gửi email xác thực: ${error.message}`);
      }

      this.logger.log(`Email xác thực đã được gửi đến ${to}`);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email xác thực đến ${to}`, error);
      throw error;
    }
  }
}
