import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from './logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';

    // Log incoming request
    this.logger.log(
      `Incoming ${method} ${originalUrl} from ${ip}`,
      'RequestLogging',
    );

    // Override res.end to capture response details
    const originalEnd = res.end;
    const logger = this.logger; // Capture logger reference

    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      // Log API call details
      logger.logApiCall(
        method,
        originalUrl,
        statusCode,
        duration,
        'RequestLogging',
      );

      // Log slow requests (>1000ms)
      if (duration > 1000) {
        logger.warn(
          `Slow request: ${method} ${originalUrl} took ${duration}ms`,
          'Performance',
        );
      }

      // Log error responses
      if (statusCode >= 400) {
        logger.warn(
          `Error response: ${method} ${originalUrl} - ${statusCode}`,
          'RequestLogging',
        );
      }

      // Call original end method
      return originalEnd.call(res, chunk, encoding, cb);
    };

    next();
  }
}
