/**
 * Admin Statistics API
 * REST API endpoints cho Admin Dashboard Statistics
 * Theo API_DOCUMENTATION.md - Section: Admin Dashboard APIs
 */

import http from '@/lib/apiBase';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const URI = '/admin/dashboard';

// ==================== TYPES ====================

export interface IAdminDashboardStats {
  totalUsers: number;
  userGrowth: string;      // "+5.3%"
  totalGroups: number;
  groupGrowth: string;     // "-2.0%"
  totalChats: number;
  chatGrowth: string;      // "+15.2%"
  totalReports: number;
  reportGrowth: string;    // "+8.1%"
}

export interface IRecentUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  regDate: string;         // ISO 8601
  lastLoginTime?: string;  // ISO 8601
}

export interface IRecentGroup {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  lastActivity: string;
  memberCount: number;
}

export interface IMonthlyAttendance {
  month: number;
  monthName: string;
  activeUserCount: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
}

// ==================== API METHODS ====================

export const adminStatisticsApis = {
  /**
   * Lấy dashboard statistics
   * GET /admin/dashboard/stats
   */
  getDashboardStats: async (): Promise<IAdminDashboardStats> => {
    const response = await http.get<ApiResponse<IAdminDashboardStats>>(`${URI}/stats`);
    
    // Response interceptor đã xử lý và trả về data trực tiếp
    // Nếu response.data có nested 'data', lấy nested data
    // Nếu không, response.data chính là data
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'data' in responseData && !('totalUsers' in responseData)) {
      return responseData.data;
    }
    
    // Response.data đã là data trực tiếp
    return responseData as IAdminDashboardStats;
  },

  /**
   * Lấy recent joined users (top 10)
   * GET /admin/dashboard/recent-users
   */
  getRecentUsers: async (): Promise<IRecentUser[]> => {
    const response = await http.get<ApiResponse<IRecentUser[]>>(`${URI}/recent-users`);
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return Array.isArray(responseData.data) ? responseData.data : [];
    }
    return Array.isArray(responseData) ? responseData : [];
  },

  /**
   * Lấy recent created groups (top 10)
   * GET /admin/dashboard/recent-groups
   */
  getRecentGroups: async (): Promise<IRecentGroup[]> => {
    const response = await http.get<ApiResponse<IRecentGroup[]>>(`${URI}/recent-groups`);
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return Array.isArray(responseData.data) ? responseData.data : [];
    }
    return Array.isArray(responseData) ? responseData : [];
  },

  /**
   * Lấy monthly attendance
   * GET /admin/dashboard/attendance?year=2024
   */
  getMonthlyAttendance: async (year?: number): Promise<IMonthlyAttendance[]> => {
    const params = year ? { year } : {};
    const response = await http.get<ApiResponse<IMonthlyAttendance[]>>(`${URI}/attendance`, { params });
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return Array.isArray(responseData.data) ? responseData.data : [];
    }
    return Array.isArray(responseData) ? responseData : [];
  },
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook: Lấy admin dashboard statistics
 */
export const useAdminDashboardStats = () => {
  const defaultStats: IAdminDashboardStats = {
    totalUsers: 0,
    userGrowth: '0%',
    totalGroups: 0,
    groupGrowth: '0%',
    totalChats: 0,
    chatGrowth: '0%',
    totalReports: 0,
    reportGrowth: '0%',
  };

  return useQuery<IAdminDashboardStats, AxiosError>({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      try {
        const result = await adminStatisticsApis.getDashboardStats();
        // Đảm bảo không bao giờ trả về undefined
        if (!result || typeof result !== 'object') {
          return defaultStats;
        }
        return result;
      } catch (error) {
        // Return default values if API fails
        return defaultStats;
      }
    },
    placeholderData: defaultStats, // Giá trị placeholder để tránh undefined
    staleTime: 60000, // 1 minute (matches backend cache)
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Hook: Lấy recent users
 */
export const useAdminRecentUsers = () => {
  return useQuery<IRecentUser[], AxiosError>({
    queryKey: ['admin', 'dashboard', 'recent-users'],
    queryFn: async () => {
      try {
        const result = await adminStatisticsApis.getRecentUsers();
        // Đảm bảo không bao giờ trả về undefined
        return Array.isArray(result) ? result : [];
      } catch (error) {
        // Return empty array if API fails
        return [];
      }
    },
    placeholderData: [], // Giá trị placeholder để tránh undefined
    staleTime: 60000,
  });
};

/**
 * Hook: Lấy recent groups
 */
export const useAdminRecentGroups = () => {
  return useQuery<IRecentGroup[], AxiosError>({
    queryKey: ['admin', 'dashboard', 'recent-groups'],
    queryFn: async () => {
      try {
        const result = await adminStatisticsApis.getRecentGroups();
        // Đảm bảo không bao giờ trả về undefined
        return Array.isArray(result) ? result : [];
      } catch (error) {
        // Return empty array if API fails
        return [];
      }
    },
    placeholderData: [], // Giá trị placeholder để tránh undefined
    staleTime: 60000,
  });
};

/**
 * Hook: Lấy monthly attendance
 */
export const useAdminMonthlyAttendance = (year?: number) => {
  return useQuery<IMonthlyAttendance[], AxiosError>({
    queryKey: ['admin', 'dashboard', 'attendance', year],
    queryFn: async () => {
      try {
        const result = await adminStatisticsApis.getMonthlyAttendance(year);
        // Đảm bảo không bao giờ trả về undefined
        return Array.isArray(result) ? result : [];
      } catch (error) {
        // Return empty array if API fails
        return [];
      }
    },
    placeholderData: [], // Giá trị placeholder để tránh undefined
    staleTime: 300000, // 5 minutes
  });
};
