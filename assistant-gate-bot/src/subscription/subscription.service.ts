import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private bot: TelegramBot;
  private initialChannelIds: string[];
  private primaryChannelId: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not provided');
      return;
    }

    this.bot = new TelegramBot(token, { polling: false });

    // Parse channel IDs from environment
    const initialChannelsString = this.configService.get<string>(
      'INITIAL_CHANNEL_IDS',
      '',
    );
    this.initialChannelIds = initialChannelsString
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    this.primaryChannelId = this.configService.get<string>(
      'PRIMARY_CHANNEL_ID',
      '',
    );

    this.logger.log(
      `Subscription service initialized with ${this.initialChannelIds.length} initial channels`,
    );
  }

  async checkInitialSubscription(
    userId: number,
  ): Promise<{ isSubscribed: boolean; missingChannels: string[] }> {
    const missingChannels: string[] = [];

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
      } catch (error) {
        this.logger.error(
          `Error checking subscription for channel ${channelId}:`,
          error,
        );
        // If we can't check, assume not subscribed
        missingChannels.push(channelId);
      }
    }

    return {
      isSubscribed: missingChannels.length === 0,
      missingChannels,
    };
  }

  async checkPrimarySubscription(userId: number): Promise<boolean> {
    if (!this.primaryChannelId) {
      this.logger.warn('No primary channel ID configured');
      return true;
    }

    try {
      return await this.checkSubscription(userId, this.primaryChannelId);
    } catch (error) {
      this.logger.error(`Error checking primary subscription:`, error);
      return false;
    }
  }

  async checkSubscription(userId: number, channelId: string): Promise<boolean> {
    try {
      this.logger.debug(
        `Checking subscription for user ${userId} in channel ${channelId}`,
      );

      const member = await this.getChatMember(channelId, userId);

      if (!member) {
        return false;
      }

      // Valid subscription statuses
      const validStatuses = ['member', 'administrator', 'creator'];
      const isSubscribed = validStatuses.includes(member.status);

      this.logger.debug(
        `User ${userId} status in ${channelId}: ${member.status} (subscribed: ${isSubscribed})`,
      );

      return isSubscribed;
    } catch (error) {
      this.logger.error(
        `Error checking subscription for user ${userId} in channel ${channelId}:`,
        error,
      );
      return false;
    }
  }

  private async getChatMember(chatId: string, userId: number): Promise<any> {
    try {
      // Retry logic for API failures
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const member = await this.bot.getChatMember(chatId, userId);
          return member;
        } catch (error: any) {
          this.logger.debug(
            `Attempt ${attempt}/${maxRetries} failed for getChatMember:`,
            error.message,
          );

          // Don't retry for certain errors
          if (error.code === 400 || error.code === 403) {
            // Bad request or Forbidden - user likely not in channel
            throw error;
          }

          if (attempt === maxRetries) {
            throw error;
          }

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt),
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  getInitialChannelIds(): string[] {
    return [...this.initialChannelIds];
  }

  getPrimaryChannelId(): string {
    return this.primaryChannelId;
  }

  // Helper method to create subscription check messages
  createSubscriptionMessage(missingChannels: string[]): string {
    if (missingChannels.length === 0) {
      return '✅ You are subscribed to all required channels!';
    }

    const channelLinks = missingChannels.map((id) => `• ${id}`).join('\n');

    return `🔒 Please subscribe to the following channels to use this bot:\n\n${channelLinks}\n\nAfter subscribing, send /start again to verify your subscription.`;
  }

  // Health check for the service
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.bot) {
        return false;
      }

      // Try to get bot info as a simple health check
      await this.bot.getMe();
      return true;
    } catch (error) {
      this.logger.error('Subscription service health check failed:', error);
      return false;
    }
  }
}
