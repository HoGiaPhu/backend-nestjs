import { Injectable } from '@nestjs/common';
import { GeminiService } from 'src/ai/gemini.service';
import { RagDatabaseService } from './rag-database.service';

interface PostEmbeddingRow {
  sourcePostId: number;
  content: string;
  similarity: number | string;
}

export interface SimilarPost {
  postId: number;
  content: string;
  similarity: number;
}

@Injectable()
export class RagService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly ragDatabaseService: RagDatabaseService,
  ) {}

  async indexPost(postId: number, content: string): Promise<void> {
    const embedding = await this.geminiService.createEmbedding(
      content,
      'document',
    );

    await this.ragDatabaseService.query(
      `
        INSERT INTO "PostEmbedding" (
          "sourcePostId",
          content,
          embedding,
          "updatedAt"
        )
        VALUES ($1, $2, $3::vector, NOW())
        ON CONFLICT ("sourcePostId")
        DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          "updatedAt" = NOW()
      `,
      [postId, content, this.toVectorLiteral(embedding)],
    );
  }

  async searchSimilarPosts(
    question: string,
    limit = 3,
  ): Promise<SimilarPost[]> {
    const embedding = await this.geminiService.createEmbedding(
      question,
      'query',
    );

    const result = await this.ragDatabaseService.query<PostEmbeddingRow>(
      `
        SELECT
          "sourcePostId",
          content,
          1 - (embedding <=> $1::vector) AS similarity
        FROM "PostEmbedding"
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `,
      [this.toVectorLiteral(embedding), limit],
    );

    return result.rows.map((row) => ({
      postId: row.sourcePostId,
      content: row.content,
      similarity: Number(row.similarity),
    }));
  }

  async deletePostIndex(postId: number): Promise<void> {
    await this.ragDatabaseService.query(
      `DELETE FROM "PostEmbedding" WHERE "sourcePostId" = $1`,
      [postId],
    );
  }

  private toVectorLiteral(values: number[]): string {
    return `[${values.join(',')}]`;
  }

  async clearPostIndexes(): Promise<void> {
    await this.ragDatabaseService.query('DELETE FROM "PostEmbedding"');
  }
}
