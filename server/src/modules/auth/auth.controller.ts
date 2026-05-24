import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { ResendVerificationDto } from '@/modules/auth/dto/resend-verification.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import express from 'express';
import { extractClientInfo } from '@/shared/utils/extract-client-info';
import { Public } from '@/shared/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { LoginThrottlerGuard } from '@/shared/guards/login-throttler.guard';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';

const LOGIN_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT ?? '10', 10);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({
    short: { ttl: 60000, limit: LOGIN_LIMIT },
    medium: { ttl: 60000, limit: LOGIN_LIMIT },
    long: { ttl: 60000, limit: LOGIN_LIMIT },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const { ipAddress, deviceInfo } = extractClientInfo(req);
    return this.authService.login(data, res, ipAddress, deviceInfo);
  }

  @Public()
  @Throttle({
    short: { ttl: 60000, limit: 3 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 60000, limit: 3 },
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({
    short: { ttl: 60000, limit: 2 },
    medium: { ttl: 60000, limit: 2 },
    long: { ttl: 60000, limit: 2 },
  })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string;
    return this.authService.logout(refreshToken, res);
  }

  @Public()
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }
    const { ipAddress, deviceInfo } = extractClientInfo(req);
    return this.authService.refreshToken(
      refreshToken,
      res,
      ipAddress,
      deviceInfo,
    );
  }

  @Public()
  @Throttle({
    short: {
      ttl: 5000,
      limit: 1,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
