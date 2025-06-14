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
var AdminAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let AdminAuthGuard = AdminAuthGuard_1 = class AdminAuthGuard {
    configService;
    jwtService;
    logger = new common_1.Logger(AdminAuthGuard_1.name);
    constructor(configService, jwtService) {
        this.configService = configService;
        this.jwtService = jwtService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            this.logger.warn('No token provided for admin access');
            throw new common_1.UnauthorizedException('Access token required');
        }
        try {
            const jwtSecret = this.configService.get('JWT_SECRET') ||
                'fallback-secret-key-for-development-only';
            const payload = this.jwtService.verify(token, {
                secret: jwtSecret,
            });
            if (payload.role !== 'admin') {
                this.logger.warn('Invalid role in token for admin access');
                throw new common_1.UnauthorizedException('Admin access required');
            }
            request.user = payload;
            return true;
        }
        catch (error) {
            this.logger.warn('Invalid token for admin access:', error.message);
            throw new common_1.UnauthorizedException('Invalid access token');
        }
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.AdminAuthGuard = AdminAuthGuard;
exports.AdminAuthGuard = AdminAuthGuard = AdminAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService])
], AdminAuthGuard);
//# sourceMappingURL=admin-auth.guard.js.map