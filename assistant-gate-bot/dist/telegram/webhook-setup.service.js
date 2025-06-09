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
var WebhookSetupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSetupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const telegram_service_1 = require("./telegram.service");
let WebhookSetupService = WebhookSetupService_1 = class WebhookSetupService {
    configService;
    telegramService;
    logger = new common_1.Logger(WebhookSetupService_1.name);
    constructor(configService, telegramService) {
        this.configService = configService;
        this.telegramService = telegramService;
    }
    async onModuleInit() {
        if (this.configService.get('NODE_ENV') === 'production') {
            await this.setupWebhook();
        }
    }
    async setupWebhook() {
        const webhookUrl = this.configService.get('WEBHOOK_URL');
        if (!webhookUrl) {
            this.logger.warn('WEBHOOK_URL not configured, skipping webhook setup');
            return;
        }
        try {
            const success = await this.telegramService.setWebhook(webhookUrl);
            if (success) {
                this.logger.log(`✅ Webhook successfully set to: ${webhookUrl}`);
            }
            else {
                this.logger.error('❌ Failed to set webhook');
            }
        }
        catch (error) {
            this.logger.error('Error setting up webhook:', error);
        }
    }
};
exports.WebhookSetupService = WebhookSetupService;
exports.WebhookSetupService = WebhookSetupService = WebhookSetupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        telegram_service_1.TelegramService])
], WebhookSetupService);
//# sourceMappingURL=webhook-setup.service.js.map