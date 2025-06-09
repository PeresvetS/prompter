"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const helmet_1 = require("helmet");
const express_rate_limit_1 = require("express-rate-limit");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./common/logger.service");
const security_service_1 = require("./common/security.service");
const common_2 = require("@nestjs/common");
const dotenv = require("dotenv");
dotenv.config();
async function bootstrap() {
    const logger = new common_2.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const customLogger = app.get(logger_service_1.CustomLoggerService);
    const securityService = app.get(security_service_1.SecurityService);
    const securityWarnings = securityService.validateSecurityConfig();
    if (securityWarnings.length > 0) {
        customLogger.warn('Security configuration warnings:', 'Security');
        securityWarnings.forEach((warning) => customLogger.warn(warning, 'Security'));
    }
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    }));
    app.use('/admin', (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.use('/telegram', (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 60,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public', 'admin'), {
        prefix: '/admin/assets/',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    app.use(/^\/admin\/(?!users|login|stats|health|assets).*/, (req, res) => {
        res.sendFile((0, path_1.join)(__dirname, '..', 'public', 'admin', 'index.html'));
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📊 Admin panel available at: http://localhost:${port}/admin/`);
    logger.log(`🔒 Security features enabled: Helmet, Rate Limiting, Input Validation`, 'Bootstrap');
    if (process.env.NODE_ENV === 'production') {
        logger.log(`🌐 Production mode: Enhanced security enabled`, 'Bootstrap');
    }
}
bootstrap().catch((error) => {
    console.error('❌ Failed to start the application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map