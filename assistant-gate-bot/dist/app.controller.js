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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const logger_service_1 = require("./common/logger.service");
const path_1 = require("path");
let AppController = class AppController {
    appService;
    prisma;
    logger;
    constructor(appService, prisma, logger) {
        this.appService = appService;
        this.prisma = prisma;
        this.logger = logger;
    }
    getHello() {
        return this.appService.getHello();
    }
    async getHealth() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const dbStatus = 'healthy';
            const dbResponseTime = Date.now() - startTime;
            const loggerStatus = this.logger.isHealthy() ? 'healthy' : 'unhealthy';
            const healthData = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                services: {
                    database: {
                        status: dbStatus,
                        responseTime: `${dbResponseTime}ms`,
                    },
                    logger: {
                        status: loggerStatus,
                    },
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                },
            };
            this.logger.debug('Health check performed', 'HealthCheck');
            return healthData;
        }
        catch (error) {
            this.logger.error('Health check failed', error.stack, 'HealthCheck');
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                error: 'Database connection failed',
                services: {
                    database: {
                        status: 'unhealthy',
                        error: error.message,
                    },
                    logger: {
                        status: this.logger.isHealthy() ? 'healthy' : 'unhealthy',
                    },
                },
            };
        }
    }
    serveAdminRoot(res) {
        const indexPath = (0, path_1.join)(__dirname, '..', 'public', 'admin', 'index.html');
        res.sendFile(indexPath);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('admin'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "serveAdminRoot", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        prisma_service_1.PrismaService,
        logger_service_1.CustomLoggerService])
], AppController);
//# sourceMappingURL=app.controller.js.map