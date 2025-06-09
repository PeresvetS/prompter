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
var AdminAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let AdminAuthService = AdminAuthService_1 = class AdminAuthService {
    configService;
    jwtService;
    logger = new common_1.Logger(AdminAuthService_1.name);
    constructor(configService, jwtService) {
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async login(username, password) {
        const adminUsername = this.configService.get('ADMIN_USERNAME') || 'admin';
        const adminPassword = this.configService.get('ADMIN_PASSWORD') || 'admin123';
        this.logger.log(`Attempting login with username: ${username}`);
        this.logger.log(`Expected username: ${adminUsername}, Expected password: ${adminPassword ? '[SET]' : '[NOT SET]'}`);
        if (username !== adminUsername || password !== adminPassword) {
            this.logger.warn(`Failed admin login attempt for username: ${username}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            username: adminUsername,
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
        };
        const jwtSecret = this.configService.get('JWT_SECRET') ||
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
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = AdminAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService])
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map