import { registerAs } from '@nestjs/config';

export const aiConfig = registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2',
  embeddingDimensions: Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768),
}));
