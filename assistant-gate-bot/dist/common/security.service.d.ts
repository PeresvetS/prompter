import { ConfigService } from '@nestjs/config';
export declare class SecurityService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    verifyTelegramWebhook(body: string, signature?: string): boolean;
    sanitizeInput(input: string): string;
    isValidTelegramUserId(userId: any): boolean;
    generateSecureToken(length?: number): string;
    hashData(data: string): string;
    isAllowedIP(ip: string): boolean;
    validateSecurityConfig(): string[];
}
