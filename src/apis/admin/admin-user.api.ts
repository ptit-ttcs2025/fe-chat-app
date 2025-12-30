/**
 * Admin User Management API
 * REST API endpoints cho Admin User Management
 * Theo API_DOCUMENTATION.md - Section: User Management APIs
 */

import http from '@/lib/apiBase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
  IAdminUser,
  IAdminUserListParams,
  IAdminUserListResponse,
  IUpdateUserStatusRequest,
  IUpdateUserStatusResponse,
  IDeleteUserResponse,
  ApiResponse,
} from './admin-user.type';

const URI = '/users';  // Admin uses same endpoint with ROLE_ADMIN token

// ==================== API METHODS ====================

export const adminUserApis = {
  /**
   * Lấy danh sách users với pagination & filters
   * GET /users?name=string&page=0&size=20
   */
  listUsers: async (
    params: IAdminUserListParams = {}
  ): Promise<IAdminUserListResponse> => {
    const response = await http.get<ApiResponse<IAdminUserListResponse>>(
      URI,
      { params }
    );
    
    // Response interceptor đã xử lý và trả về data trực tiếp
    // Nếu response.data có nested 'data', lấy nested data
    // Nếu không, response.data chính là data
    const responseData = response.data as any;
    if (responseData && typeof responseData === 'object' && 'data' in responseData && !('meta' in responseData)) {
      return responseData.data;
    }
    
    // Response.data đã là data trực tiếp
    return responseData as IAdminUserListResponse;
  },

  /**
   * Lấy chi tiết user by ID
   * GET /users/{userId}
   */
  getUserById: async (userId: string): Promise<IAdminUser> => {
    const response = await http.get<ApiResponse<IAdminUser>>(
      `${URI}/${userId}`
    );
    return response.data.data!;
  },

  /**
   * Cập nhật user status (ACTIVE/SUSPENDED/BANNED)
   * PATCH /users/{userId}/status
   */
  updateUserStatus: async (
    userId: string,
    payload: IUpdateUserStatusRequest
  ): Promise<IUpdateUserStatusResponse> => {
    const response = await http.patch<ApiResponse<IUpdateUserStatusResponse>>(
      `${URI}/${userId}/status`,
      payload
    );
    return response.data.data!;
  },

  /**
   * Xóa user (soft delete)
   * DELETE /users/{userId}
   */
  deleteUser: async (userId: string): Promise<IDeleteUserResponse> => {
    const response = await http.delete<ApiResponse<IDeleteUserResponse>>(
      `${URI}/${userId}`
    );
    return { message: response.data.message };
  },
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook: Lấy danh sách users với pagination
 */
export const useAdminUserList = (params: IAdminUserListParams = {}) => {
  const defaultResponse: IAdminUserListResponse = {
    meta: {
      pageNumber: params.page || 0,
      pageSize: params.size || 20,
      totalElements: 0,
      totalPages: 0,
      sortBy: params.sortBy,
      isDescending: params.sortDirection === 'DESC',
    },
    results: [],
  };

  return useQuery<IAdminUserListResponse, AxiosError>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      try {
        const result = await adminUserApis.listUsers(params);
        // Đảm bảo không bao giờ trả về undefined
        if (!result || typeof result !== 'object' || !('meta' in result) || !('results' in result)) {
          return defaultResponse;
        }
        return result;
      } catch (error) {
        // Return default values if API fails
        return defaultResponse;
      }
    },
    placeholderData: defaultResponse, // Giá trị placeholder để tránh undefined
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook: Lấy user detail
 */
export const useAdminUserDetail = (userId: string, enabled: boolean = true) => {
  return useQuery<IAdminUser, AxiosError>({
    queryKey: ['admin', 'users', userId],
    queryFn: () => adminUserApis.getUserById(userId),
    enabled: !!userId && enabled,
  });
};

/**
 * Hook: Update user status
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateUserStatusResponse,
    AxiosError<{ message: string }>,
    { userId: string; payload: IUpdateUserStatusRequest }
  >({
    mutationFn: ({ userId, payload }) =>
      adminUserApis.updateUserStatus(userId, payload),
    onSuccess: () => {
      // Invalidate queries để refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};

/**
 * Hook: Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IDeleteUserResponse,
    AxiosError<{ message: string }>,
    string
  >({
    mutationFn: (userId: string) => adminUserApis.deleteUser(userId),
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
};
