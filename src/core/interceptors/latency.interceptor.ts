import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interface for request with method, url, and startTime
 */
interface RequestWithMetadata {
  method: string;
  url: string;
  startTime?: number;
}

/**
 * Interceptor to measure and log request latency
 */
@Injectable()
export class LatencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LatencyInterceptor.name);

  /**
   * Intercepts the request to measure latency
   * @param context - Execution context containing the request
   * @param next - Call handler to proceed with the request
   * @returns Observable with the response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithMetadata>();
    const startTime = Date.now();

    // Attach start time to request for later use
    request.startTime = startTime;

    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - startTime;
        const method = request.method;
        const url = request.url;
        this.logger.log(`${method} ${url} - ${latency}ms`);
      }),
    );
  }
}
