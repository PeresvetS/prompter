"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let SecurityService = SecurityService_1 = class SecurityService {
    configService;
    logger = new common_1.Logger(SecurityService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    verifyTelegramWebhook(body, signature) {
        try {
            const secretToken = this.configService.get('TELEGRAM_SECRET_TOKEN');
            if (!secretToken) {
                this.logger.warn('TELEGRAM_SECRET_TOKEN not configured, skipping webhook verification');
                return true;
            }
            if (!signature) {
                this.logger.warn('No signature provided for webhook verification');
                return false;
            }
            const isValid = signature === secretToken;
            if (!isValid) {
                this.logger.warn('Invalid webhook signature detected');
            }
            return isValid;
        }
        catch (error) {
            this.logger.error('Error verifying webhook signature:', error);
            return false;
        }
    }
    sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        return input
            .replace(/[<>\"']/g, '')
            .trim()
            .substring(0, 1000);
    }
    isValidTelegramUserId(userId) {
        return (typeof userId === 'number' &&
            userId > 0 &&
            userId < Number.MAX_SAFE_INTEGER);
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    isAllowedIP(ip) {
        const allowedIPs = this.configService.get('ALLOWED_IPS');
        if (!allowedIPs) {
            return true;
        }
        const allowedList = allowedIPs.split(',').map((ip) => ip.trim());
        return allowedList.includes(ip) || allowedList.includes('*');
    }
    validateSecurityConfig() {
        const warnings = [];
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
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (jwtSecret && jwtSecret.length < 32) {
            warnings.push('JWT_SECRET should be at least 32 characters long');
        }
        const adminPassword = this.configService.get('ADMIN_PASSWORD');
        if (adminPassword && adminPassword.length < 8) {
            warnings.push('ADMIN_PASSWORD should be at least 8 characters long');
        }
        if (process.env.NODE_ENV === 'production' &&
            !process.env.WEBHOOK_URL?.startsWith('https://')) {
            warnings.push('Production deployment should use HTTPS');
        }
        return warnings;
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = SecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map