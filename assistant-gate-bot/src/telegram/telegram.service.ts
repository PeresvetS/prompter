import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../user/user.service';
import { OpenAIService } from '../openai/openai.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private openaiService: OpenAIService,
    private subscriptionService: SubscriptionService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not provided');
      return;
    }

    // Initialize bot with polling in development, webhook in production
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    this.bot = new TelegramBot(token, {
      polling: !isProduction, // Use polling in development
      webHook: isProduction, // Use webhook in production
    });

    if (isProduction) {
      this.logger.log('Telegram bot initialized in webhook mode');
    } else {
      this.logger.log(
        'Telegram bot initialized in polling mode for development',
      );
      this.setupPollingHandlers();
    }
  }

  private setupPollingHandlers(): void {
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

  /**
   * Получает конфигурацию канала oh_my_zen из переменных окружения
   * @returns Объект с конфигурацией канала
   */
  private getMainChannelnChannelConfig() {
    return {
      username:
        this.configService.get<string>('CHANNEL_MAIN_USERNAME') || 'oh_my_zen',
      url:
        this.configService.get<string>('CHANNEL_MAIN_URL') ||
        'https://t.me/oh_my_zen',
      emoji: this.configService.get<string>('CHANNEL_MAIN_EMOJI') || '📢',
      text: `${this.configService.get<string>('CHANNEL_MAIN_EMOJI') || '📢'} ${this.configService.get<string>('CHANNEL_MAIN_USERNAME') || 'oh_my_zen'}`,
    };
  }

  /**
   * Получает конфигурацию канала avato_ai из переменных окружения
   * @returns Объект с конфигурацией канала
   */
  private getSecondChannelChannelConfig() {
    return {
      username:
        this.configService.get<string>('CHANNEL_SECOND_USERNAME') || 'avato_ai',
      url:
        this.configService.get<string>('CHANNEL_SECOND_URL') ||
        'https://t.me/avato_ai',
      emoji: this.configService.get<string>('CHANNEL_SECOND_EMOJI') || '🎨',
      text: `${this.configService.get<string>('CHANNEL_SECOND_EMOJI') || '🎨'} ${this.configService.get<string>('CHANNEL_SECOND_USERNAME') || 'avato_ai'}`,
    };
  }

  async handleUpdate(update: any): Promise<void> {
    try {
      this.logger.debug(`Received update: ${JSON.stringify(update)}`);

      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      this.logger.error('Error handling update:', error);
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const { chat, from, text, voice } = message;

    this.logger.log(
      `Message from ${from.username || from.first_name}: ${text || (voice ? '[голосовое сообщение]' : '[неизвестный тип]')}`,
    );

    try {
      // Register or update user
      await this.userService.createOrUpdateUser(from);

      // Check if user is banned
      const isBanned = await this.userService.isUserBanned(from.id);
      if (isBanned) {
        await this.sendMessage(
          chat.id,
          '🚫 You have been banned by the administrator.',
        );
        return;
      }

      // Сначала проверяем подписку на все обязательные каналы для любых сообщений
      const { isSubscribed: isInitiallySubscribed } =
        await this.subscriptionService.checkInitialSubscription(from.id);

      if (!isInitiallySubscribed) {
        // Если не подписан на изначальные каналы, всегда показываем приветственное сообщение
        await this.sendWelcomeMessageWithButtons(chat.id);
        return;
      }

      // Handle commands and voice messages
      let messageText = text;

      // Если это голосовое сообщение, сначала расшифруем его
      if (voice) {
        this.logger.debug('Обрабатываем голосовое сообщение...');
        try {
          await this.sendChatAction(chat.id, 'typing');
          messageText = await this.transcribeVoiceMessage(voice.file_id);
          this.logger.log(`Голосовое сообщение расшифровано: ${messageText}`);
        } catch (error) {
          this.logger.error(
            'Ошибка при расшифровке голосового сообщения:',
            error,
          );
          await this.sendMessage(
            chat.id,
            '❌ Не удалось расшифровать голосовое сообщение. Попробуйте отправить текст.',
          );
          return;
        }
      }

      if (messageText === '/start') {
        // Проверяем, первый ли раз у пользователя
        const threadId = await this.userService.getOrCreateThreadId(from.id);
        const isFirstTime = !threadId;

        // Если пользователь уже подписан, отправляем сообщение об успехе
        await this.sendSuccessMessage(chat.id, isFirstTime, from.id);
      } else {
        // Check primary channel subscription for regular messages
        const isPrimarySubscribed =
          await this.subscriptionService.checkPrimarySubscription(from.id);

        if (!isPrimarySubscribed) {
          // Отправляем сообщение о том, что пользователь отписался
          await this.sendUnsubscribedMessage(chat.id);
          return;
        }
        // Check daily limit
        const { canMakeRequest, requestsUsed } =
          await this.userService.checkDailyLimit(from.id);

        if (!canMakeRequest) {
          await this.sendMessage(
            chat.id,
            `Ты отлично поработала(а), приходи завтра продолжить 😉`,
          );
          return;
        }

        // Increment request counter
        await this.userService.incrementDailyRequests(from.id);

        // Show typing action to indicate bot is processing
        await this.sendChatAction(chat.id, 'typing');

        // Process message with OpenAI Assistant
        try {
          // Get or create thread for this user
          let threadId = await this.userService.getOrCreateThreadId(from.id);

          if (!threadId) {
            // Create new thread for user
            threadId = await this.openaiService.createThread();
            if (threadId) {
              await this.userService.saveThreadId(from.id, threadId);
              this.logger.log(
                `Created new thread ${threadId} for user ${from.id}`,
              );
            } else {
              throw new Error('Failed to create OpenAI thread');
            }
          }

          const response = await this.openaiService.processMessage(
            threadId,
            messageText,
          );

          // Отправляем ответ в новом формате
          const formattedResponse = `<b>Твой лимит</b>: ${requestsUsed + 1}/50\n\n<b>Ответ бота</b>: ${response}`;
          await this.sendMessage(chat.id, formattedResponse, {
            parse_mode: 'HTML',
          });
        } catch (error) {
          this.logger.error('OpenAI Assistant processing failed:', error);

          // Fallback ответ в том же формате
          const fallbackResponse = `<b>Твой лимит</b>: ${requestsUsed + 1}/50\n<b>Ответ бота</b>: ${messageText}\n\n⚠️ AI assistant temporarily unavailable`;
          await this.sendMessage(chat.id, fallbackResponse, {
            parse_mode: 'HTML',
          });
        }
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
      await this.sendMessage(
        chat.id,
        '❌ Sorry, something went wrong. Please try again later.',
      );
    }
  }

  /**
   * Отправляет приветственное сообщение с кнопками подписки на каналы
   */
  async sendWelcomeMessageWithButtons(chatId: number): Promise<void> {
    const welcomeText = `Привет 👋🏻

Я помогу тебе создать промпт для Veo3 по методике виральных видео PJ Ace

Сперва подпишись на каналы ниже, чтобы начать. Я бесплатный, потому это наш с тобой справедливый обмен 🤝`;

    // Получаем конфигурацию каналов из ENV
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
    } catch (error) {
      this.logger.error(`Failed to send welcome message to ${chatId}:`, error);
    }
  }

  /**
   * Отправляет сообщение об успешной подписке
   * @param chatId - ID чата
   * @param isFirstTime - Первый ли раз пользователь запускает бота
   */
  async sendSuccessMessage(
    chatId: number,
    isFirstTime: boolean = false,
    userId: number,
  ): Promise<void> {
    try {
      const user = await this.userService.getUserByTelegramId(userId);
      if (user.isBanned) {
        await this.sendMessage(
          chatId,
          '🚫 Мы сожалеем, но ты заблокирован в нашем боте.',
        );
        return;
      }

      if (isFirstTime) {
        // Для первого раза отправляем приветственное сообщение
        await this.bot.sendMessage(
          chatId,
          `Привет 👋🏻

Я помогу тебе создать промпт для Veo3 по методике виральных видео PJ Ace`,
        );

        // Ждем 1 секунду
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Затем отправляем основное сообщение
        const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть 50 запросов в день.`;

        await this.bot.sendMessage(chatId, mainMessage);
      } else {
        // Для повторного /start отправляем только основное сообщение БЕЗ приветствия
        const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть ${50 - user.dailyRequests} запросов на сегодня.`;

        await this.bot.sendMessage(chatId, mainMessage);
      }

      this.logger.debug(
        `Success message sent to ${chatId} (first time: ${isFirstTime})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send success message to ${chatId}:`, error);
    }
  }

  /**
   * Отправляет сообщение о том, что пользователь отписался от канала
   */
  async sendUnsubscribedMessage(chatId: number): Promise<void> {
    const unsubscribedText = `Похоже, ты отписался от канала. Пожалуйста, подпишись обратно, чтобы снова начать использовать этого бота 🙏🏻`;

    // Получаем конфигурацию канала из ENV
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
    } catch (error) {
      this.logger.error(
        `Failed to send unsubscribed message to ${chatId}:`,
        error,
      );
    }
  }

  /**
   * Отправляет сообщение об успешной подписке при нажатии кнопки "Я подписался ✅"
   * Показывает только основное сообщение без приветствия
   * @param chatId - ID чата
   * @param userId - ID пользователя
   */
  async sendSubscriptionSuccessMessage(
    chatId: number,
    userId: number,
  ): Promise<void> {
    try {
      const user = await this.userService.getUserByTelegramId(userId);
      if (user.isBanned) {
        await this.sendMessage(
          chatId,
          '🚫 Мы сожалеем, но ты заблокирован в нашем боте.',
        );
        return;
      }
      await this.sendMessage(chatId, 'Отлично! ✅');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Отправляем только основное сообщение без приветствия
      const mainMessage = `✨ Напиши или расскажи голосом свою идею, и я задам тебе до 6 вопросов для уточнения, а затем выдам промпт по методике PJ Ace.

💡 У тебя есть ${50 - user.dailyRequests} запросов на сегодня.`;

      await this.bot.sendMessage(chatId, mainMessage);

      this.logger.debug(
        `Subscription success message sent to ${chatId} (from button)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription success message to ${chatId}:`,
        error,
      );
    }
  }

  async sendMessage(
    chatId: number,
    text: string,
    options?: any,
  ): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, text, options);
      this.logger.debug(`Message sent to ${chatId}: ${text}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}:`, error);
    }
  }

  async sendChatAction(chatId: number, action: any): Promise<void> {
    try {
      await this.bot.sendChatAction(chatId, action);
      this.logger.debug(`Chat action sent to ${chatId}: ${action}`);
    } catch (error) {
      this.logger.error(`Failed to send chat action to ${chatId}:`, error);
    }
  }

  async setWebhook(url: string): Promise<boolean> {
    try {
      const result = await this.bot.setWebHook(url);
      this.logger.log(`Webhook set to: ${url}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to set webhook:', error);
      return false;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      return await this.bot.getWebHookInfo();
    } catch (error) {
      this.logger.error('Failed to get webhook info:', error);
      return null;
    }
  }

  /**
   * Обрабатывает нажатия на inline кнопки
   * @param query - Объект callback_query от Telegram
   */
  private async handleCallbackQuery(query: any): Promise<void> {
    const { id, data, from, message } = query;

    this.logger.log(
      `Callback query from ${from.username || from.first_name}: ${data}`,
    );

    try {
      // Отвечаем на callback query чтобы убрать "loading" состояние
      await this.bot.answerCallbackQuery(id);

      if (data === 'check_subscription') {
        await this.handleSubscriptionCheck(from, message.chat.id);
      }
    } catch (error) {
      this.logger.error('Error handling callback query:', error);
      // Все равно отвечаем на callback query даже при ошибке
      try {
        await this.bot.answerCallbackQuery(id, {
          text: '❌ Произошла ошибка. Попробуйте еще раз.',
          show_alert: true,
        });
      } catch (answerError) {
        this.logger.error('Error answering callback query:', answerError);
      }
    }
  }

  /**
   * Проверяет подписку пользователя при нажатии кнопки "Я подписался ✅"
   * @param from - Объект пользователя
   * @param chatId - ID чата
   */
  private async handleSubscriptionCheck(
    from: any,
    chatId: number,
  ): Promise<void> {
    try {
      // Register or update user first
      await this.userService.createOrUpdateUser(from);

      // Check if user is banned
      const isBanned = await this.userService.isUserBanned(from.id);
      if (isBanned) {
        await this.sendMessage(
          chatId,
          '🚫 You have been banned by the administrator.',
        );
        return;
      }

      // Проверяем подписку на все обязательные каналы
      const { isSubscribed } =
        await this.subscriptionService.checkInitialSubscription(from.id);

      if (isSubscribed) {
        // При нажатии кнопки "Я подписался" НЕ показываем приветственное сообщение
        // Показываем только основное сообщение
        await this.sendSubscriptionSuccessMessage(chatId, from.id);
      } else {
        // Пользователь не подписан - отправляем сообщение об ошибке
        await this.sendSubscriptionErrorMessage(chatId);
      }
    } catch (error) {
      this.logger.error('Error in handleSubscriptionCheck:', error);
      await this.sendMessage(
        chatId,
        '❌ Произошла ошибка при проверке подписки. Попробуйте еще раз.',
      );
    }
  }

  /**
   * Отправляет сообщение об ошибке подписки
   * @param chatId - ID чата
   */
  private async sendSubscriptionErrorMessage(chatId: number): Promise<void> {
    const errorText = `Извини, но похоже ты ещё не подписался
Тебе нужно подписаться на оба канала ниже, чтобы начать.`;

    // Получаем конфигурацию каналов из ENV
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
    } catch (error) {
      this.logger.error(
        `Failed to send subscription error message to ${chatId}:`,
        error,
      );
    }
  }

  /**
   * Расшифровывает голосовое сообщение из Telegram с помощью Whisper API
   * @param fileId - ID файла в Telegram
   * @returns Расшифрованный текст
   */
  private async transcribeVoiceMessage(fileId: string): Promise<string> {
    try {
      this.logger.debug(`Скачиваем голосовое сообщение: ${fileId}`);

      // Получаем информацию о файле
      const fileInfo = await this.bot.getFile(fileId);
      const filePath = fileInfo.file_path;

      if (!filePath) {
        throw new Error('Не удалось получить путь к файлу');
      }

      // Скачиваем файл как буфер
      const fileBuffer = await this.bot.downloadFile(fileId, './');

      if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
        throw new Error('Не удалось скачать аудио файл');
      }

      // Генерируем имя файла для определения формата
      const fileName = `voice_${fileId}.ogg`;

      // Отправляем в OpenAI Whisper для расшифровки
      const transcription = await this.openaiService.transcribeAudio(
        fileBuffer,
        fileName,
      );

      if (!transcription || transcription.trim().length === 0) {
        throw new Error('Не удалось распознать речь в аудио сообщении');
      }

      return transcription.trim();
    } catch (error) {
      this.logger.error('Ошибка при расшифровке голосового сообщения:', error);
      throw error;
    }
  }
}
