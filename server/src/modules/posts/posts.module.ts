import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { PostsController } from '@modules/posts/posts.controller';
import { PostsService } from '@modules/posts/posts.service';
import { PostsRepository } from '@modules/posts/posts.repository';
import { ReactionsModule } from '@modules/reactions/reactions.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ReactionsModule)],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
