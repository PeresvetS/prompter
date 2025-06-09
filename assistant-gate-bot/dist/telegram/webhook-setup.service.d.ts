import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
export declare class WebhookSetupService implements OnModuleInit {
    private readonly configService;
    private readonly telegramService;
    private readonly logger;
    constructor(configService: ConfigService, telegramService: TelegramService);
    onModuleInit(): Promise<void>;
    setupWebhook(): Promise<void>;
}
