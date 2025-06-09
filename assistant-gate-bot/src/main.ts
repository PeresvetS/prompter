import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { CustomLoggerService } from './common/logger.service';
import { SecurityService } from './common/security.service';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Ensure crypto is available globally for @nestjs/schedule
(global as any).crypto = crypto;

// Load environment variables
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Debug: Check crypto availability
  logger.log(`Node.js version: ${process.version}`);
  logger.log(`Crypto module available: ${!!crypto}`);
  logger.log(`Global crypto: ${!!global.crypto}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get services for security validation
  const customLogger = app.get(CustomLoggerService);
  const securityService = app.get(SecurityService);

  // Validate security configuration
  const securityWarnings = securityService.validateSecurityConfig();
  if (securityWarnings.length > 0) {
    customLogger.warn('Security configuration warnings:', 'Security');
    securityWarnings.forEach((warning) =>
      customLogger.warn(warning, 'Security'),
    );
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Rate limiting
  app.use(
    '/admin',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    '/telegram',
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // Limit each IP to 60 requests per minute
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Global rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Enable CORS for admin panel
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static files for admin panel
  app.useStaticAssets(join(__dirname, '..', 'public', 'admin'), {
    prefix: '/admin/assets/',
  });

  // Enable validation pipes with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // SPA fallback middleware for admin panel
  app.use(/^\/admin\/(?!users|login|stats|health|assets).*/, (req, res) => {
    // Serve index.html for all admin routes except API endpoints and assets
    res.sendFile(join(__dirname, '..', 'public', 'admin', 'index.html'));
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Admin panel available at: http://localhost:${port}/admin/`);
  logger.log(
    `🔒 Security features enabled: Helmet, Rate Limiting, Input Validation`,
    'Bootstrap',
  );

  if (process.env.NODE_ENV === 'production') {
    logger.log(`🌐 Production mode: Enhanced security enabled`, 'Bootstrap');
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});
