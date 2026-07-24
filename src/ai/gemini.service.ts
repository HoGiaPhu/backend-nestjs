import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly embeddingModel: string;
  private readonly embeddingDimensions: number;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('ai.geminiApiKey'),
    });

    this.model = this.configService.getOrThrow<string>('ai.geminiModel');
    this.embeddingModel = this.configService.getOrThrow<string>(
      'ai.geminiEmbeddingModel',
    );
    this.embeddingDimensions = this.configService.getOrThrow<number>(
      'ai.embeddingDimensions',
    );
  }

  async generateAnswer(prompt: string) {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const answer = response.text?.trim();

      if (!answer) {
        throw new ServiceUnavailableException(
          'Ai service returned an empty response',
        );
      }
      return answer;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Ai service is temporarily unvalable',
      );
    }
  }

  async createEmbedding(
    text: string,
    type: 'document' | 'query',
  ): Promise<number[]> {
    const instruction =
      type === 'document'
        ? 'Represent this document for retrieval:\n'
        : 'Represent this query for retrieving relevant documents:\n';

    try {
      const response = await this.client.models.embedContent({
        model: this.embeddingModel,
        contents: `${instruction}${text}`,
        config: {
          outputDimensionality: this.embeddingDimensions,
        },
      });

      const values = response.embeddings?.[0]?.values;

      if (!values || values.length !== this.embeddingDimensions) {
        throw new ServiceUnavailableException(
          'Ai service returned an invalid embedding',
        );
      }

      return values;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Ai embedding service is temporarily unavailable',
      );
    }
  }
}
