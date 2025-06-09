import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { UserService } from '../user/user.service';
import { LoginDto, PaginationDto, BanUserDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private adminAuthService: AdminAuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.adminAuthService.login(
        loginDto.username,
        loginDto.password,
      );
      this.logger.log(`Admin login successful: ${loginDto.username}`);
      return result;
    } catch (error) {
      this.logger.warn(`Admin login failed: ${loginDto.username}`);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('stats')
  @UseGuards(AdminAuthGuard)
  async getStats() {
    try {
      const stats = await this.userService.getUserStats();

      // Get daily active users (users who made requests today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyActiveUsers = await this.userService.getAllUsers({
        page: 1,
        limit: 1000, // Get a large number to count active users
      });

      const activeToday = dailyActiveUsers.users.filter((user) => {
        if (!user.lastRequestDate) return false;
        const lastRequest = new Date(user.lastRequestDate);
        return lastRequest >= today;
      }).length;

      return {
        ...stats,
        dailyActive: activeToday,
      };
    } catch (error) {
      this.logger.error('Error getting admin stats:', error);
      throw new HttpException(
        'Failed to get statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  @UseGuards(AdminAuthGuard)
  async getUsers(@Query() query: PaginationDto) {
    try {
      const result = await this.userService.getAllUsers({
        page: query.page,
        limit: query.limit,
        search: query.search,
      });

      this.logger.debug(
        `Admin fetched users: page ${query.page}, limit ${query.limit}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error getting users for admin:', error);
      throw new HttpException(
        'Failed to get users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:id')
  @UseGuards(AdminAuthGuard)
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.userService.getUserByTelegramId(parseInt(id));

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Convert BigInt to string for JSON serialization
      const userResponse = {
        ...user,
        telegramId: user.telegramId.toString(),
      };

      return userResponse;
    } catch (error) {
      this.logger.error(`Error getting user ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('users/:id/ban')
  @UseGuards(AdminAuthGuard)
  async toggleBan(@Param('id') id: string, @Body() banDto: BanUserDto) {
    try {
      const result = await this.userService.toggleBan(id);

      if (!result.success) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(
        `Admin toggled ban for user ${id}: ${result.isBanned ? 'banned' : 'unbanned'}`,
      );

      return {
        success: true,
        message: `User ${result.isBanned ? 'banned' : 'unbanned'} successfully`,
        user: result.user,
        isBanned: result.isBanned,
      };
    } catch (error) {
      this.logger.error(`Error toggling ban for user ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to toggle ban status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('users/:id/ban')
  @UseGuards(AdminAuthGuard)
  async banUser(@Param('id') id: string) {
    try {
      const result = await this.userService.banUserByDbId(parseInt(id));

      if (!result) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Admin banned user ${id}`);

      return {
        success: true,
        message: 'User banned successfully',
        user: result,
      };
    } catch (error) {
      this.logger.error(`Error banning user ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to ban user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('users/:id/unban')
  @UseGuards(AdminAuthGuard)
  async unbanUser(@Param('id') id: string) {
    try {
      const result = await this.userService.unbanUserByDbId(parseInt(id));

      if (!result) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Admin unbanned user ${id}`);

      return {
        success: true,
        message: 'User unbanned successfully',
        user: result,
      };
    } catch (error) {
      this.logger.error(`Error unbanning user ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to unban user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('users/:id/reset-requests')
  @UseGuards(AdminAuthGuard)
  async resetUserRequests(@Param('id') id: string) {
    try {
      const result = await this.userService.resetDailyRequestsByDbId(
        parseInt(id),
      );

      if (!result) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Admin reset daily requests for user ${id}`);

      return {
        success: true,
        message: 'Daily requests reset successfully',
        user: result,
      };
    } catch (error) {
      this.logger.error(`Error resetting requests for user ${id}:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to reset requests',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'admin-api',
    };
  }
}
