import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/shared/filters/http-exception.filter';
import { ResponseInterceptor } from '@/shared/interceptors/response.interceptor';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from '@/shared/websocket/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  app.set('trust proxy', 'loopback');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,

      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis(
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  );
  app.useWebSocketAdapter(redisAdapter);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
