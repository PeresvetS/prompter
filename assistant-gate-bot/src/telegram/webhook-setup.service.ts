import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Injectable()
export class WebhookSetupService implements OnModuleInit {
  private readonly logger = new Logger(WebhookSetupService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    // Only set webhook in production
    if (this.configService.get('NODE_ENV') === 'production') {
      await this.setupWebhook();
    }
  }

  async setupWebhook(): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_URL not configured, skipping webhook setup');
      return;
    }

    try {
      const success = await this.telegramService.setWebhook(webhookUrl);
      if (success) {
        this.logger.log(`✅ Webhook successfully set to: ${webhookUrl}`);
      } else {
        this.logger.error('❌ Failed to set webhook');
      }
    } catch (error) {
      this.logger.error('Error setting up webhook:', error);
    }
  }
}
