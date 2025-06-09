import { ConfigService } from '@nestjs/config';
export declare class SubscriptionService {
    private configService;
    private readonly logger;
    private bot;
    private initialChannelIds;
    private primaryChannelId;
    constructor(configService: ConfigService);
    checkInitialSubscription(userId: number): Promise<{
        isSubscribed: boolean;
        missingChannels: string[];
    }>;
    checkPrimarySubscription(userId: number): Promise<boolean>;
    checkSubscription(userId: number, channelId: string): Promise<boolean>;
    private getChatMember;
    getInitialChannelIds(): string[];
    getPrimaryChannelId(): string;
    createSubscriptionMessage(missingChannels: string[]): string;
    checkHealth(): Promise<boolean>;
}
