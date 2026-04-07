import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import {
  ConversationMessage,
  ConversationMessageSchema,
} from './models/conversation-message.schema';

/**
 * AI Module for sentiment analysis functionality
 * Provides endpoints for text sentiment analysis using OpenAI-compatible LLM
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConversationMessage.name, schema: ConversationMessageSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
