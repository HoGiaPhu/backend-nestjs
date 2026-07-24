import { Module } from '@nestjs/common';
import { RagDatabaseService } from './rag-database.service';
import { AiModule } from 'src/ai/ai.module';
import { RagService } from './rag.service';

@Module({
  imports: [AiModule],
  providers: [RagDatabaseService, RagService],
  exports: [RagService],
})
export class RagModule {}
