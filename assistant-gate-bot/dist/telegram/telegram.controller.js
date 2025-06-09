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
var TelegramController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("./telegram.service");
const security_service_1 = require("../common/security.service");
let TelegramController = TelegramController_1 = class TelegramController {
    telegramService;
    securityService;
    logger = new common_1.Logger(TelegramController_1.name);
    constructor(telegramService, securityService) {
        this.telegramService = telegramService;
        this.securityService = securityService;
    }
    async handleWebhook(update, secretToken) {
        try {
            const isValidSignature = this.securityService.verifyTelegramWebhook(JSON.stringify(update), secretToken);
            if (!isValidSignature) {
                this.logger.warn('Invalid webhook signature detected');
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
            this.logger.debug('Webhook received');
            await this.telegramService.handleUpdate(update);
            return { status: 'ok' };
        }
        catch (error) {
            this.logger.error('Error handling webhook:', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            return { status: 'error' };
        }
    }
    async getWebhookInfo() {
        return await this.telegramService.getWebhookInfo();
    }
    async setWebhook(url) {
        const success = await this.telegramService.setWebhook(url);
        return { success };
    }
};
exports.TelegramController = TelegramController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-telegram-bot-api-secret-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('webhook-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getWebhookInfo", null);
__decorate([
    (0, common_1.Post)('set-webhook'),
    __param(0, (0, common_1.Body)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "setWebhook", null);
exports.TelegramController = TelegramController = TelegramController_1 = __decorate([
    (0, common_1.Controller)('telegram'),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        security_service_1.SecurityService])
], TelegramController);
//# sourceMappingURL=telegram.controller.js.map