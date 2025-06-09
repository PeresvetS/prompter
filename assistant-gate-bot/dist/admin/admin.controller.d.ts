import { AdminAuthService } from './admin-auth.service';
import { UserService } from '../user/user.service';
import { LoginDto, PaginationDto, BanUserDto } from './dto/admin.dto';
export declare class AdminController {
    private adminAuthService;
    private userService;
    private readonly logger;
    constructor(adminAuthService: AdminAuthService, userService: UserService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getStats(): Promise<{
        dailyActive: number;
        total: number;
        active: number;
        banned: number;
    }>;
    getUsers(query: PaginationDto): Promise<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUser(id: string): Promise<any>;
    toggleBan(id: string, banDto: BanUserDto): Promise<{
        success: boolean;
        message: string;
        user: any;
        isBanned: boolean;
    }>;
    banUser(id: string): Promise<{
        success: boolean;
        message: string;
        user: any;
    }>;
    unbanUser(id: string): Promise<{
        success: boolean;
        message: string;
        user: any;
    }>;
    resetUserRequests(id: string): Promise<{
        success: boolean;
        message: string;
        user: any;
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
    }>;
}
