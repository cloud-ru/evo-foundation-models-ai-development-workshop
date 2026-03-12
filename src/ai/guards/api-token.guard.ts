import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard that validates the X-Auth-Token header against the API_TOKEN environment variable.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  private readonly logger = new Logger(ApiTokenGuard.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Determines if the request can proceed by validating the API token.
   * @param context The execution context
   * @returns True if the request is authorized, otherwise throws an UnauthorizedException
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-auth-token'] as string;
    const validToken = this.configService.get<string>('API_TOKEN');

    if (!token) {
      this.logger.warn('Request missing X-Auth-Token header');
      throw new UnauthorizedException('Missing authentication token');
    }

    if (token !== validToken) {
      this.logger.warn('Invalid API token provided');
      throw new UnauthorizedException('Invalid authentication token');
    }

    this.logger.log('Request authenticated successfully');
    return true;
  }
}
