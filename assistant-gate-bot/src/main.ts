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

// Load environment variables
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy for Railway (behind reverse proxy)
  app.set('trust proxy', 1);

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

  // Enhanced startup logging
  logger.log(`🔧 Starting application...`);
  logger.log(`📦 Node Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🌐 Port: ${port}`);

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  logger.log(`📊 Admin panel available at: http://0.0.0.0:${port}/admin/`);
  logger.log(`❤️  Health check available at: http://0.0.0.0:${port}/health`);
  logger.log(
    `🔒 Security features enabled: Helmet, Rate Limiting, Input Validation`,
    'Bootstrap',
  );

  if (process.env.NODE_ENV === 'production') {
    logger.log(`🌐 Production mode: Enhanced security enabled`, 'Bootstrap');
  }

  // Log environment validation results
  logger.log(`✅ Application startup completed successfully`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});
