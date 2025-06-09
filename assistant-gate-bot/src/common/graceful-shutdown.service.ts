import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private isShuttingDown = false;

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly prisma: PrismaService,
  ) {
    // Handle process signals
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
    process.on('SIGUSR2', () => this.handleShutdown('SIGUSR2')); // Nodemon restart
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn(
        'Shutdown already in progress, ignoring signal',
        'Shutdown',
      );
      return;
    }

    this.isShuttingDown = true;
    this.logger.log(
      `Received ${signal}, starting graceful shutdown...`,
      'Shutdown',
    );

    try {
      // Give ongoing requests time to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Close database connections
      await this.prisma.$disconnect();
      this.logger.log('Database connections closed', 'Shutdown');

      this.logger.log('Graceful shutdown completed', 'Shutdown');
      process.exit(0);
    } catch (error) {
      this.logger.error(
        'Error during graceful shutdown',
        error.stack,
        'Shutdown',
      );
      process.exit(1);
    }
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (signal) {
      this.logger.log(
        `Application shutdown initiated by ${signal}`,
        'Shutdown',
      );
    }
  }

  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}
