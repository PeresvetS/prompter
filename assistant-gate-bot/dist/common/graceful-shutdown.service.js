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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulShutdownService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("./logger.service");
const prisma_service_1 = require("../prisma.service");
let GracefulShutdownService = class GracefulShutdownService {
    logger;
    prisma;
    isShuttingDown = false;
    constructor(logger, prisma) {
        this.logger = logger;
        this.prisma = prisma;
        process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
        process.on('SIGINT', () => this.handleShutdown('SIGINT'));
        process.on('SIGUSR2', () => this.handleShutdown('SIGUSR2'));
    }
    async handleShutdown(signal) {
        if (this.isShuttingDown) {
            this.logger.warn('Shutdown already in progress, ignoring signal', 'Shutdown');
            return;
        }
        this.isShuttingDown = true;
        this.logger.log(`Received ${signal}, starting graceful shutdown...`, 'Shutdown');
        try {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await this.prisma.$disconnect();
            this.logger.log('Database connections closed', 'Shutdown');
            this.logger.log('Graceful shutdown completed', 'Shutdown');
            process.exit(0);
        }
        catch (error) {
            this.logger.error('Error during graceful shutdown', error.stack, 'Shutdown');
            process.exit(1);
        }
    }
    async onApplicationShutdown(signal) {
        if (signal) {
            this.logger.log(`Application shutdown initiated by ${signal}`, 'Shutdown');
        }
    }
    isShutdownInProgress() {
        return this.isShuttingDown;
    }
};
exports.GracefulShutdownService = GracefulShutdownService;
exports.GracefulShutdownService = GracefulShutdownService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.CustomLoggerService,
        prisma_service_1.PrismaService])
], GracefulShutdownService);
//# sourceMappingURL=graceful-shutdown.service.js.map