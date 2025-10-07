import http, { tokenManager } from '@/lib/apiBase';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { IAuth, IAuthResponse, IAuthUser } from './auth.type';

const URI = '/api/v1.0/Users';

export const authUri = {
    login: `${URI}/login`,
    logout: `${URI}/logout`,
    refresh: `${URI}/refresh`,
    me: `${URI}/me`,
};

export const authApis = {
    login: async (payload: IAuth): Promise<IAuthResponse> => {
        const response = await http.post<IAuthResponse>(authUri.login, payload);

        // ✅ Save tokens after successful login
        if (response.data?.token) {
            tokenManager.setAccessToken(response.data.token);
            tokenManager.setRefreshToken(response.data.refresh);
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
        token: string;
        refreshToken: string;
    }> => {
        const refreshToken = tokenManager.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await http.post<{ token: string; refresh: string }>(
            authUri.refresh,
            { refreshToken }
        );

        return {
            token: response.data.token,
            refreshToken: response.data.refresh,
        };
    },
};

// ✅ React Query hooks
export const useLogin = () => {
    return useMutation<IAuthResponse, AxiosError, IAuth>({
        mutationFn: authApis.login,
    });
};

export const useLogout = () => {
    return useMutation({
        mutationFn: authApis.logout,
    });
};

export const useMe = () => {
    return useQuery<IAuthUser, AxiosError>({
        queryKey: ['me'],
        queryFn: authApis.me,
        enabled: !!tokenManager.getAccessToken(),
    });
};
