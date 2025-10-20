import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import type { IAuthUser } from '@/apis/auth/auth.type';
import authStorage from '@/lib/authStorage';

interface AuthState {
    user: IAuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

// ✅ Initial state - BẮT ĐẦU với empty state
// Sẽ rehydrate sau khi app mount thông qua AppInitializer
const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Set credentials khi login thành công
         * - Tokens lưu vào cookies
         * - User info lưu vào sessionStorage
         */
        setCredentials: (
            state,
            action: PayloadAction<{
                user: IAuthUser;
                accessToken: string;
                refreshToken: string;
            }>
        ) => {
            const { user, accessToken, refreshToken } = action.payload;

            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;

            // ✅ Lưu toàn bộ auth data
            authStorage.saveAuthData(accessToken, refreshToken, user);
        },

        /**
         * Update access token sau khi refresh
         */
        setToken: (
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken?: string;
            }>
        ) => {
            state.accessToken = action.payload.accessToken;
            authStorage.setAccessToken(action.payload.accessToken);

            if (action.payload.refreshToken) {
                state.refreshToken = action.payload.refreshToken;
                authStorage.setRefreshToken(action.payload.refreshToken);
            }
        },

        /**
         * Logout - Xóa tất cả cookies và sessionStorage
         */
        logout: (state) => {
            console.log('🚪 LOGOUT ACTION TRIGGERED');
            
            // Clear Redux state
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;

            // ✅ Xóa toàn bộ auth data (cookies + sessionStorage)
            authStorage.clearAuthData();
        },

        /**
         * Rehydrate auth state (khi F5 hoặc reload page)
         */
        rehydrateAuth: (state) => {
            // ✅ Load auth data từ cookies + sessionStorage
            const { accessToken, refreshToken, user } = authStorage.loadAuthData();

            if (accessToken && user) {
                // Có đầy đủ auth data → Restore state
                state.user = user;
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.isAuthenticated = true;
                
                console.log('✅ AUTH REHYDRATED - User:', user.username);
            } else {
                // Không có auth data → Reset state
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                
                console.log('⚠️ NO AUTH DATA - User not logged in');
            }
        },
    },
});

export const { setCredentials, setToken, logout, rehydrateAuth } = authSlice.actions;

// ==================== SELECTORS ====================
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;
