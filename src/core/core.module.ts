import { Module, Global } from '@nestjs/common';
import { ApiTokenGuard } from './guards/api-token.guard';
import { LatencyInterceptor } from './interceptors/latency.interceptor';

/**
 * Core module for global NestJS artifacts
 * Provides guards and interceptors for use across the application
 */
@Global()
@Module({
  providers: [ApiTokenGuard, LatencyInterceptor],
  exports: [ApiTokenGuard, LatencyInterceptor],
})
export class CoreModule {}
