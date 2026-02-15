import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

import { PrismaService } from '@shared/prisma/prisma.service';
import { MailService } from '@shared/mail/mail.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { AuthRepository } from '@/modules/auth/auth.repository';

interface VerificationTokenPayload {
  sub: string;
  email: string;
  type: 'email_verification';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly MAX_RESEND_ATTEMPTS = 3;
  private static readonly RESEND_WINDOW_MS = 10 * 60 * 1000;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existingEmail = await this.authRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const existingUsername = await this.authRepository.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username đã được sử dụng');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    await this.prisma.executeTransaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
        },
      });

      await this.createAndSendVerification(
        tx,
        user.id,
        user.email,
        user.username,
      );
    });

    return {
      message: 'Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload: VerificationTokenPayload;
    try {
      payload = this.jwtService.verify<VerificationTokenPayload>(token, {
        ignoreExpiration: true,
      });
    } catch {
      throw new BadRequestException('Token không hợp lệ');
    }

    if (payload.type !== 'email_verification') {
      throw new BadRequestException('Token không hợp lệ');
    }
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token không tồn tại');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Token đã hết hạn');
    }

    if (tokenRecord.user.emailVerifiedAt) {
      throw new BadRequestException('Email đã được xác thực trước đó');
    }
    await this.prisma.executeTransaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      });

      await tx.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });
    });

    this.logger.log(`Email verified for user ${tokenRecord.userId}`);

    return { message: 'Xác thực email thành công! Bạn có thể đăng nhập.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email đã được xác thực');
    }
    const recentTokenCount = await this.prisma.emailVerificationToken.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - AuthService.RESEND_WINDOW_MS),
        },
      },
    });

    if (recentTokenCount >= AuthService.MAX_RESEND_ATTEMPTS) {
      throw new UnprocessableEntityException(
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút.',
      );
    }

    await this.createAndSendVerification(
      this.prisma,
      user.id,
      user.email,
      user.username,
    );

    return {
      message: 'Chúng tôi đã gửi lại link xác thực. Vui lòng kiểm tra email.',
    };
  }

  private async createAndSendVerification(
    tx: any,
    userId: string,
    email: string,
    username: string,
  ): Promise<void> {
    const expiresIn = this.configService.getOrThrow<string>(
      'JWT_VERIFICATION_EXPIRES_IN',
    );

    const payload: VerificationTokenPayload = {
      sub: userId,
      email,
      type: 'email_verification',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: expiresIn as StringValue,
    });

    const decoded = this.jwtService.decode<{ exp: number }>(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await tx.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    await this.mailService.sendVerificationEmail(
      email,
      username,
      verificationUrl,
    );
  }
}
