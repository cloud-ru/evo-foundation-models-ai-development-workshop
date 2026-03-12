import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { VALID_EMOTIONS } from '../constants/emotion.constants';

export type ConversationMessageDocument = ConversationMessage & Document;

/**
 * Represents a conversation message with sentiment analysis results.
 */
@Schema({
  collection: 'conversation_messages',
  timestamps: true,
  toJSON: {
    transform: (doc, ret: Record<string, unknown>) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class ConversationMessage {
  /**
   * Unique identifier for the message.
   */
  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  })
  messageId: string;

  /**
   * The original text sent by the user.
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  requestText: string;

  /**
   * The response text from the LLM.
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  responseText: string;

  /**
   * The detected emotion in the text.
   */
  @Prop({
    type: String,
    required: true,
    enum: VALID_EMOTIONS,
  })
  emotion: string;

  /**
   * Confidence level of the emotion detection (0-1).
   */
  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 1,
  })
  confidence: number;

  /**
   * Request processing time in milliseconds.
   */
  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  latencyMs: number;

  /**
   * HTTP status code of the response.
   */
  @Prop({
    type: Number,
    required: true,
  })
  statusCode: number;

  /**
   * Timestamp when the message was created.
   */
  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date;
}

export const ConversationMessageSchema =
  SchemaFactory.createForClass(ConversationMessage);
