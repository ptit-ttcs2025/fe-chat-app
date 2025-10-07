import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import type { IAuthUser } from '@/apis/auth/auth.type';

interface AuthState {
    user: IAuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

// Load từ localStorage khi khởi tạo
const loadAuthState = (): AuthState => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userJson = localStorage.getItem('user');

        if (accessToken && userJson) {
            return {
                user: JSON.parse(userJson),
                accessToken,
                refreshToken,
                isAuthenticated: true,
            };
        }
    } catch (error) {
        console.error('Error loading auth state:', error);
    }

    return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
    };
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('accessToken', action.payload);
        },

        setRefreshToken: (state, action: PayloadAction<string>) => {
            state.refreshToken = action.payload;
            localStorage.setItem('refreshToken', action.payload);
        },

        setUser: (state, action: PayloadAction<IAuthUser>) => {
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },

        // Action tổng hợp khi login success
        setCredentials: (
            state,
            action: PayloadAction<{
                user: IAuthUser;
                accessToken: string;
                refreshToken?: string;
            }>
        ) => {
            const { user, accessToken, refreshToken } = action.payload;

            state.user = user;
            state.accessToken = accessToken;
            state.isAuthenticated = true;

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);

            if (refreshToken) {
                state.refreshToken = refreshToken;
                localStorage.setItem('refreshToken', refreshToken);
            }
        },

        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;

            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        },
    },
});

export const {
    setToken,
    setRefreshToken,
    setUser,
    setCredentials,
    logout,
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;
