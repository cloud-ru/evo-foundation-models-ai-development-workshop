import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';

describe('AppController', () => {
  let appController: AppController;

  const mockHealthService = {
    getHealth: jest.fn().mockResolvedValue({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'test',
      database: {
        status: 'connected',
        name: 'test',
        host: 'localhost',
        port: 27017,
        version: '5.0.0',
        connections: {
          current: 1,
          available: 100,
        },
      },
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
