import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from './common/logger.service';
import { Response } from 'express';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    private readonly logger;
    constructor(appService: AppService, prisma: PrismaService, logger: CustomLoggerService);
    getHello(): string;
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        environment: string;
        services: {
            database: {
                status: string;
                responseTime: string;
            };
            logger: {
                status: string;
            };
        };
        memory: {
            used: number;
            total: number;
        };
    } | {
        status: string;
        timestamp: string;
        uptime: number;
        error: string;
        services: {
            database: {
                status: string;
                error: any;
            };
            logger: {
                status: string;
            };
        };
    }>;
    serveAdminRoot(res: Response): void;
}
