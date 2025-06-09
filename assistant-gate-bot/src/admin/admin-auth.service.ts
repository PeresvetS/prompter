import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // Temporarily hardcode credentials for development
    const adminUsername =
      this.configService.get<string>('ADMIN_USERNAME') || 'admin';
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';

    this.logger.log(`Attempting login with username: ${username}`);
    this.logger.log(
      `Expected username: ${adminUsername}, Expected password: ${adminPassword ? '[SET]' : '[NOT SET]'}`,
    );

    // Simple username/password check (in production, you'd hash the password)
    if (username !== adminUsername || password !== adminPassword) {
      this.logger.warn(`Failed admin login attempt for username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: adminUsername,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
    };

    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'fallback-secret-key-for-development-only';

    const token = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '24h',
    });

    this.logger.log(`Admin login successful for: ${username}`);

    return {
      access_token: token,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
