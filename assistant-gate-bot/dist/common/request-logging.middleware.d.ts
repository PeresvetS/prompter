import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from './logger.service';
export declare class RequestLoggingMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: CustomLoggerService);
    use(req: Request, res: Response, next: NextFunction): void;
}
