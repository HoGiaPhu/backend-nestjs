import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GroqChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

@Injectable()
export class GroqService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('groq.apiKey');
    this.model = this.configService.getOrThrow<string>('groq.model');
  }

  private getAnswer(payload: GroqChatCompletion) {
    return payload.choices?.[0]?.message?.content?.trim();
  }

  async generateAnswer(prompt: string) {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_completion_tokens: 700,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Groq request failed (${response.status}): ${errorBody}`);
        throw new ServiceUnavailableException('AI service is temporarily unavailable');
      }

      const payload = (await response.json()) as GroqChatCompletion;
      const answer = this.getAnswer(payload);

      if (!answer) {
        throw new ServiceUnavailableException('AI service returned an empty response');
      }

      return answer;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      console.error('Groq request failed:', error);
      throw new ServiceUnavailableException('AI service is temporarily unavailable');
    }
  }
}
