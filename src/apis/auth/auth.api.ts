import http, { tokenManager } from '@/lib/apiBase';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { IAuth, IAuthResponse, IAuthUser } from './auth.type';

const URI = '/api/v1/auth';

export const authUri = {
    login: `${URI}/login`,
    logout: `${URI}/logout`,
    refresh: `${URI}/refresh`,
    me: `${URI}/me`,
};

export const authApis = {
    login: async (payload: IAuth): Promise<IAuthResponse> => {
        const response = await http.post<IAuthResponse>(authUri.login, payload);

        // ✅ Đồng bộ với response structure từ backend
        if (response.data?.accessToken) {
            tokenManager.setAccessToken(response.data.accessToken);
            tokenManager.setRefreshToken(response.data.refreshToken);
        }

        return response.data;
    },

    logout: async (): Promise<void> => {
        await http.post(authUri.logout);
        tokenManager.clearTokens();
    },

    me: async (): Promise<IAuthUser> => {
        const response = await http.get<IAuthUser>(authUri.me);
        return response.data;
    },

    refreshToken: async (): Promise<{
        accessToken: string;      // ✅ Consistent naming
        refreshToken: string;     // ✅ Consistent naming
    }> => {
        const refreshToken = tokenManager.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await http.post<{
            accessToken: string;  // ✅ Match response structure
            refreshToken: string; // ✅ Match response structure
        }>(
            authUri.refresh,
            { refreshToken }
        );

        // ✅ Update tokens after refresh
        tokenManager.setAccessToken(response.data.accessToken);
        tokenManager.setRefreshToken(response.data.refreshToken);

        return response.data;
    },
};

// ✅ React Query hooks (no changes needed)
// Login mutation
export const useLogin = () => {
    return useMutation({
        mutationFn: async (payload: IAuth): Promise<IAuthResponse> => {
            const response = await http.post<IAuthResponse>(authUri.login, payload);
            return response.data;
        },
    });
};

// Logout mutation
export const useLogout = () => {
    return useMutation({
        mutationFn: async (): Promise<void> => {
            await http.post(authUri.logout);
        },
    });
};

// Refresh token mutation
export const useRefreshToken = () => {
    return useMutation({
        mutationFn: async (refreshToken: string): Promise<{ accessToken: string }> => {
            const response = await http.post<{ accessToken: string }>(
                authUri.refresh,
                { refreshToken }
            );
            return response.data;
        },
    });
};

export const useMe = () => {
    return useQuery<IAuthUser, AxiosError>({
        queryKey: ['me'],
        queryFn: authApis.me,
        enabled: !!tokenManager.getAccessToken(),
    });
};
