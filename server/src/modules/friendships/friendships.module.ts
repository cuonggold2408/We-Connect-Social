import { Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { FriendshipsController } from '@modules/friendships/friendships.controller';
import { FriendshipsService } from '@modules/friendships/friendships.service';
import { FriendshipsRepository } from '@modules/friendships/friendships.repository';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService, FriendshipsRepository],
  exports: [FriendshipsService, FriendshipsRepository],
})
export class FriendshipsModule {}
