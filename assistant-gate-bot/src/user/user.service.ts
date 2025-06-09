import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async createOrUpdateUser(telegramUser: TelegramUser): Promise<any> {
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

      this.logger.log(
        `User ${telegramUser.username || telegramUser.first_name} created/updated`,
      );
      return user;
    } catch (error) {
      this.logger.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<any> {
    try {
      return await this.prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });
    } catch (error) {
      this.logger.error(`Error getting user ${telegramId}:`, error);
      return null;
    }
  }

  async incrementDailyRequests(telegramId: number): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(
        `Error incrementing requests for user ${telegramId}:`,
        error,
      );
      return false;
    }
  }

  async checkDailyLimit(
    telegramId: number,
  ): Promise<{ canMakeRequest: boolean; requestsUsed: number }> {
    try {
      const user = await this.getUserByTelegramId(telegramId);

      if (!user) {
        return { canMakeRequest: false, requestsUsed: 0 };
      }

      // Check if it's a new day - reset counter if needed
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
    } catch (error) {
      this.logger.error(
        `Error checking daily limit for user ${telegramId}:`,
        error,
      );
      return { canMakeRequest: false, requestsUsed: 0 };
    }
  }

  async banUser(telegramId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Error banning user ${telegramId}:`, error);
      return null;
    }
  }

  async unbanUser(telegramId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Error unbanning user ${telegramId}:`, error);
      return null;
    }
  }

  async resetDailyRequests(telegramId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(
        `Error resetting daily requests for user ${telegramId}:`,
        error,
      );
      return null;
    }
  }

  // Admin methods that work with database ID instead of telegram ID
  async banUserByDbId(dbId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Error banning user with DB ID ${dbId}:`, error);
      return null;
    }
  }

  async unbanUserByDbId(dbId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Error unbanning user with DB ID ${dbId}:`, error);
      return null;
    }
  }

  async resetDailyRequestsByDbId(dbId: number): Promise<any> {
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
    } catch (error) {
      this.logger.error(
        `Error resetting daily requests for user with DB ID ${dbId}:`,
        error,
      );
      return null;
    }
  }

  async isUserBanned(telegramId: number): Promise<boolean> {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      return user?.isBanned || false;
    } catch (error) {
      this.logger.error(
        `Error checking ban status for user ${telegramId}:`,
        error,
      );
      return false;
    }
  }

  async getOrCreateThreadId(telegramId: number): Promise<string | null> {
    try {
      const user = await this.getUserByTelegramId(telegramId);

      if (!user) {
        this.logger.error(`User ${telegramId} not found`);
        return null;
      }

      // Return existing thread ID if available
      if (user.openaiThreadId) {
        this.logger.debug(
          `Using existing thread ${user.openaiThreadId} for user ${telegramId}`,
        );
        return user.openaiThreadId;
      }

      // No thread ID found, will be created by OpenAI service
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting thread ID for user ${telegramId}:`,
        error,
      );
      return null;
    }
  }

  async saveThreadId(telegramId: number, threadId: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: { openaiThreadId: threadId },
      });

      this.logger.log(`Saved thread ID ${threadId} for user ${telegramId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error saving thread ID for user ${telegramId}:`,
        error,
      );
      return false;
    }
  }

  async toggleBan(
    telegramId: string,
  ): Promise<{ success: boolean; isBanned: boolean; user?: any }> {
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

      this.logger.log(
        `User ${telegramId} ${newBanStatus ? 'banned' : 'unbanned'}`,
      );

      return {
        success: true,
        isBanned: newBanStatus,
        user: {
          ...updatedUser,
          telegramId: updatedUser.telegramId.toString(),
        },
      };
    } catch (error) {
      this.logger.error(`Error toggling ban for user ${telegramId}:`, error);
      return { success: false, isBanned: false };
    }
  }

  // Reset daily counters at midnight UTC
  @Cron('0 0 * * *', { timeZone: 'UTC' })
  async resetDailyLimits(): Promise<void> {
    try {
      const result = await this.prisma.user.updateMany({
        data: { dailyRequests: 0 },
      });

      this.logger.log(`✅ Daily limits reset for ${result.count} users`);
    } catch (error) {
      this.logger.error('❌ Error resetting daily limits:', error);
    }
  }

  // Get all users for admin panel with pagination
  async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
                  mode: 'insensitive' as any,
                },
              },
              {
                firstName: {
                  contains: options.search,
                  mode: 'insensitive' as any,
                },
              },
              {
                lastName: {
                  contains: options.search,
                  mode: 'insensitive' as any,
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
          telegramId: user.telegramId.toString(), // Convert BigInt to string
        })),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
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

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    active: number;
    banned: number;
  }> {
    try {
      const total = await this.prisma.user.count();
      const banned = await this.prisma.user.count({
        where: { isBanned: true },
      });
      const active = total - banned;

      return { total, active, banned };
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      return { total: 0, active: 0, banned: 0 };
    }
  }
}
