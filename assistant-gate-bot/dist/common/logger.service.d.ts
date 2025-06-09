import { LoggerService } from '@nestjs/common';
export declare class CustomLoggerService implements LoggerService {
    private logger;
    constructor();
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    logApiCall(method: string, url: string, statusCode: number, duration: number, context?: string): void;
    logTelegramEvent(event: string, userId?: number, messageId?: number, context?: string): void;
    logDatabaseOperation(operation: string, table: string, duration?: number, context?: string): void;
    logSecurityEvent(event: string, userId?: string, ip?: string, context?: string): void;
    isHealthy(): boolean;
}
