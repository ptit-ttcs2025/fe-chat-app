import http from '@/lib/apiBase';
import authStorage from '@/lib/authStorage';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { IAuth, IAuthResponse, IAuthUser } from './auth.type';

const URI = '/api/v1/auth';

export const authUri = {
    login: `${URI}/login`,
    refresh: `${URI}/refresh`,
    me: `${URI}/profile`,
};

export const authApis = {
    /**
     * Login API - Lưu tokens vào cookies
     */
    login: async (payload: IAuth): Promise<IAuthResponse> => {
        const response = await http.post<IAuthResponse>(authUri.login, payload);

        // ✅ Lưu toàn bộ auth data ngay sau khi login thành công
        if (response.data?.accessToken) {
            authStorage.saveAuthData(
                response.data.accessToken,
                response.data.refreshToken,
                response.data.user
            );
        }

        return response.data;
    },

    /**
     * Get user profile
     */
    me: async (): Promise<IAuthUser> => {
        const response = await http.get<IAuthUser>(authUri.me);
        return response.data;
    },

    /**
     * Refresh token API
     */
    refreshToken: async (): Promise<{
        accessToken: string;
        refreshToken: string;
    }> => {
        const refreshToken = authStorage.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await http.post<{
            accessToken: string;
            refreshToken: string;
        }>(authUri.refresh, { refreshToken });

        // ✅ Cập nhật tokens mới vào cookies
        authStorage.setAccessToken(response.data.accessToken);
        authStorage.setRefreshToken(response.data.refreshToken);

        return response.data;
    },
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook login - Tự động lưu tokens vào cookies
 */
export const useLogin = () => {
    return useMutation({
        mutationFn: async (payload: IAuth): Promise<IAuthResponse> => {
            return authApis.login(payload);
        },
    });
};

/**
 * Hook refresh token
 */
export const useRefreshToken = () => {
    return useMutation({
        mutationFn: async (): Promise<{ accessToken: string; refreshToken: string }> => {
            return authApis.refreshToken();
        },
    });
};

/**
 * Hook lấy thông tin user hiện tại
 */
export const useMe = () => {
    return useQuery<IAuthUser, AxiosError>({
        queryKey: ['me'],
        queryFn: authApis.me,
        enabled: !!authStorage.getAccessToken(),
        retry: false,
    });
};
