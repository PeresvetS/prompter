"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma.service");
const telegram_module_1 = require("./telegram/telegram.module");
const user_module_1 = require("./user/user.module");
const openai_module_1 = require("./openai/openai.module");
const subscription_module_1 = require("./subscription/subscription.module");
const admin_module_1 = require("./admin/admin.module");
const logger_service_1 = require("./common/logger.service");
const global_exception_filter_1 = require("./common/global-exception.filter");
const request_logging_middleware_1 = require("./common/request-logging.middleware");
const graceful_shutdown_service_1 = require("./common/graceful-shutdown.service");
const security_service_1 = require("./common/security.service");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logging_middleware_1.RequestLoggingMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            telegram_module_1.TelegramModule,
            user_module_1.UserModule,
            openai_module_1.OpenAIModule,
            subscription_module_1.SubscriptionModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            prisma_service_1.PrismaService,
            logger_service_1.CustomLoggerService,
            security_service_1.SecurityService,
            graceful_shutdown_service_1.GracefulShutdownService,
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
        ],
        exports: [prisma_service_1.PrismaService, logger_service_1.CustomLoggerService, security_service_1.SecurityService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map