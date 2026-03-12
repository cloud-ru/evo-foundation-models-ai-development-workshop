import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApiTokenGuard } from './guards/api-token.guard';
import { SentimentService } from './services/sentiment.service';
import { MessageRequestDto } from './dto/message-request.dto';
import { MessageResponseDto } from './dto/message-response.dto';

/**
 * Controller for AI-related endpoints.
 */
@ApiTags('ai')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly sentimentService: SentimentService) {}

  /**
   * Analyzes the sentiment of the provided text.
   * @param messageRequest The message request containing the text to analyze
   * @returns The sentiment analysis result
   */
  @Post('message')
  @UseGuards(ApiTokenGuard)
  @ApiSecurity('ApiTokenAuth')
  @ApiOperation({ summary: 'Submit prompt and receive AI response' })
  @ApiResponse({
    status: 200,
    description: 'AI response returned',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing API token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async analyzeMessage(
    @Body() messageRequest: MessageRequestDto,
  ): Promise<MessageResponseDto> {
    try {
      this.logger.log(`Received sentiment analysis request`);
      return await this.sentimentService.analyzeSentiment(messageRequest);
    } catch (error) {
      this.logger.error('Error processing sentiment analysis request', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to analyze sentiment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
