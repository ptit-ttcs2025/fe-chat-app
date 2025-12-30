/**
 * Admin User Management Types
 * Theo API_DOCUMENTATION.md - Admin User Management APIs
 */

// ==================== BASE USER TYPE ====================

export interface IAdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
}

// ==================== REQUEST PARAMETERS ====================

export interface IAdminUserListParams {
  name?: string;           // Search by name
  page?: number;           // 0-based
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface IUpdateUserStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  reason?: string;
}

// ==================== RESPONSE TYPES ====================

export interface IAdminUserListResponse {
  meta: {
    pageNumber: number;      // Current page (0-based)
    pageSize: number;        // Items per page
    totalElements: number;   // Total items
    totalPages: number;      // Total pages
    sortBy?: string;
    isDescending?: boolean;
  };
  results: IAdminUser[];    // Array of users
}

export interface IUpdateUserStatusResponse {
  message: string;
  user: IAdminUser;
}

export interface IDeleteUserResponse {
  message: string;
}

// ==================== API RESPONSE WRAPPER ====================

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  timestamp: string;
  data?: T;
}
