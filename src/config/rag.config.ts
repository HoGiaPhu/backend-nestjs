import { registerAs } from '@nestjs/config';

export const ragConfig = registerAs('rag', () => ({
  databaseUrl: process.env.RAG_DATABASE_URL,
}));
