import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class RagDatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString:
        this.configService.getOrThrow<string>('rag.databaseUrl'),
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    value?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, value);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
