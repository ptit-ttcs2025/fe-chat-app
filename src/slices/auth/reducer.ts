import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IAuthUser } from '@/apis/auth/auth.type';

interface AuthState {
    user: IAuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<IAuthUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        },
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
