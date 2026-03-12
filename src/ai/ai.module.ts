import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { ApiTokenGuard } from './guards/api-token.guard';
import { OpenAIService } from './services/openai.service';
import { SentimentService } from './services/sentiment.service';
import {
  ConversationMessage,
  ConversationMessageSchema,
} from './models/conversation-message.schema';

/**
 * Module for AI-related functionality.
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ConversationMessage.name, schema: ConversationMessageSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [OpenAIService, SentimentService, ApiTokenGuard],
  exports: [OpenAIService, SentimentService],
})
export class AiModule {}
