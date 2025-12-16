import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { environment } from '../environment';
import { store } from '@/store/store';
import { logout, setToken } from '@/slices/auth/reducer';
import authStorage from '@/lib/authStorage';

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
    errorMessage?: string;
    traceId: string;
}

interface CustomInstance extends AxiosInstance {}

const http = axios.create({
    baseURL: environment.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 20000,
    withCredentials: true, // ✅ Quan trọng để gửi cookies
}) as CustomInstance;

// ✅ Export authStorage as tokenManager for compatibility
export const tokenManager = {
    getAccessToken: () => authStorage.getAccessToken(),
    setAccessToken: (token: string) => authStorage.setAccessToken(token),
    getRefreshToken: () => authStorage.getRefreshToken(),
    setRefreshToken: (token: string) => authStorage.setRefreshToken(token),
    clearTokens: () => authStorage.clearTokens(),
};

// ✅ Request Interceptor - Thêm token vào header
http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // ✅ Xóa Content-Type nếu là FormData để browser tự set với boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response Interceptor - Xử lý refresh token
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

        // ✅ Xử lý 401 - Token hết hạn
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Đợi refresh token hoàn tất
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axios(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = tokenManager.getRefreshToken();

            if (!refreshToken) {
                // Không có refresh token → Logout
                console.error('❌ No refresh token available');
                tokenManager.clearTokens();
                store.dispatch(logout());
                
                // ✅ Chỉ redirect nếu chưa ở trang login
                if (!window.location.pathname.includes('/signin') && 
                    !window.location.pathname.includes('/login')) {
                    window.location.href = '/signin';
                }
                
                return Promise.reject(error);
            }

            try {
                // Gọi API refresh token
                const response = await axios.post(
                    `${environment.apiBaseUrl}/auth/refresh`,
                    { 
                        refreshToken,
                        accessToken: tokenManager.getAccessToken()
                    },
                );

                // ✅ Parse response theo cấu trúc backend
                const responseData = response.data?.data || response.data;
                const newAccessToken = responseData.accessToken;

                if (!newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                // Lưu accessToken mới vào cookies
                tokenManager.setAccessToken(newAccessToken);
                // ✅ Giữ nguyên refreshToken cũ (backend không trả về refreshToken mới)

                // Cập nhật Redux store với accessToken mới
                store.dispatch(setToken({
                    accessToken: newAccessToken,
                    refreshToken: refreshToken, // Giữ nguyên refreshToken cũ
                }));

                console.log('✅ Token refreshed successfully');

                // Thêm token mới vào header
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Xử lý các request đang đợi
                processQueue(null, newAccessToken);

                // Retry request gốc
                return axios(originalRequest);
            } catch (refreshError) {
                // Refresh token thất bại → Logout
                console.error('❌ Refresh token failed:', refreshError);
                processQueue(refreshError as AxiosError, null);
                tokenManager.clearTokens();
                store.dispatch(logout());
                
                // ✅ Chỉ redirect nếu chưa ở trang login
                if (!window.location.pathname.includes('/signin') && 
                    !window.location.pathname.includes('/login')) {
                    window.location.href = '/signin';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ✅ Xử lý các lỗi khác
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
    }
);

export default http;