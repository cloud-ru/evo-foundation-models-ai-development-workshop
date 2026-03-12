import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for message requests.
 */
export class MessageRequestDto {
  /**
   * The text to analyze for sentiment.
   */
  @ApiProperty({
    description: 'Plaintext prompt to pass to the LLM',
    example: 'I love this new product, it works perfectly!',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  text: string;
}
