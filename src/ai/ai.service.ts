import {
  Injectable,
  Logger,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import {
  ConversationMessage,
  ConversationMessageDocument,
  Emotion,
} from './models/conversation-message.schema';
import { MessageResponseDto } from './dto/message-response.dto';

/**
 * Interface for LLM sentiment analysis response
 */
interface SentimentAnalysisResponse {
  emotion: Emotion;
  confidence: number;
}

/**
 * Service for AI sentiment analysis using OpenAI-compatible LLM
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(ConversationMessage.name)
    private readonly conversationMessageModel: Model<ConversationMessageDocument>,
  ) {
    const baseUrl = this.configService.get<string>('LLM_BASE_URL');
    const apiKey = this.configService.get<string>('LLM_API_TOKEN');
    this.model = this.configService.get<string>('LLM_MODEL', 'gpt-3.5-turbo');

    if (!baseUrl || !apiKey) {
      this.logger.error('LLM_BASE_URL or LLM_API_TOKEN is not configured');
      throw new InternalServerErrorException('LLM configuration is missing');
    }

    this.openai = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });

    this.logger.log(`AI Service initialized with model: ${this.model}`);
  }

  /**
   * Analyzes the sentiment of the provided text using OpenAI LLM
   * @param text - The text to analyze for sentiment
   * @returns MessageResponseDto with emotion, confidence, and metadata
   * @throws InternalServerErrorException if LLM API call fails
   */
  async analyzeSentiment(text: string): Promise<MessageResponseDto> {
    const messageId = uuidv4();
    const startTime = Date.now();
    let statusCode = HttpStatus.OK;
    let responseText = '';
    let emotion = Emotion.NEUTRAL;
    let confidence = 0;

    try {
      this.logger.log(`Analyzing sentiment for message: ${messageId}`);

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(text);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      responseText = completion.choices[0]?.message?.content ?? '';

      if (!responseText) {
        throw new InternalServerErrorException('Empty response from LLM');
      }

      const analysis = this.parseLlmResponse(responseText);
      emotion = analysis.emotion;
      confidence = analysis.confidence;

      this.logger.log(
        `Sentiment analysis completed: ${emotion} (${confidence})`,
      );
    } catch (error) {
      statusCode = this.getStatusCodeFromError(error);
      this.logger.error(
        `LLM API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to analyze sentiment');
    } finally {
      const latencyMs = Date.now() - startTime;

      await this.persistConversationMessage({
        messageId,
        requestText: text,
        responseText,
        emotion,
        confidence,
        latencyMs,
        statusCode,
        createdAt: new Date(),
      });
    }

    return {
      messageId,
      emotion,
      confidence,
      createdAt: new Date(),
    };
  }

  /**
   * Builds the system prompt for sentiment analysis
   * @returns System prompt string
   */
  private buildSystemPrompt(): string {
    return `You are a sentiment analysis expert. Analyze the provided text and classify its emotion.
Return a JSON response with the following structure:
{
  "emotion": "pleasant" | "neutral" | "negative",
  "confidence": number between 0 and 1
}

Emotion definitions:
- pleasant: Positive, happy, satisfied, optimistic, or enthusiastic tone
- neutral: Objective, factual, balanced, or unemotional tone
- negative: Sad, angry, frustrated, disappointed, or pessimistic tone

Provide a confidence score that reflects how certain you are about the classification.`;
  }

  /**
   * Builds the user prompt for sentiment analysis
   * @param text - The text to analyze
   * @returns User prompt string
   */
  private buildUserPrompt(text: string): string {
    return `Analyze the sentiment of the following text:\n\n"${text}"`;
  }

  /**
   * Parses the LLM response to extract emotion and confidence
   * @param responseText - The JSON response from LLM
   * @returns SentimentAnalysisResponse with emotion and confidence
   * @throws InternalServerErrorException if response is invalid
   */
  private parseLlmResponse(responseText: string): SentimentAnalysisResponse {
    try {
      const parsed = JSON.parse(responseText) as SentimentAnalysisResponse;

      if (!Object.values(Emotion).includes(parsed.emotion)) {
        this.logger.warn(`Invalid emotion in LLM response: ${parsed.emotion}`);
        return { emotion: Emotion.NEUTRAL, confidence: 0 };
      }

      if (
        typeof parsed.confidence !== 'number' ||
        parsed.confidence < 0 ||
        parsed.confidence > 1
      ) {
        this.logger.warn(
          `Invalid confidence in LLM response: ${parsed.confidence}`,
        );
        return { emotion: parsed.emotion, confidence: 0 };
      }

      return parsed;
    } catch (error) {
      this.logger.error(
        `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        'Invalid response format from LLM',
      );
    }
  }

  /**
   * Determines the HTTP status code from an error
   * @param error - The error object
   * @returns HTTP status code
   */
  private getStatusCodeFromError(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication')
      ) {
        return HttpStatus.UNAUTHORIZED;
      }

      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      ) {
        return HttpStatus.TOO_MANY_REQUESTS;
      }

      if (errorMessage.includes('timeout')) {
        return HttpStatus.REQUEST_TIMEOUT;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Persists the conversation message to MongoDB
   * @param messageData - The conversation message data to persist
   */
  private async persistConversationMessage(messageData: {
    messageId: string;
    requestText: string;
    responseText: string;
    emotion: Emotion;
    confidence: number;
    latencyMs: number;
    statusCode: number;
    createdAt: Date;
  }): Promise<void> {
    try {
      const conversationMessage = new this.conversationMessageModel(
        messageData,
      );
      await conversationMessage.save();
      this.logger.log(
        `Conversation message persisted: ${messageData.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist conversation message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
