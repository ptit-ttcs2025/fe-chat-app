import http from '@/lib/apiBase';
import authStorage from '@/lib/authStorage';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {IAuth, IAuthResponse, IAuthUser, ILoginResponse, ISignupRequest} from './auth.type';

const URI = '/auth'; // ✅ Fix: Bỏ /api/v1 vì baseURL đã có rồi

export const authUri = {
    login: `${URI}/login`,
    refresh: `${URI}/refresh`,
    me: `${URI}/profile`,
    signup: `${URI}/register`
};

export const authApis = {
    /**
     * Login API - Lưu tokens vào cookies
     */
    login: async (payload: IAuth): Promise<IAuthResponse> => {
        const response = await http.post<ILoginResponse>(authUri.login, payload);

        const apiData = response.data;

        // ✅ Transform sang IAuthResponse format
        const authResponse: IAuthResponse = {
            accessToken: apiData.accessToken,
            refreshToken: apiData.refreshToken,
            user: {
                id: apiData.id,
                username: apiData.username,
                email: apiData.email,
                fullName: apiData.fullName,
            }
        };

        return authResponse;
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
        const accessToken = authStorage.getAccessToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await http.post(authUri.refresh, { 
            refreshToken,
            accessToken 
        }) as any;

        // ✅ Parse response theo cấu trúc backend: { statusCode, message, timestamp, path, data: { accessToken, ... } }
        const responseData = response.data || response;
        const newAccessToken = responseData.accessToken;

        if (!newAccessToken) {
            throw new Error('No access token in refresh response');
        }

        // ✅ Cập nhật accessToken mới vào cookies (giữ nguyên refreshToken cũ)
        authStorage.setAccessToken(newAccessToken);

        return {
            accessToken: newAccessToken,
            refreshToken: refreshToken, // Backend không trả về refreshToken mới, giữ nguyên cũ
        };
    },

    signup: async (payload: ISignupRequest): Promise<IAuthResponse>=> {
        const response = await http.post<IAuthResponse>(authUri.signup, payload);

        if (response.data?.accessToken) {
            authStorage.setAccessToken(response.data.accessToken);
            authStorage.setRefreshToken(response.data.refreshToken);
        }

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

export const useSignup = () => {
    return useMutation<IAuthResponse, AxiosError<{message: string}>, ISignupRequest>({
        mutationFn: authApis.signup,
    });
}
