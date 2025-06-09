import {
  Body,
  Controller,
  Get,
  Post,
  Logger,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { SecurityService } from '../common/security.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly securityService: SecurityService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): Promise<{ status: string }> {
    try {
      // Verify webhook signature for security
      const isValidSignature = this.securityService.verifyTelegramWebhook(
        JSON.stringify(update),
        secretToken,
      );

      if (!isValidSignature) {
        this.logger.warn('Invalid webhook signature detected');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.debug('Webhook received');
      await this.telegramService.handleUpdate(update);
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return { status: 'error' };
    }
  }

  @Get('webhook-info')
  async getWebhookInfo(): Promise<any> {
    return await this.telegramService.getWebhookInfo();
  }

  @Post('set-webhook')
  async setWebhook(@Body('url') url: string): Promise<{ success: boolean }> {
    const success = await this.telegramService.setWebhook(url);
    return { success };
  }
}
