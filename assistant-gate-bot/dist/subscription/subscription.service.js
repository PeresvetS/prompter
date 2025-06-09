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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const TelegramBot = require("node-telegram-bot-api");
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    configService;
    logger = new common_1.Logger(SubscriptionService_1.name);
    bot;
    initialChannelIds;
    primaryChannelId;
    constructor(configService) {
        this.configService = configService;
        const token = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (!token) {
            this.logger.error('TELEGRAM_BOT_TOKEN is not provided');
            return;
        }
        this.bot = new TelegramBot(token, { polling: false });
        const initialChannelsString = this.configService.get('INITIAL_CHANNEL_IDS', '');
        this.initialChannelIds = initialChannelsString
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0);
        this.primaryChannelId = this.configService.get('PRIMARY_CHANNEL_ID', '');
        this.logger.log(`Subscription service initialized with ${this.initialChannelIds.length} initial channels`);
    }
    async checkInitialSubscription(userId) {
        const missingChannels = [];
        if (this.initialChannelIds.length === 0) {
            this.logger.warn('No initial channel IDs configured');
            return { isSubscribed: true, missingChannels: [] };
        }
        for (const channelId of this.initialChannelIds) {
            try {
                const isSubscribed = await this.checkSubscription(userId, channelId);
                if (!isSubscribed) {
                    missingChannels.push(channelId);
                }
            }
            catch (error) {
                this.logger.error(`Error checking subscription for channel ${channelId}:`, error);
                missingChannels.push(channelId);
            }
        }
        return {
            isSubscribed: missingChannels.length === 0,
            missingChannels,
        };
    }
    async checkPrimarySubscription(userId) {
        if (!this.primaryChannelId) {
            this.logger.warn('No primary channel ID configured');
            return true;
        }
        try {
            return await this.checkSubscription(userId, this.primaryChannelId);
        }
        catch (error) {
            this.logger.error(`Error checking primary subscription:`, error);
            return false;
        }
    }
    async checkSubscription(userId, channelId) {
        try {
            this.logger.debug(`Checking subscription for user ${userId} in channel ${channelId}`);
            const member = await this.getChatMember(channelId, userId);
            if (!member) {
                return false;
            }
            const validStatuses = ['member', 'administrator', 'creator'];
            const isSubscribed = validStatuses.includes(member.status);
            this.logger.debug(`User ${userId} status in ${channelId}: ${member.status} (subscribed: ${isSubscribed})`);
            return isSubscribed;
        }
        catch (error) {
            this.logger.error(`Error checking subscription for user ${userId} in channel ${channelId}:`, error);
            return false;
        }
    }
    async getChatMember(chatId, userId) {
        try {
            const maxRetries = 3;
            const retryDelay = 1000;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const member = await this.bot.getChatMember(chatId, userId);
                    return member;
                }
                catch (error) {
                    this.logger.debug(`Attempt ${attempt}/${maxRetries} failed for getChatMember:`, error.message);
                    if (error.code === 400 || error.code === 403) {
                        throw error;
                    }
                    if (attempt === maxRetries) {
                        throw error;
                    }
                    await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    getInitialChannelIds() {
        return [...this.initialChannelIds];
    }
    getPrimaryChannelId() {
        return this.primaryChannelId;
    }
    createSubscriptionMessage(missingChannels) {
        if (missingChannels.length === 0) {
            return '✅ You are subscribed to all required channels!';
        }
        const channelLinks = missingChannels.map((id) => `• ${id}`).join('\n');
        return `🔒 Please subscribe to the following channels to use this bot:\n\n${channelLinks}\n\nAfter subscribing, send /start again to verify your subscription.`;
    }
    async checkHealth() {
        try {
            if (!this.bot) {
                return false;
            }
            await this.bot.getMe();
            return true;
        }
        catch (error) {
            this.logger.error('Subscription service health check failed:', error);
            return false;
        }
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map