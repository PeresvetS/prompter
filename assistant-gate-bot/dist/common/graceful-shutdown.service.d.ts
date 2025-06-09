import { OnApplicationShutdown } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
import { PrismaService } from '../prisma.service';
export declare class GracefulShutdownService implements OnApplicationShutdown {
    private readonly logger;
    private readonly prisma;
    private isShuttingDown;
    constructor(logger: CustomLoggerService, prisma: PrismaService);
    private handleShutdown;
    onApplicationShutdown(signal?: string): Promise<void>;
    isShutdownInProgress(): boolean;
}
