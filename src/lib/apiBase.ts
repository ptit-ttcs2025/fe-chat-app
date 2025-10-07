import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import { environment } from '../environment';

export interface ApiResponse<T> {
    data: T;
    isError: boolean;
    errorMessage: string | null;
    status: number;
}

export interface ApiResponseList<T> {
    items: T;
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export interface ApiError {
    status: number;
    detail: string;
    message: string;
    errorMessage?: string; // ✅ Thêm field này
    traceId: string;
}

interface CustomInstance extends AxiosInstance {
    // ✅ Kế thừa đầy đủ từ AxiosInstance
}

const http = axios.create({
    baseURL: environment.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 20000,
    withCredentials: true,
}) as CustomInstance;

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
    getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    setAccessToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    clearTokens: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};

http.interceptors.request.use(
    (config) => {
        const token = tokenManager.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[Request Error]:', error);
        return Promise.reject(error);
    },
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

http.interceptors.response.use(
    (response: AxiosResponse) => {
        const data = response.data;
        if (data && typeof data === 'object' && 'isError' in data) {
            if (data.isError) {
                return Promise.reject({
                    status: data.status,
                    message: data.errorMessage || 'Unknown error',
                });
            }
            return data.data;
        }
        return data;
    },
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axios(originalRequest); // ✅ Dùng axios thay vì http
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = tokenManager.getRefreshToken();

            if (!refreshToken) {
                tokenManager.clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post<ApiResponse<{ token: string; refresh: string }>>(
                    `${environment.apiBaseUrl}/api/v1.0/Users/refresh`,
                    { refreshToken },
                );

                const { token, refresh } = response.data.data;
                tokenManager.setAccessToken(token);
                tokenManager.setRefreshToken(refresh);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }

                processQueue(null, token);
                return axios(originalRequest); // ✅ Dùng axios thay vì http
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                tokenManager.clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 403:
                    console.error('[Forbidden]:', data?.message || 'Access denied');
                    break;
                case 404:
                    console.error('[Not Found]:', data?.message || 'Resource not found');
                    break;
                case 500:
                    console.error('[Server Error]:', data?.message || 'Internal server error');
                    break;
                default:
                    console.error(`[Error ${status}]:`, data);
            }

            return Promise.reject({
                status,
                message: data?.message || data?.errorMessage || 'Unknown error',
                detail: data?.detail,
                traceId: data?.traceId,
            });
        } else if (error.request) {
            console.error('[Network Error]: No response received', error.request);
            return Promise.reject({
                status: 0,
                message: 'Network error - please check your connection',
            });
        } else {
            console.error('[Request Setup Error]:', error.message);
            return Promise.reject({
                status: 0,
                message: error.message,
            });
        }
    },
);

export default http;
