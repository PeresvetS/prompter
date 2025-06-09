import { TelegramService } from './telegram.service';
import { SecurityService } from '../common/security.service';
export declare class TelegramController {
    private readonly telegramService;
    private readonly securityService;
    private readonly logger;
    constructor(telegramService: TelegramService, securityService: SecurityService);
    handleWebhook(update: any, secretToken?: string): Promise<{
        status: string;
    }>;
    getWebhookInfo(): Promise<any>;
    setWebhook(url: string): Promise<{
        success: boolean;
    }>;
}
