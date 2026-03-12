import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Service for communicating with OpenAI-compatible APIs.
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('LLM_BASE_URL');
    const apiKey = this.configService.get<string>('LLM_API_TOKEN');

    if (!baseURL || !apiKey) {
      throw new Error('LLM_BASE_URL and LLM_API_TOKEN must be configured');
    }

    this.openai = new OpenAI({
      baseURL,
      apiKey,
    });
  }

  /**
   * Sends a chat completion request to the LLM.
   * @param systemPrompt The system prompt to set the context
   * @param userPrompt The user prompt to analyze
   * @returns The response from the LLM
   */
  async createChatCompletion(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    try {
      const model = this.configService.get<string>(
        'LLM_MODEL',
        'gpt-3.5-turbo',
      );

      this.logger.log(`Sending request to LLM with model: ${model}`);

      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
      });

      const response = completion.choices[0]?.message?.content?.trim();

      if (!response) {
        throw new Error('Empty response from LLM');
      }

      this.logger.log('Received response from LLM');
      return response;
    } catch (error) {
      this.logger.error('Error communicating with LLM', error);
      throw new Error('Failed to get response from LLM');
    }
  }
}
