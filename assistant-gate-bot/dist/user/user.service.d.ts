import { PrismaService } from '../prisma.service';
export interface TelegramUser {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
    is_bot?: boolean;
    is_premium?: boolean;
}
export declare class UserService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrUpdateUser(telegramUser: TelegramUser): Promise<any>;
    getUserByTelegramId(telegramId: number): Promise<any>;
    incrementDailyRequests(telegramId: number): Promise<boolean>;
    checkDailyLimit(telegramId: number): Promise<{
        canMakeRequest: boolean;
        requestsUsed: number;
    }>;
    banUser(telegramId: number): Promise<any>;
    unbanUser(telegramId: number): Promise<any>;
    resetDailyRequests(telegramId: number): Promise<any>;
    banUserByDbId(dbId: number): Promise<any>;
    unbanUserByDbId(dbId: number): Promise<any>;
    resetDailyRequestsByDbId(dbId: number): Promise<any>;
    isUserBanned(telegramId: number): Promise<boolean>;
    getOrCreateThreadId(telegramId: number): Promise<string | null>;
    saveThreadId(telegramId: number, threadId: string): Promise<boolean>;
    toggleBan(telegramId: string): Promise<{
        success: boolean;
        isBanned: boolean;
        user?: any;
    }>;
    resetDailyLimits(): Promise<void>;
    getAllUsers(options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        banned: number;
    }>;
}
