import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class AdminAuthService {
    private configService;
    private jwtService;
    private readonly logger;
    constructor(configService: ConfigService, jwtService: JwtService);
    login(username: string, password: string): Promise<{
        access_token: string;
    }>;
    validateToken(token: string): Promise<any>;
}
