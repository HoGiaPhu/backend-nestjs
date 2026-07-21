import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { S3Module } from 'src/s3/s3.module';
import { LogsModule } from 'src/logs/logs.module';

@Module({
  imports: [PrismaModule, S3Module, LogsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
