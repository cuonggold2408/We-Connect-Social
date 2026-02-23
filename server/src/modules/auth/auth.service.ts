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
import { LoginDto } from '@/modules/auth/dto/login.dto';
import express from 'express';
import { generateRefreshToken, hashToken } from '@/shared/utils/generate-token';
import { parseExpiresInToMs } from '@/shared/utils/format-time';
import { getCookieConfig } from '@/shared/config/cookie.config';

interface VerificationTokenPayload {
  sub: string;
  email: string;
  type: 'email_verification';
}

interface AccessTokenPayload {
  sub: string;
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

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
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
      secret: this.configService.getOrThrow<string>('JWT_VERIFICATION_SECRET'),
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
        secret: this.configService.getOrThrow<string>(
          'JWT_VERIFICATION_SECRET',
        ),
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

  async login(
    dto: LoginDto,
    res: express.Response,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ message: string; user: object }> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }

    if (!user.emailVerifiedAt) {
      throw new BadRequestException(
        'Vui lòng xác thực email trước khi đăng nhập',
      );
    }

    const isPasswordValid = await this.comparePassword(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Email hoặc mật khẩu không chính xác');
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
    };

    const accessTokenExpiresIn = this.configService.getOrThrow<StringValue>(
      'JWT_ACCESS_EXPIRES_IN',
    );

    const parseTimeAccessTokenExpiresIn =
      parseExpiresInToMs(accessTokenExpiresIn);

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);

    const refreshExpireDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_EXPIRES_DAYS',
    );
    const parseTimeRefreshTokenExpiresIn =
      refreshExpireDays * 24 * 60 * 60 * 1000;
    const refreshExpiresAt = new Date(
      Date.now() + parseTimeRefreshTokenExpiresIn,
    );

    await this.authRepository.createRefreshToken({
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt: refreshExpiresAt,
      deviceInfo,
      ipAddress,
    });

    res.cookie(
      'access_token',
      accessToken,
      getCookieConfig(parseTimeAccessTokenExpiresIn),
    );

    res.cookie(
      'refresh_token',
      refreshToken,
      getCookieConfig(parseTimeRefreshTokenExpiresIn),
    );

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        gender: user.gender,
        isVerifiedBadge: user.isVerifiedBadge,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      },
    };
  }

  async logout(
    refreshToken: string | undefined,
    res: express.Response,
  ): Promise<{ message: string }> {
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);

      const findValidToken =
        await this.authRepository.findValidRefreshToken(hashedToken);

      if (findValidToken) {
        await this.authRepository.revokeRefreshToken(findValidToken.id);
      }
    }

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      message: 'Đăng xuất thành công',
    };
  }

  async logoutAll(
    userId: string,
    res: express.Response,
  ): Promise<{ message: string }> {
    await this.authRepository.revokeAllRefreshToken(userId);
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return { message: 'Đã đăng xuất khỏi tất cả thiết bị' };
  }

  async refreshToken(
    refreshToken: string,
    res: express.Response,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<{ message: string }> {
    const hashedToken = hashToken(refreshToken);

    const tokenRecord =
      await this.authRepository.findValidRefreshToken(hashedToken);

    if (!tokenRecord) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const userId = tokenRecord.userId;

    // Revoke token cũ
    await this.authRepository.revokeRefreshToken(tokenRecord.id);

    // Tạo token mới: access - refresh
    const payload: AccessTokenPayload = { sub: userId };

    const accessTokenExpiresIn = this.configService.getOrThrow<StringValue>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    const parseTimeAccessTokenExpiresIn =
      parseExpiresInToMs(accessTokenExpiresIn);

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTokenExpiresIn,
    });

    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    const refreshExpireDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_EXPIRES_DAYS',
    );

    const parseTimeRefreshTokenExpiresIn =
      refreshExpireDays * 24 * 60 * 60 * 1000;

    const refreshExpiresAt = new Date(
      Date.now() + parseTimeRefreshTokenExpiresIn,
    );

    await this.authRepository.createRefreshToken({
      userId,
      refreshToken: hashedNewRefreshToken,
      expiresAt: refreshExpiresAt,
      deviceInfo,
      ipAddress,
    });

    res.cookie(
      'access_token',
      newAccessToken,
      getCookieConfig(parseTimeAccessTokenExpiresIn),
    );

    res.cookie(
      'refresh_token',
      newRefreshToken,
      getCookieConfig(parseTimeRefreshTokenExpiresIn),
    );

    return {
      message: 'Token đã được làm mới',
    };
  }
}
