import { ApiProperty } from '@nestjs/swagger';
import { Emotion } from '../models/conversation-message.schema';

/**
 * DTO for message response from AI sentiment analysis endpoint
 */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the message',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  readonly messageId!: string;

  @ApiProperty({
    description: 'Classified emotion from the text',
    enum: Emotion,
    example: Emotion.PLEASANT,
  })
  readonly emotion!: Emotion;

  @ApiProperty({
    description: 'Confidence level of the emotion classification (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  readonly confidence!: number;

  @ApiProperty({
    description: 'Timestamp when the message was processed',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  readonly createdAt!: Date;
}
