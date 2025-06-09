import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No token provided for admin access');
      throw new UnauthorizedException('Access token required');
    }

    try {
      const jwtSecret =
        this.configService.get<string>('JWT_SECRET') ||
        'fallback-secret-key-for-development-only';
      const payload = this.jwtService.verify(token, {
        secret: jwtSecret,
      });

      // Check if the token is for admin access
      if (payload.role !== 'admin') {
        this.logger.warn('Invalid role in token for admin access');
        throw new UnauthorizedException('Admin access required');
      }

      request.user = payload;
      return true;
    } catch (error) {
      this.logger.warn('Invalid token for admin access:', error.message);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
