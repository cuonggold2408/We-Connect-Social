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
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { ResendVerificationDto } from '@/modules/auth/dto/resend-verification.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import express from 'express';
import { extractClientInfo } from '@/shared/utils/extract-client-info';
import { Public } from '@/shared/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string;
    return this.authService.logout(refreshToken, res);
  }

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
}
