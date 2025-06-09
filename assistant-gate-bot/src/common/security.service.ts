import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Verify Telegram webhook signature
   * @param body - Raw request body
   * @param signature - X-Telegram-Bot-Api-Secret-Token header
   * @returns boolean indicating if signature is valid
   */
  verifyTelegramWebhook(body: string, signature?: string): boolean {
    try {
      const secretToken = this.configService.get<string>(
        'TELEGRAM_SECRET_TOKEN',
      );

      if (!secretToken) {
        this.logger.warn(
          'TELEGRAM_SECRET_TOKEN not configured, skipping webhook verification',
        );
        return true; // Allow in development if not configured
      }

      if (!signature) {
        this.logger.warn('No signature provided for webhook verification');
        return false;
      }

      // Telegram sends the secret token directly in the header
      const isValid = signature === secretToken;

      if (!isValid) {
        this.logger.warn('Invalid webhook signature detected');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   * @param input - User input string
   * @returns Sanitized string
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate Telegram user ID format
   * @param userId - User ID to validate
   * @returns boolean indicating if valid
   */
  isValidTelegramUserId(userId: any): boolean {
    return (
      typeof userId === 'number' &&
      userId > 0 &&
      userId < Number.MAX_SAFE_INTEGER
    );
  }

  /**
   * Generate secure random token
   * @param length - Token length
   * @returns Random token string
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data
   * @param data - Data to hash
   * @returns Hashed string
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if request is from allowed IP (for admin endpoints)
   * @param ip - Request IP address
   * @returns boolean indicating if IP is allowed
   */
  isAllowedIP(ip: string): boolean {
    const allowedIPs = this.configService.get<string>('ALLOWED_IPS');

    if (!allowedIPs) {
      return true; // Allow all if not configured
    }

    const allowedList = allowedIPs.split(',').map((ip) => ip.trim());
    return allowedList.includes(ip) || allowedList.includes('*');
  }

  /**
   * Validate environment configuration for security
   * @returns Array of security warnings
   */
  validateSecurityConfig(): string[] {
    const warnings: string[] = [];

    // Check for required environment variables
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'DATABASE_URL',
      'JWT_SECRET',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD',
    ];

    for (const varName of requiredVars) {
      if (!this.configService.get(varName)) {
        warnings.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Check JWT secret strength
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (jwtSecret && jwtSecret.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long');
    }

    // Check admin password strength
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    if (adminPassword && adminPassword.length < 8) {
      warnings.push('ADMIN_PASSWORD should be at least 8 characters long');
    }

    // Check if running in production without HTTPS
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.WEBHOOK_URL?.startsWith('https://')
    ) {
      warnings.push('Production deployment should use HTTPS');
    }

    return warnings;
  }
}
