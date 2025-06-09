import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: CustomLoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
