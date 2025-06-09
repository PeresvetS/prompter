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
exports.CustomLoggerService = void 0;
const common_1 = require("@nestjs/common");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
let CustomLoggerService = class CustomLoggerService {
    logger;
    constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            defaultMeta: { service: 'assistant-gate-bot' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const contextStr = context ? `[${context}] ` : '';
                        const metaStr = Object.keys(meta).length
                            ? ` ${JSON.stringify(meta)}`
                            : '';
                        return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
                    })),
                }),
            ],
        });
        if (process.env.NODE_ENV === 'production') {
            this.logger.add(new DailyRotateFile({
                filename: 'logs/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                maxSize: '20m',
                maxFiles: '14d',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }));
            this.logger.add(new DailyRotateFile({
                filename: 'logs/combined-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '7d',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }));
        }
    }
    log(message, context) {
        this.logger.info(message, { context });
    }
    error(message, trace, context) {
        this.logger.error(message, { trace, context });
    }
    warn(message, context) {
        this.logger.warn(message, { context });
    }
    debug(message, context) {
        this.logger.debug(message, { context });
    }
    verbose(message, context) {
        this.logger.verbose(message, { context });
    }
    logApiCall(method, url, statusCode, duration, context) {
        this.logger.info('API Call', {
            method,
            url,
            statusCode,
            duration,
            context: context || 'API',
        });
    }
    logTelegramEvent(event, userId, messageId, context) {
        this.logger.info('Telegram Event', {
            event,
            userId,
            messageId,
            context: context || 'Telegram',
        });
    }
    logDatabaseOperation(operation, table, duration, context) {
        this.logger.info('Database Operation', {
            operation,
            table,
            duration,
            context: context || 'Database',
        });
    }
    logSecurityEvent(event, userId, ip, context) {
        this.logger.warn('Security Event', {
            event,
            userId,
            ip,
            context: context || 'Security',
        });
    }
    isHealthy() {
        try {
            this.logger.info('Health check performed');
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CustomLoggerService);
//# sourceMappingURL=logger.service.js.map