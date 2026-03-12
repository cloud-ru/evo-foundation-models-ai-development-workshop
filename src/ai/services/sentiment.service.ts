import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from './openai.service';
import {
  ConversationMessage,
  ConversationMessageDocument,
} from '../models/conversation-message.schema';
import { MessageRequestDto } from '../dto/message-request.dto';
import { MessageResponseDto } from '../dto/message-response.dto';
import { VALID_EMOTIONS } from '../constants/emotion.constants';

/**
 * Service for analyzing sentiment of text messages using LLM.
 */
@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  private readonly systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of the given text and classify it as one of the following: pleasant, neutral, or negative.

Respond with a JSON object containing:
1. "emotion": The detected emotion (pleasant, neutral, or negative)
2. "confidence": A number between 0 and 1 representing your confidence in the classification

Example response:
{
  "emotion": "pleasant",
  "confidence": 0.95
}

Be accurate and consistent in your analysis. Consider the overall tone, word choice, and context of the text.`;

  constructor(
    private readonly openaiService: OpenAIService,
    @InjectModel(ConversationMessage.name)
    private readonly conversationMessageModel: Model<ConversationMessageDocument>,
  ) {}

  /**
   * Analyzes the sentiment of the given text.
   * @param messageRequest The message request containing the text to analyze
   * @returns The sentiment analysis result
   */
  async analyzeSentiment(
    messageRequest: MessageRequestDto,
  ): Promise<MessageResponseDto> {
    const startTime = Date.now();
    const messageId = uuidv4();

    try {
      this.logger.log(`Analyzing sentiment for message: ${messageId}`);

      // Get response from LLM
      const responseText = await this.openaiService.createChatCompletion(
        this.systemPrompt,
        messageRequest.text,
      );

      // Parse the response to extract emotion and confidence
      const { emotion, confidence } = this.parseSentimentResponse(responseText);

      // Calculate latency
      const latencyMs = Date.now() - startTime;

      // Save to database
      await this.saveConversationMessage({
        messageId,
        requestText: messageRequest.text,
        responseText,
        emotion,
        confidence,
        latencyMs,
        statusCode: 200,
      });

      this.logger.log(
        `Sentiment analysis completed for message: ${messageId}, emotion: ${emotion}, confidence: ${confidence}`,
      );

      return {
        messageId,
        emotion,
        confidence,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      this.logger.error(
        `Error analyzing sentiment for message: ${messageId}`,
        error,
      );

      // Save error to database
      await this.saveConversationMessage({
        messageId,
        requestText: messageRequest.text,
        responseText: error instanceof Error ? error.message : String(error),
        emotion: 'neutral',
        confidence: 0,
        latencyMs,
        statusCode: 500,
      });

      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Parses the LLM response to extract emotion and confidence.
   * @param responseText The response text from the LLM
   * @returns The parsed emotion and confidence
   */
  private parseSentimentResponse(responseText: string): {
    emotion: string;
    confidence: number;
  } {
    try {
      // Try to parse the response as JSON
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response: Record<string, unknown> = JSON.parse(responseText);

      const emotionValue = response.emotion;
      const confidenceValue = response.confidence;

      const emotion =
        typeof emotionValue === 'string' ? emotionValue.toLowerCase() : '';
      const confidence =
        typeof confidenceValue === 'number'
          ? confidenceValue
          : Number(confidenceValue);

      // Validate emotion
      if (!VALID_EMOTIONS.includes(emotion)) {
        throw new Error(`Invalid emotion: ${emotion}`);
      }

      // Validate confidence
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        throw new Error(`Invalid confidence: ${confidence}`);
      }

      return { emotion, confidence };
    } catch (error) {
      this.logger.warn(
        `Failed to parse sentiment response: ${responseText}`,
        error,
      );

      // Fallback to simple keyword-based analysis
      return this.fallbackSentimentAnalysis(responseText);
    }
  }

  /**
   * Fallback sentiment analysis based on keywords.
   * @param text The text to analyze
   * @returns The emotion and confidence
   */
  private fallbackSentimentAnalysis(text: string): {
    emotion: string;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();

    const pleasantKeywords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'fantastic',
      'love',
      'like',
      'happy',
      'pleased',
      'satisfied',
      'perfect',
    ] as const;

    const negativeKeywords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'hate',
      'dislike',
      'angry',
      'sad',
      'disappointed',
      'frustrated',
      'annoyed',
    ] as const;

    const pleasantCount = pleasantKeywords.filter((keyword) =>
      lowerText.includes(keyword),
    ).length;

    const negativeCount = negativeKeywords.filter((keyword) =>
      lowerText.includes(keyword),
    ).length;

    if (pleasantCount > negativeCount) {
      return { emotion: 'pleasant', confidence: 0.7 };
    } else if (negativeCount > pleasantCount) {
      return { emotion: 'negative', confidence: 0.7 };
    } else {
      return { emotion: 'neutral', confidence: 0.6 };
    }
  }

  /**
   * Saves a conversation message to the database.
   * @param messageData The message data to save
   */
  private async saveConversationMessage(
    messageData: Omit<ConversationMessage, 'createdAt'>,
  ): Promise<void> {
    try {
      const message = new this.conversationMessageModel({
        ...messageData,
        createdAt: new Date(),
      });

      await message.save();
      this.logger.log(`Saved conversation message: ${messageData.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to save conversation message: ${messageData.messageId}`,
        error,
      );
      // Don't throw here to avoid disrupting the main flow
    }
  }
}
