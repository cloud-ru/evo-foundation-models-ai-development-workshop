import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for request with headers
 */
interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Guard to validate API token from X-Auth-Token header
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  private readonly logger = new Logger(ApiTokenGuard.name);
  private readonly apiToken: string;

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('API_TOKEN', '');
    if (!this.apiToken) {
      this.logger.warn('API_TOKEN is not configured in environment variables');
    }
  }

  /**
   * Validates the X-Auth-Token header against the configured API token
   * @param context - Execution context containing the request
   * @returns true if token is valid, throws UnauthorizedException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const authHeader = request.headers['x-auth-token'];

    if (!authHeader) {
      this.logger.warn('Request missing X-Auth-Token header');
      throw new UnauthorizedException('Missing authentication token');
    }

    if (authHeader !== this.apiToken) {
      this.logger.warn('Invalid authentication token provided');
      throw new UnauthorizedException('Invalid authentication token');
    }

    return true;
  }
}
