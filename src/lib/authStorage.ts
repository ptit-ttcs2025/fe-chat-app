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
        console.log('💾 Saving access token to cookies...');
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
        console.log('💾 Saving refresh token to cookies...');
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
        console.log('🗑️ Clearing all auth tokens...');
        cookieManager.remove(TOKEN_KEY);
        cookieManager.remove(REFRESH_TOKEN_KEY);
    },

    // ==================== USER INFO (LocalStorage) ====================

    /**
     * Lưu user info vào localStorage
     */
    setUser(user: IAuthUser): void {
        try {
            console.log('💾 Saving user to localStorage...');
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            console.log('✅ User saved:', user.username);
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
        console.log('🗑️ Clearing user from localStorage...');
        localStorage.removeItem(USER_KEY);
    },

    // ==================== COMBINED OPERATIONS ====================

    /**
     * Lưu toàn bộ auth data (login)
     */
    saveAuthData(accessToken: string, refreshToken: string, user: IAuthUser): void {
        console.log('='.repeat(60));
        console.log('💾 SAVING AUTH DATA...');
        
        this.setAccessToken(accessToken);
        this.setRefreshToken(refreshToken);
        this.setUser(user);
        
        // Verify
        const savedAccessToken = this.getAccessToken();
        const savedRefreshToken = this.getRefreshToken();
        const savedUser = this.getUser();
        
        console.log('🔍 Verification:', {
            accessToken: savedAccessToken ? 'OK' : 'FAILED',
            refreshToken: savedRefreshToken ? 'OK' : 'FAILED',
            user: savedUser ? 'OK' : 'FAILED',
        });
        
        if (!savedAccessToken || !savedRefreshToken || !savedUser) {
            console.error('❌ SOME AUTH DATA FAILED TO SAVE!');
        } else {
            console.log('✅ All auth data saved successfully!');
        }
        console.log('='.repeat(60));
    },

    /**
     * Lấy toàn bộ auth data (rehydrate)
     */
    loadAuthData(): {
        accessToken: string | null;
        refreshToken: string | null;
        user: IAuthUser | null;
    } {
        console.log('='.repeat(60));
        console.log('📂 LOADING AUTH DATA...');
        console.log('📋 Current cookies:', document.cookie);
        console.log('📋 LocalStorage has user:', !!localStorage.getItem(USER_KEY));
        
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const user = this.getUser();
        
        console.log('🔍 Retrieved:', {
            accessToken: accessToken ? `Found (${accessToken.length} chars)` : 'NOT FOUND',
            refreshToken: refreshToken ? `Found (${refreshToken.length} chars)` : 'NOT FOUND',
            user: user ? `Found (${user.username})` : 'NOT FOUND',
        });
        console.log('='.repeat(60));
        
        return { accessToken, refreshToken, user };
    },

    /**
     * Xóa toàn bộ auth data (logout)
     */
    clearAuthData(): void {
        console.log('='.repeat(60));
        console.log('🗑️ CLEARING ALL AUTH DATA...');
        
        this.clearTokens();
        this.clearUser();
        
        // Verify
        setTimeout(() => {
            const accessToken = this.getAccessToken();
            const refreshToken = this.getRefreshToken();
            const user = this.getUser();
            
            if (accessToken || refreshToken || user) {
                console.error('❌ FAILED TO CLEAR SOME AUTH DATA!', {
                    accessToken,
                    refreshToken,
                    user,
                });
            } else {
                console.log('✅ All auth data cleared successfully!');
            }
            console.log('='.repeat(60));
        }, 100);
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

