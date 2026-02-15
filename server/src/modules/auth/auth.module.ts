import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { MailModule } from '@shared/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthRepository } from '@/modules/auth/auth.repository';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_VERIFICATION_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_VERIFICATION_EXPIRES_IN',
          ) as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
