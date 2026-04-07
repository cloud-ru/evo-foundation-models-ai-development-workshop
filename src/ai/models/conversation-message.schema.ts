import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Emotion classification enum
 */
export enum Emotion {
  PLEASANT = 'pleasant',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

/**
 * Conversation message document interface
 */
export interface ConversationMessageDocument extends Document {
  readonly id: string;
  readonly messageId: string;
  readonly requestText: string;
  readonly responseText: string;
  readonly emotion: Emotion;
  readonly confidence: number;
  readonly latencyMs: number;
  readonly statusCode: number;
  readonly createdAt: Date;
}

/**
 * Conversation message schema for MongoDB
 * Stores all AI sentiment analysis requests and responses for audit trail
 */
@Schema({
  timestamps: false,
  collection: 'conversation_messages',
})
export class ConversationMessage {
  @Prop({ required: true, unique: true, index: true })
  readonly messageId!: string;

  @Prop({ required: true })
  readonly requestText!: string;

  @Prop({ required: true })
  readonly responseText!: string;

  @Prop({ required: true, enum: Emotion })
  readonly emotion!: Emotion;

  @Prop({ required: true, min: 0, max: 1 })
  readonly confidence!: number;

  @Prop({ required: true, min: 0 })
  readonly latencyMs!: number;

  @Prop({ required: true })
  readonly statusCode!: number;

  @Prop({ required: true, default: Date.now })
  readonly createdAt!: Date;
}

export const ConversationMessageSchema =
  SchemaFactory.createForClass(ConversationMessage);

// Map _id to id property
ConversationMessageSchema.virtual('id').get(function (
  this: ConversationMessageDocument,
) {
  return this._id.toString();
});

// Ensure virtuals are included when converting to JSON
ConversationMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret._id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.__v;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});
