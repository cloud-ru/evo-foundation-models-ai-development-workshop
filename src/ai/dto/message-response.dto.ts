import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALID_EMOTIONS } from '../constants/emotion.constants';

/**
 * Data Transfer Object for message responses.
 */
export class MessageResponseDto {
  /**
   * Unique identifier for the message.
   */
  @ApiProperty({
    description: 'Unique identifier for the message',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  messageId: string;

  /**
   * The detected emotion in the text.
   */
  @ApiProperty({
    description: 'The detected emotion in the text',
    enum: ['pleasant', 'neutral', 'negative'],
    example: 'pleasant',
  })
  @IsEnum(VALID_EMOTIONS)
  emotion: string;

  /**
   * Confidence level of the emotion detection (0-1).
   */
  @ApiProperty({
    description: 'Confidence level of the emotion detection (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.95,
  })
  @IsNumber()
  confidence: number;

  /**
   * Timestamp when the message was created.
   */
  @ApiProperty({
    description: 'Timestamp when the message was created',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsString()
  createdAt: string;
}
