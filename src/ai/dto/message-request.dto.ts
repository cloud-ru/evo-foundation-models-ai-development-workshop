import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for message request to AI sentiment analysis endpoint
 */
export class MessageRequestDto {
  @ApiProperty({
    description: 'Plaintext prompt to pass to the LLM for sentiment analysis',
    example: 'I am feeling very happy today!',
    maxLength: 10000,
  })
  @IsNotEmpty({ message: 'Text is required' })
  @IsString({ message: 'Text must be a string' })
  @MaxLength(10000, { message: 'Text must not exceed 10000 characters' })
  readonly text!: string;
}
