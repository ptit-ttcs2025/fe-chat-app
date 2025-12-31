/**
 * Group API Types & Interfaces
 * Định nghĩa types cho Group Management System
 * Theo API_DOCUMENTATION.md - Section 6: Group Management APIs
 */

// ===========================
// GROUP TYPES
// ===========================

export interface IGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  adminId: string;
  isPublic: boolean;
  isSendMessageAllowed: boolean;
  inviteLink?: string;
  createdAt: string;
  updatedAt?: string;
}

// ===========================
// GROUP MEMBER TYPES
// ===========================

export type MemberRole = 'ROLE_ADMIN' | 'MEMBER';

export interface IGroupMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  role: MemberRole;
  joinedAt: string;
  isOnline?: boolean;
  lastActiveAt?: string;
}

// ===========================
// REQUEST DTOs
// ===========================

export interface CreateGroupRequest {
  name: string;                    // Required
  description?: string;            // Optional
  avatarUrl?: string;              // Optional
  isPublic?: boolean;              // Optional, default: false
  isSendMessageAllowed?: boolean;  // Optional, default: true
  memberIds?: string[];            // Optional - Thêm members khi tạo
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  isSendMessageAllowed?: boolean;
}

export interface AddMembersRequest {
  memberIds: string[];  // Array of user IDs to add
}

export interface RemoveMemberRequest {
  memberId: string;  // User ID to remove
}

// ===========================
// FILTER & SEARCH
// ===========================

export interface GroupMemberFilter {
  name?: string;      // Tên thành viên để search
  page?: number;      // Page number (0-based)
  size?: number;      // Items per page
}

// ===========================
// RESPONSE DTOs
// ===========================

export interface GroupResponse extends IGroup {
  memberCount?: number;
  onlineMemberCount?: number;
}

export interface MemberResponse extends IGroupMember {
  email?: string;
  bio?: string;
}

// Pagination response (reuse from chat.type.ts)
export interface PaginatedResponse<T> {
  meta: {
    pageNumber: number;      // Current page (0-based)
    pageSize: number;        // Items per page
    totalElements: number;   // Total items
    totalPages: number;      // Total pages
    sortBy?: string;         // Sort field
    isDescending?: boolean;  // Sort direction
  };
  results: T[];             // Array of items
}

// API Response
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  data?: T;
  errors?: ErrorDetail[];
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

