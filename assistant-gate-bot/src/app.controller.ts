import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from './common/logger.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'healthy';
      const dbResponseTime = Date.now() - startTime;

      // Check logger health
      const loggerStatus = this.logger.isHealthy() ? 'healthy' : 'unhealthy';

      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: dbStatus,
            responseTime: `${dbResponseTime}ms`,
          },
          logger: {
            status: loggerStatus,
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      };

      this.logger.debug('Health check performed', 'HealthCheck');
      return healthData;
    } catch (error) {
      this.logger.error('Health check failed', error.stack, 'HealthCheck');

      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: 'Database connection failed',
        services: {
          database: {
            status: 'unhealthy',
            error: error.message,
          },
          logger: {
            status: this.logger.isHealthy() ? 'healthy' : 'unhealthy',
          },
        },
      };
    }
  }

  /**
   * Корневой маршрут админки
   */
  @Get('admin')
  serveAdminRoot(@Res() res: Response): void {
    const indexPath = join(__dirname, '..', 'public', 'admin', 'index.html');
    res.sendFile(indexPath);
  }
}
