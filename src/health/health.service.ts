import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface DatabaseHealth {
  status: string;
  name: string;
  host: string;
  port: number;
  version?: string;
  connections?: {
    current: number;
    available: number;
  };
  error?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database: DatabaseHealth;
}

interface ServerStatus {
  version?: string;
  connections?: {
    current?: number;
    available?: number;
  };
  [key: string]: unknown;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Get application health status including MongoDB connection
   */
  async getHealth(): Promise<HealthStatus> {
    this.logger.log('Health check endpoint called');

    const healthStatus: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? 'development',
      database: {
        status: 'unknown',
        name: this.connection.name,
        host: this.connection.host,
        port: this.connection.port,
      },
    };

    try {
      // Check MongoDB connection by executing a simple command
      if (this.connection.db) {
        const adminDb = this.connection.db.admin();
        const serverStatus = (await adminDb.serverStatus()) as ServerStatus;

        healthStatus.database.status = 'connected';
        healthStatus.database.version = serverStatus.version ?? 'unknown';
        healthStatus.database.connections = {
          current: serverStatus.connections?.current ?? 0,
          available: serverStatus.connections?.available ?? 0,
        };
      } else {
        throw new Error('Database connection not established');
      }
    } catch (error) {
      this.logger.error('Database health check failed', error);
      healthStatus.status = 'error';
      healthStatus.database.status = 'disconnected';
      healthStatus.database.error =
        error instanceof Error ? error.message : String(error);
    }

    return healthStatus;
  }
}
