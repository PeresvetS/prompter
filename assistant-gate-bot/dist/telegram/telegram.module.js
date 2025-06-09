"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const telegram_controller_1 = require("./telegram.controller");
const telegram_service_1 = require("./telegram.service");
const webhook_setup_service_1 = require("./webhook-setup.service");
const user_module_1 = require("../user/user.module");
const openai_module_1 = require("../openai/openai.module");
const subscription_module_1 = require("../subscription/subscription.module");
const security_service_1 = require("../common/security.service");
let TelegramModule = class TelegramModule {
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = __decorate([
    (0, common_1.Module)({
        imports: [user_module_1.UserModule, openai_module_1.OpenAIModule, subscription_module_1.SubscriptionModule],
        controllers: [telegram_controller_1.TelegramController],
        providers: [telegram_service_1.TelegramService, webhook_setup_service_1.WebhookSetupService, security_service_1.SecurityService],
        exports: [telegram_service_1.TelegramService],
    })
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map