import { Injectable, Logger } from '@nestjs/common';
import { HealthService } from './health/health.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly healthService: HealthService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<Record<string, any>> {
    this.logger.log('Health check endpoint called');
    return this.healthService.getHealth();
  }
}
