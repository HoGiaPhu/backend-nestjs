import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
