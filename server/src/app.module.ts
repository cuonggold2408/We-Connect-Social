import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SlidingWindowThrottlerModule } from '@/shared/throttler/sliding-window-throttler.module';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { PostsModule } from '@/modules/posts/posts.module';
import { FeedCacheModule } from '@/shared/cache/feed-cache.module';
import { ReactionsModule } from '@/modules/reactions/reactions.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { CommentsModule } from '@/modules/comments/comments.module';
import { CommentReactionsModule } from '@/modules/comment-reactions/comment-reactions.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { FriendshipsModule } from '@/modules/friendships/friendships.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { CallsModule } from '@/modules/calls/calls.module';
import { TranslationModule } from '@/modules/translation/translation.module';
import { SpeechModule } from '@/modules/speech/speech.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    JwtModule.register({
      global: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    SlidingWindowThrottlerModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    PostsModule,
    FeedCacheModule,
    ReactionsModule,
    UploadModule,
    CommentsModule,
    CommentReactionsModule,
    NotificationsModule,
    FriendshipsModule,
    ChatModule,
    CallsModule,
    TranslationModule,
    SpeechModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
