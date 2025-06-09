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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
let UserService = UserService_1 = class UserService {
    prisma;
    logger = new common_1.Logger(UserService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrUpdateUser(telegramUser) {
        try {
            const user = await this.prisma.user.upsert({
                where: { telegramId: BigInt(telegramUser.id) },
                update: {
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    languageCode: telegramUser.language_code,
                    isBot: telegramUser.is_bot || false,
                    isPremium: telegramUser.is_premium,
                    updatedAt: new Date(),
                },
                create: {
                    telegramId: BigInt(telegramUser.id),
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    languageCode: telegramUser.language_code,
                    isBot: telegramUser.is_bot || false,
                    isPremium: telegramUser.is_premium,
                },
            });
            this.logger.log(`User ${telegramUser.username || telegramUser.first_name} created/updated`);
            return user;
        }
        catch (error) {
            this.logger.error('Error creating/updating user:', error);
            throw error;
        }
    }
    async getUserByTelegramId(telegramId) {
        try {
            return await this.prisma.user.findUnique({
                where: { telegramId: BigInt(telegramId) },
            });
        }
        catch (error) {
            this.logger.error(`Error getting user ${telegramId}:`, error);
            return null;
        }
    }
    async incrementDailyRequests(telegramId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: {
                    dailyRequests: { increment: 1 },
                    lastRequestDate: new Date(),
                },
            });
            this.logger.debug(`Incremented daily requests for user ${telegramId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error incrementing requests for user ${telegramId}:`, error);
            return false;
        }
    }
    async checkDailyLimit(telegramId) {
        try {
            const user = await this.getUserByTelegramId(telegramId);
            if (!user) {
                return { canMakeRequest: false, requestsUsed: 0 };
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastRequestDate = user.lastRequestDate
                ? new Date(user.lastRequestDate)
                : null;
            const isNewDay = !lastRequestDate || lastRequestDate < today;
            if (isNewDay) {
                await this.prisma.user.update({
                    where: { telegramId: BigInt(telegramId) },
                    data: { dailyRequests: 0 },
                });
                return { canMakeRequest: true, requestsUsed: 0 };
            }
            const requestsUsed = user.dailyRequests;
            const canMakeRequest = requestsUsed < 50;
            return { canMakeRequest, requestsUsed };
        }
        catch (error) {
            this.logger.error(`Error checking daily limit for user ${telegramId}:`, error);
            return { canMakeRequest: false, requestsUsed: 0 };
        }
    }
    async banUser(telegramId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { isBanned: true },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`User ${telegramId} has been banned`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error banning user ${telegramId}:`, error);
            return null;
        }
    }
    async unbanUser(telegramId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { isBanned: false },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`User ${telegramId} has been unbanned`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error unbanning user ${telegramId}:`, error);
            return null;
        }
    }
    async resetDailyRequests(telegramId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: {
                    dailyRequests: 0,
                    lastRequestDate: null,
                },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Daily requests reset for user ${telegramId}`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error resetting daily requests for user ${telegramId}:`, error);
            return null;
        }
    }
    async banUserByDbId(dbId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: dbId },
                data: { isBanned: true },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`User with DB ID ${dbId} has been banned`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error banning user with DB ID ${dbId}:`, error);
            return null;
        }
    }
    async unbanUserByDbId(dbId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: dbId },
                data: { isBanned: false },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`User with DB ID ${dbId} has been unbanned`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error unbanning user with DB ID ${dbId}:`, error);
            return null;
        }
    }
    async resetDailyRequestsByDbId(dbId) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: dbId },
                data: {
                    dailyRequests: 0,
                    lastRequestDate: null,
                },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    lastRequestDate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Daily requests reset for user with DB ID ${dbId}`);
            return {
                ...updatedUser,
                telegramId: updatedUser.telegramId.toString(),
            };
        }
        catch (error) {
            this.logger.error(`Error resetting daily requests for user with DB ID ${dbId}:`, error);
            return null;
        }
    }
    async isUserBanned(telegramId) {
        try {
            const user = await this.getUserByTelegramId(telegramId);
            return user?.isBanned || false;
        }
        catch (error) {
            this.logger.error(`Error checking ban status for user ${telegramId}:`, error);
            return false;
        }
    }
    async getOrCreateThreadId(telegramId) {
        try {
            const user = await this.getUserByTelegramId(telegramId);
            if (!user) {
                this.logger.error(`User ${telegramId} not found`);
                return null;
            }
            if (user.openaiThreadId) {
                this.logger.debug(`Using existing thread ${user.openaiThreadId} for user ${telegramId}`);
                return user.openaiThreadId;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Error getting thread ID for user ${telegramId}:`, error);
            return null;
        }
    }
    async saveThreadId(telegramId, threadId) {
        try {
            await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { openaiThreadId: threadId },
            });
            this.logger.log(`Saved thread ID ${threadId} for user ${telegramId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error saving thread ID for user ${telegramId}:`, error);
            return false;
        }
    }
    async toggleBan(telegramId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { telegramId: BigInt(telegramId) },
            });
            if (!user) {
                return { success: false, isBanned: false };
            }
            const newBanStatus = !user.isBanned;
            const updatedUser = await this.prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { isBanned: newBanStatus },
                select: {
                    id: true,
                    telegramId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    isBanned: true,
                    dailyRequests: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`User ${telegramId} ${newBanStatus ? 'banned' : 'unbanned'}`);
            return {
                success: true,
                isBanned: newBanStatus,
                user: {
                    ...updatedUser,
                    telegramId: updatedUser.telegramId.toString(),
                },
            };
        }
        catch (error) {
            this.logger.error(`Error toggling ban for user ${telegramId}:`, error);
            return { success: false, isBanned: false };
        }
    }
    async resetDailyLimits() {
        try {
            const result = await this.prisma.user.updateMany({
                data: { dailyRequests: 0 },
            });
            this.logger.log(`✅ Daily limits reset for ${result.count} users`);
        }
        catch (error) {
            this.logger.error('❌ Error resetting daily limits:', error);
        }
    }
    async getAllUsers(options) {
        try {
            const page = options?.page || 1;
            const limit = options?.limit || 10;
            const skip = (page - 1) * limit;
            const where = options?.search
                ? {
                    OR: [
                        {
                            username: {
                                contains: options.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            firstName: {
                                contains: options.search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            lastName: {
                                contains: options.search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {};
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        telegramId: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        languageCode: true,
                        dailyRequests: true,
                        isBanned: true,
                        createdAt: true,
                        updatedAt: true,
                        lastRequestDate: true,
                    },
                }),
                this.prisma.user.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                users: users.map((user) => ({
                    ...user,
                    telegramId: user.telegramId.toString(),
                })),
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (error) {
            this.logger.error('Error getting all users:', error);
            return {
                users: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };
        }
    }
    async getUserStats() {
        try {
            const total = await this.prisma.user.count();
            const banned = await this.prisma.user.count({
                where: { isBanned: true },
            });
            const active = total - banned;
            return { total, active, banned };
        }
        catch (error) {
            this.logger.error('Error getting user stats:', error);
            return { total: 0, active: 0, banned: 0 };
        }
    }
};
exports.UserService = UserService;
__decorate([
    (0, schedule_1.Cron)('0 0 * * *', { timeZone: 'UTC' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserService.prototype, "resetDailyLimits", null);
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map