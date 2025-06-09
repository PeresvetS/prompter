import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'assistant-gate-bot' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const contextStr = context ? `[${context}] ` : '';
                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
              },
            ),
          ),
        }),
      ],
    });

    // Add file transports for production
    if (process.env.NODE_ENV === 'production') {
      // Error logs
      this.logger.add(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // Combined logs
      this.logger.add(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for specific use cases
  logApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: string,
  ) {
    this.logger.info('API Call', {
      method,
      url,
      statusCode,
      duration,
      context: context || 'API',
    });
  }

  logTelegramEvent(
    event: string,
    userId?: number,
    messageId?: number,
    context?: string,
  ) {
    this.logger.info('Telegram Event', {
      event,
      userId,
      messageId,
      context: context || 'Telegram',
    });
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    context?: string,
  ) {
    this.logger.info('Database Operation', {
      operation,
      table,
      duration,
      context: context || 'Database',
    });
  }

  logSecurityEvent(
    event: string,
    userId?: string,
    ip?: string,
    context?: string,
  ) {
    this.logger.warn('Security Event', {
      event,
      userId,
      ip,
      context: context || 'Security',
    });
  }

  // Health check method
  isHealthy(): boolean {
    try {
      this.logger.info('Health check performed');
      return true;
    } catch (error) {
      return false;
    }
  }
}
