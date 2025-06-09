import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { WebhookSetupService } from './webhook-setup.service';
import { UserModule } from '../user/user.module';
import { OpenAIModule } from '../openai/openai.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SecurityService } from '../common/security.service';

@Module({
  imports: [UserModule, OpenAIModule, SubscriptionModule],
  controllers: [TelegramController],
  providers: [TelegramService, WebhookSetupService, SecurityService],
  exports: [TelegramService],
})
export class TelegramModule {}
