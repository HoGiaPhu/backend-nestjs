import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AiModule } from 'src/ai/ai.module';
import { RagModule } from 'src/rag/rag.module';

@Module({
  imports: [PrismaModule, AiModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
