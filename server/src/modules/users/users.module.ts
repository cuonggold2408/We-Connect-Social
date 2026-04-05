import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { UsersRepository } from '@/modules/users/users.repository';
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';
import { FriendshipsModule } from '@/modules/friendships/friendships.module';

@Module({
  imports: [PrismaModule, forwardRef(() => FriendshipsModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
