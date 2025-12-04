/**
 * Auth Storage Manager
 * Quản lý việc lưu trữ auth data vào cookies và sessionStorage
 */

import cookieManager from './cookieManager';
import type { IAuthUser } from '@/apis/auth/auth.type';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export const authStorage = {
    // ==================== TOKENS (Cookies) ====================
    
    /**
     * Lưu access token vào cookies
     */
    setAccessToken(token: string): void {
        cookieManager.set(TOKEN_KEY, token, 7); // 7 days
    },

    /**
     * Lấy access token từ cookies
     */
    getAccessToken(): string | null {
        return cookieManager.get(TOKEN_KEY);
    },

    /**
     * Lưu refresh token vào cookies
     */
    setRefreshToken(token: string): void {
        cookieManager.set(REFRESH_TOKEN_KEY, token, 30); // 30 days
    },

    /**
     * Lấy refresh token từ cookies
     */
    getRefreshToken(): string | null {
        return cookieManager.get(REFRESH_TOKEN_KEY);
    },

    /**
     * Xóa tất cả tokens
     */
    clearTokens(): void {
        cookieManager.remove(TOKEN_KEY);
        cookieManager.remove(REFRESH_TOKEN_KEY);
    },

    // ==================== USER INFO (LocalStorage) ====================

    /**
     * Lưu user info vào localStorage
     */
    setUser(user: IAuthUser): void {
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('❌ Error saving user:', error);
        }
    },

    /**
     * Lấy user info từ localStorage
     */
    getUser(): IAuthUser | null {
        try {
            const userJson = localStorage.getItem(USER_KEY);
            if (userJson) {
                return JSON.parse(userJson);
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading user:', error);
            return null;
        }
    },

    /**
     * Xóa user info
     */
    clearUser(): void {
        localStorage.removeItem(USER_KEY);
    },

    // ==================== COMBINED OPERATIONS ====================

    /**
     * Lưu toàn bộ auth data (login)
     */
    saveAuthData(accessToken: string, refreshToken: string, user: IAuthUser): void {
        this.setAccessToken(accessToken);
        this.setRefreshToken(refreshToken);
        this.setUser(user);
    },

    /**
     * Lấy toàn bộ auth data (rehydrate)
     */
    loadAuthData(): {
        accessToken: string | null;
        refreshToken: string | null;
        user: IAuthUser | null;
    } {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const user = this.getUser();
        return { accessToken, refreshToken, user };
    },

    /**
     * Xóa toàn bộ auth data (logout)
     */
    clearAuthData(): void {
        this.clearTokens();
        this.clearUser();
    },

    /**
     * Kiểm tra có auth data không
     */
    hasAuthData(): boolean {
        const accessToken = this.getAccessToken();
        const user = this.getUser();
        return !!(accessToken && user);
    },
};

export default authStorage;

