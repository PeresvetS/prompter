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
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const TelegramBot = require("node-telegram-bot-api");
const user_service_1 = require("../user/user.service");
const openai_service_1 = require("../openai/openai.service");
const subscription_service_1 = require("../subscription/subscription.service");
let TelegramService = TelegramService_1 = class TelegramService {
    configService;
    userService;
    openaiService;
    subscriptionService;
    logger = new common_1.Logger(TelegramService_1.name);
    bot;
    constructor(configService, userService, openaiService, subscriptionService) {
        this.configService = configService;
        this.userService = userService;
        this.openaiService = openaiService;
        this.subscriptionService = subscriptionService;
        const token = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (!token) {
            this.logger.error('TELEGRAM_BOT_TOKEN is not provided');
            return;
        }
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        this.bot = new TelegramBot(token, {
            polling: !isProduction,
            webHook: isProduction,
        });
        if (isProduction) {
            this.logger.log('Telegram bot initialized in webhook mode');
        }
        else {
            this.logger.log('Telegram bot initialized in polling mode for development');
            this.setupPollingHandlers();
        }
    }
    setupPollingHandlers() {
        this.bot.on('message', async (msg) => {
            await this.handleMessage(msg);
        });
        this.bot.on('callback_query', async (query) => {
            await this.handleCallbackQuery(query);
        });
        this.bot.on('polling_error', (error) => {
            this.logger.error('Polling error:', error);
        });
        this.logger.log('Polling message handlers set up');
    }
    getMainChannelnChannelConfig() {
        return {
            username: this.configService.get('CHANNEL_MAIN_USERNAME') || 'oh_my_zen',
            url: this.configService.get('CHANNEL_MAIN_URL') ||
                'https://t.me/oh_my_zen',
            emoji: this.configService.get('CHANNEL_MAIN_EMOJI') || '📢',
            text: `${this.configService.get('CHANNEL_MAIN_EMOJI') || '📢'} ${this.configService.get('CHANNEL_MAIN_USERNAME') || 'oh_my_zen'}`,
        };
    }
    getSecondChannelChannelConfig() {
        return {
            username: this.configService.get('CHANNEL_SECOND_USERNAME') || 'avato_ai',
            url: this.configService.get('CHANNEL_SECOND_URL') ||
                'https://t.me/avato_ai',
            emoji: this.configService.get('CHANNEL_SECOND_EMOJI') || '🎨',
            text: `${this.configService.get('CHANNEL_SECOND_EMOJI') || '🎨'} ${this.configService.get('CHANNEL_SECOND_USERNAME') || 'avato_ai'}`,
        };
    }
    async handleUpdate(update) {
        try {
            this.logger.debug(`Received update: ${JSON.stringify(update)}`);
            if (update.message) {
                await this.handleMessage(update.message);
            }
            else if (update.callback_query) {
                await this.handleCallbackQuery(update.callback_query);
            }
        }
        catch (error) {
            this.logger.error('Error handling update:', error);
        }
    }
    async handleMessage(message) {
        const { chat, from, text, voice } = message;
        this.logger.log(`Message from ${from.username || from.first_name}: ${text || (voice ? '[голосовое сообщение]' : '[неизвестный тип]')}`);
        try {
            await this.userService.createOrUpdateUser(from);
            const isBanned = await this.userService.isUserBanned(from.id);
            if (isBanned) {
                await this.sendMessage(chat.id, '🚫 You have been banned by the administrator.');
                return;
            }
            const { isSubscribed: isInitiallySubscribed } = await this.subscriptionService.checkInitialSubscription(from.id);
            if (!isInitiallySubscribed) {
                await this.sendWelcomeMessageWithButtons(chat.id);
                return;
            }
            let messageText = text;
            if (voice) {
                this.logger.debug('Обрабатываем голосовое сообщение...');
                try {
                    await this.sendChatAction(chat.id, 'typing');
                    messageText = await this.transcribeVoiceMessage(voice.file_id);
                    this.logger.log(`Голосовое сообщение расшифровано: ${messageText}`);
                }
                catch (error) {
                    this.logger.error('Ошибка при расшифровке голосового сообщения:', error);
                    await this.sendMessage(chat.id, '❌ Не удалось расшифровать голосовое сообщение. Попробуйте отправить текст.');
                    return;
                }
            }
            if (messageText === '/start') {
                const threadId = await this.userService.getOrCreateThreadId(from.id);
                const isFirstTime = !threadId;
                await this.sendSuccessMessage(chat.id, isFirstTime, from.id);
            }
            else {
                const isPrimarySubscribed = await this.subscriptionService.checkPrimarySubscription(from.id);
                if (!isPrimarySubscribed) {
                    await this.sendUnsubscribedMessage(chat.id);
                    return;
                }
                const { canMakeRequest, requestsUsed } = await this.userService.checkDailyLimit(from.id);
                if (!canMakeRequest) {
                    await this.sendMessage(chat.id, `Ты отлично поработала(а), приходи завтра продолжить 😉`);
                    return;
                }
                await this.userService.incrementDailyRequests(from.id);
                await this.sendChatAction(chat.id, 'typing');
                try {
                    let threadId = await this.userService.getOrCreateThreadId(from.id);
                    if (!threadId) {
                        threadId = await this.openaiService.createThread();
                        if (threadId) {
                            await this.userService.saveThreadId(from.id, threadId);
                            this.logger.log(`Created new thread ${threadId} for user ${from.id}`);
                        }
                        else {
                            throw new Error('Failed to create OpenAI thread');
                        }
                    }
                    const response = await this.openaiService.processMessage(threadId, messageText);
                    const formattedResponse = `<b>Твой лимит</b>: ${requestsUsed + 1}/50\n\n<b>Ответ бота</b>: ${response}`;
                    await this.sendMessage(chat.id, formattedResponse, {
                        parse_mode: 'HTML',
                    });
                }
                catch (error) {
                    this.logger.error('OpenAI Assistant processing failed:', error);
                    const fallbackResponse = `<b>Твой лимит</b>: ${requestsUsed + 1}/50\n<b>Ответ бота</b>: ${messageText}\n\n⚠️ AI assistant temporarily unavailable`;
                    await this.sendMessage(chat.id, fallbackResponse, {
                        parse_mode: 'HTML',
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Error handling message:', error);
            await this.sendMessage(chat.id, '❌ Sorry, something went wrong. Please try again later.');
        }
    }
    async sendWelcomeMessageWithButtons(chatId) {
        const welcomeText = `Привет 👋🏻

Я помогу тебе создать промпт для Veo3 по методике виральных видео PJ Ace

Сперва подпишись на каналы ниже, чтобы начать. Я бесплатный, потому это наш с тобой справедливый обмен 🤝`;
        const mainChannelnConfig = this.getMainChannelnChannelConfig();
        const secondChannelConfig = this.getSecondChannelChannelConfig();
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: mainChannelnConfig.text,
                        url: mainChannelnConfig.url,
                    },
                    {
                        text: secondChannelConfig.text,
                        url: secondChannelConfig.url,
                    },
                ],
                [
                    {
                        text: 'Я подписался ✅',
                        callback_data: 'check_subscription',
                    },
                ],
            ],
        };
        try {
            await this.bot.sendMessage(chatId, welcomeText, {
                reply_markup: keyboard,
            });
            this.logger.debug(`Welcome message with buttons sent to ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send welcome message to ${chatId}:`, error);
        }
    }
    async sendSuccessMessage(chatId, isFirstTime = false, userId) {
        try {
            const user = await this.userService.getUserByTelegramId(userId);
            if (user.isBanned) {
                await this.sendMessage(chatId, '🚫 Мы сожалеем, но ты заблокирован в нашем боте.');
                return;
            }
            if (isFirstTime) {
                await this.bot.sendMessage(chatId, `Привет 👋🏻

Я помогу тебе создать промпт для Veo3 по методике виральных видео PJ Ace`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть 50 запросов в день.`;
                await this.bot.sendMessage(chatId, mainMessage);
            }
            else {
                const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть ${50 - user.dailyRequests} запросов на сегодня.`;
                await this.bot.sendMessage(chatId, mainMessage);
            }
            this.logger.debug(`Success message sent to ${chatId} (first time: ${isFirstTime})`);
        }
        catch (error) {
            this.logger.error(`Failed to send success message to ${chatId}:`, error);
        }
    }
    async sendUnsubscribedMessage(chatId) {
        const unsubscribedText = `Похоже, ты отписался от канала. Пожалуйста, подпишись обратно, чтобы снова начать использовать этого бота 🙏🏻`;
        const mainChannelnConfig = this.getMainChannelnChannelConfig();
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: `${mainChannelnConfig.emoji} Подписаться на ${mainChannelnConfig.username}`,
                        url: mainChannelnConfig.url,
                    },
                ],
            ],
        };
        try {
            await this.bot.sendMessage(chatId, unsubscribedText, {
                reply_markup: keyboard,
            });
            this.logger.debug(`Unsubscribed message sent to ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send unsubscribed message to ${chatId}:`, error);
        }
    }
    async sendSubscriptionSuccessMessage(chatId, userId) {
        try {
            const user = await this.userService.getUserByTelegramId(userId);
            if (user.isBanned) {
                await this.sendMessage(chatId, '🚫 Мы сожалеем, но ты заблокирован в нашем боте.');
                return;
            }
            await this.sendMessage(chatId, 'Отлично! ✅');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть ${50 - user.dailyRequests} запросов на сегодня.`;
            await this.bot.sendMessage(chatId, mainMessage);
            this.logger.debug(`Subscription success message sent to ${chatId} (from button)`);
        }
        catch (error) {
            this.logger.error(`Failed to send subscription success message to ${chatId}:`, error);
        }
    }
    async sendMessage(chatId, text, options) {
        try {
            await this.bot.sendMessage(chatId, text, options);
            this.logger.debug(`Message sent to ${chatId}: ${text}`);
        }
        catch (error) {
            this.logger.error(`Failed to send message to ${chatId}:`, error);
        }
    }
    async sendChatAction(chatId, action) {
        try {
            await this.bot.sendChatAction(chatId, action);
            this.logger.debug(`Chat action sent to ${chatId}: ${action}`);
        }
        catch (error) {
            this.logger.error(`Failed to send chat action to ${chatId}:`, error);
        }
    }
    async setWebhook(url) {
        try {
            const result = await this.bot.setWebHook(url);
            this.logger.log(`Webhook set to: ${url}`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to set webhook:', error);
            return false;
        }
    }
    async getWebhookInfo() {
        try {
            return await this.bot.getWebHookInfo();
        }
        catch (error) {
            this.logger.error('Failed to get webhook info:', error);
            return null;
        }
    }
    async handleCallbackQuery(query) {
        const { id, data, from, message } = query;
        this.logger.log(`Callback query from ${from.username || from.first_name}: ${data}`);
        try {
            await this.bot.answerCallbackQuery(id);
            if (data === 'check_subscription') {
                await this.handleSubscriptionCheck(from, message.chat.id);
            }
        }
        catch (error) {
            this.logger.error('Error handling callback query:', error);
            try {
                await this.bot.answerCallbackQuery(id, {
                    text: '❌ Произошла ошибка. Попробуйте еще раз.',
                    show_alert: true,
                });
            }
            catch (answerError) {
                this.logger.error('Error answering callback query:', answerError);
            }
        }
    }
    async handleSubscriptionCheck(from, chatId) {
        try {
            await this.userService.createOrUpdateUser(from);
            const isBanned = await this.userService.isUserBanned(from.id);
            if (isBanned) {
                await this.sendMessage(chatId, '🚫 You have been banned by the administrator.');
                return;
            }
            const { isSubscribed } = await this.subscriptionService.checkInitialSubscription(from.id);
            if (isSubscribed) {
                await this.sendSubscriptionSuccessMessage(chatId, from.id);
            }
            else {
                await this.sendSubscriptionErrorMessage(chatId);
            }
        }
        catch (error) {
            this.logger.error('Error in handleSubscriptionCheck:', error);
            await this.sendMessage(chatId, '❌ Произошла ошибка при проверке подписки. Попробуйте еще раз.');
        }
    }
    async sendSubscriptionErrorMessage(chatId) {
        const errorText = `Извини, но похоже ты ещё не подписался
Тебе нужно подписаться на оба канала ниже, чтобы начать.`;
        const mainChannelnConfig = this.getMainChannelnChannelConfig();
        const secondChannelConfig = this.getSecondChannelChannelConfig();
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: mainChannelnConfig.text,
                        url: mainChannelnConfig.url,
                    },
                    {
                        text: secondChannelConfig.text,
                        url: secondChannelConfig.url,
                    },
                ],
                [
                    {
                        text: 'Я подписался ✅',
                        callback_data: 'check_subscription',
                    },
                ],
            ],
        };
        try {
            await this.bot.sendMessage(chatId, errorText, {
                reply_markup: keyboard,
            });
            this.logger.debug(`Subscription error message sent to ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send subscription error message to ${chatId}:`, error);
        }
    }
    async transcribeVoiceMessage(fileId) {
        try {
            this.logger.debug(`Скачиваем голосовое сообщение: ${fileId}`);
            const fileInfo = await this.bot.getFile(fileId);
            const filePath = fileInfo.file_path;
            if (!filePath) {
                throw new Error('Не удалось получить путь к файлу');
            }
            const fileBuffer = await this.bot.downloadFile(fileId, './');
            if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
                throw new Error('Не удалось скачать аудио файл');
            }
            const fileName = `voice_${fileId}.ogg`;
            const transcription = await this.openaiService.transcribeAudio(fileBuffer, fileName);
            if (!transcription || transcription.trim().length === 0) {
                throw new Error('Не удалось распознать речь в аудио сообщении');
            }
            return transcription.trim();
        }
        catch (error) {
            this.logger.error('Ошибка при расшифровке голосового сообщения:', error);
            throw error;
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_service_1.UserService,
        openai_service_1.OpenAIService,
        subscription_service_1.SubscriptionService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map