import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SlidingWindowThrottlerModule } from '@/shared/throttler/sliding-window-throttler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    JwtModule.register({
      global: true,
    }),
    SlidingWindowThrottlerModule,
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
