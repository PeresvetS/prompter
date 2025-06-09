import axios from 'axios';

/**
 * Получаем базовый URL API из переменных окружения
 * Fallback на localhost для локальной разработки если переменная не задана
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || window.location.origin + '/admin';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export interface User {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  dailyRequests: number;
  lastRequestDate?: string;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
}

class AdminAPI {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/login', credentials);
    const { access_token } = response.data;
    localStorage.setItem('admin_token', access_token);
    return { token: access_token, expiresIn: 86400 };
  }

  async getUsers(page = 1, limit = 10, search = ''): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    const response = await api.get(`/users?${params}`);
    return response.data;
  }

  async banUser(userId: number): Promise<void> {
    await api.patch(`/users/${userId}/ban`);
  }

  async unbanUser(userId: number): Promise<void> {
    await api.patch(`/users/${userId}/unban`);
  }

  async resetUserDailyRequests(userId: number): Promise<void> {
    await api.patch(`/users/${userId}/reset-requests`);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('admin_token');
  }

  logout(): void {
    localStorage.removeItem('admin_token');
  }
}

export const adminAPI = new AdminAPI();
