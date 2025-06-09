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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_auth_guard_1 = require("./admin-auth.guard");
const admin_auth_service_1 = require("./admin-auth.service");
const user_service_1 = require("../user/user.service");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = AdminController_1 = class AdminController {
    adminAuthService;
    userService;
    logger = new common_1.Logger(AdminController_1.name);
    constructor(adminAuthService, userService) {
        this.adminAuthService = adminAuthService;
        this.userService = userService;
    }
    async login(loginDto) {
        try {
            const result = await this.adminAuthService.login(loginDto.username, loginDto.password);
            this.logger.log(`Admin login successful: ${loginDto.username}`);
            return result;
        }
        catch (error) {
            this.logger.warn(`Admin login failed: ${loginDto.username}`);
            throw new common_1.HttpException('Invalid credentials', common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async getStats() {
        try {
            const stats = await this.userService.getUserStats();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyActiveUsers = await this.userService.getAllUsers({
                page: 1,
                limit: 1000,
            });
            const activeToday = dailyActiveUsers.users.filter((user) => {
                if (!user.lastRequestDate)
                    return false;
                const lastRequest = new Date(user.lastRequestDate);
                return lastRequest >= today;
            }).length;
            return {
                ...stats,
                dailyActive: activeToday,
            };
        }
        catch (error) {
            this.logger.error('Error getting admin stats:', error);
            throw new common_1.HttpException('Failed to get statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUsers(query) {
        try {
            const result = await this.userService.getAllUsers({
                page: query.page,
                limit: query.limit,
                search: query.search,
            });
            this.logger.debug(`Admin fetched users: page ${query.page}, limit ${query.limit}`);
            return result;
        }
        catch (error) {
            this.logger.error('Error getting users for admin:', error);
            throw new common_1.HttpException('Failed to get users', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUser(id) {
        try {
            const user = await this.userService.getUserByTelegramId(parseInt(id));
            if (!user) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            const userResponse = {
                ...user,
                telegramId: user.telegramId.toString(),
            };
            return userResponse;
        }
        catch (error) {
            this.logger.error(`Error getting user ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to get user', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async toggleBan(id, banDto) {
        try {
            const result = await this.userService.toggleBan(id);
            if (!result.success) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`Admin toggled ban for user ${id}: ${result.isBanned ? 'banned' : 'unbanned'}`);
            return {
                success: true,
                message: `User ${result.isBanned ? 'banned' : 'unbanned'} successfully`,
                user: result.user,
                isBanned: result.isBanned,
            };
        }
        catch (error) {
            this.logger.error(`Error toggling ban for user ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to toggle ban status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async banUser(id) {
        try {
            const result = await this.userService.banUserByDbId(parseInt(id));
            if (!result) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`Admin banned user ${id}`);
            return {
                success: true,
                message: 'User banned successfully',
                user: result,
            };
        }
        catch (error) {
            this.logger.error(`Error banning user ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to ban user', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async unbanUser(id) {
        try {
            const result = await this.userService.unbanUserByDbId(parseInt(id));
            if (!result) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`Admin unbanned user ${id}`);
            return {
                success: true,
                message: 'User unbanned successfully',
                user: result,
            };
        }
        catch (error) {
            this.logger.error(`Error unbanning user ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to unban user', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async resetUserRequests(id) {
        try {
            const result = await this.userService.resetDailyRequestsByDbId(parseInt(id));
            if (!result) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`Admin reset daily requests for user ${id}`);
            return {
                success: true,
                message: 'Daily requests reset successfully',
                user: result,
            };
        }
        catch (error) {
            this.logger.error(`Error resetting requests for user ${id}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to reset requests', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'admin-api',
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Put)('users/:id/ban'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.BanUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleBan", null);
__decorate([
    (0, common_1.Patch)('users/:id/ban'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unban'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/reset-requests'),
    (0, common_1.UseGuards)(admin_auth_guard_1.AdminAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetUserRequests", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "healthCheck", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService,
        user_service_1.UserService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map