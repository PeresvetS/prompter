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
exports.RequestLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("./logger.service");
let RequestLoggingMiddleware = class RequestLoggingMiddleware {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    use(req, res, next) {
        const startTime = Date.now();
        const { method, originalUrl, ip, headers } = req;
        const userAgent = headers['user-agent'] || '';
        this.logger.log(`Incoming ${method} ${originalUrl} from ${ip}`, 'RequestLogging');
        const originalEnd = res.end;
        const logger = this.logger;
        res.end = function (chunk, encoding, cb) {
            const duration = Date.now() - startTime;
            const { statusCode } = res;
            const contentLength = res.get('content-length') || 0;
            logger.logApiCall(method, originalUrl, statusCode, duration, 'RequestLogging');
            if (duration > 1000) {
                logger.warn(`Slow request: ${method} ${originalUrl} took ${duration}ms`, 'Performance');
            }
            if (statusCode >= 400) {
                logger.warn(`Error response: ${method} ${originalUrl} - ${statusCode}`, 'RequestLogging');
            }
            return originalEnd.call(res, chunk, encoding, cb);
        };
        next();
    }
};
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
exports.RequestLoggingMiddleware = RequestLoggingMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.CustomLoggerService])
], RequestLoggingMiddleware);
//# sourceMappingURL=request-logging.middleware.js.map