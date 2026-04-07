import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { MessageRequestDto } from './dto/message-request.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { ApiTokenGuard } from '../core/guards/api-token.guard';
import { LatencyInterceptor } from '../core/interceptors/latency.interceptor';

/**
 * Controller for AI sentiment analysis endpoints
 */
@ApiTags('ai')
@Controller('ai')
@UseGuards(ApiTokenGuard)
@UseInterceptors(LatencyInterceptor)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Submit prompt and receive AI response with sentiment analysis
   * @param messageRequest - The message request containing text to analyze
   * @returns MessageResponseDto with emotion, confidence, and metadata
   */
  @Post('message')
  @ApiOperation({
    summary: 'Submit prompt and receive AI response',
    description:
      'Analyzes the sentiment of the provided text using OpenAI-compatible LLM and returns emotion classification with confidence score',
  })
  @ApiBearerAuth('ApiTokenAuth')
  @ApiBody({ type: MessageRequestDto })
  @ApiResponse({
    status: 200,
    description: 'AI response returned successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing API token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - LLM API failure',
  })
  async analyzeMessage(
    @Body() messageRequest: MessageRequestDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(
      `Received sentiment analysis request for text: ${messageRequest.text.substring(0, 50)}...`,
    );
    return this.aiService.analyzeSentiment(messageRequest.text);
  }
}
