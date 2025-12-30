/**
 * Group API Client
 * REST API endpoints cho Group Management System
 * Theo API_DOCUMENTATION.md - Section 6: Group Management APIs
 */

import http from '@/lib/apiBase';
import type {
  IGroup,
  IGroupMember,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMembersRequest,
  GroupMemberFilter,
  ApiResponse,
  PaginatedResponse,
} from './group.type';

// API Base URI (baseURL đã có trong http client)
const URI = '';

// ===========================
// GROUP CRUD APIs
// ===========================

/**
 * Tạo nhóm mới
 * POST /groups
 */
export const createGroup = async (
  data: CreateGroupRequest
): Promise<ApiResponse<IGroup>> => {
  const response = await http.post<ApiResponse<IGroup>>(`${URI}/groups`, data);
  return response.data;
};

/**
 * Lấy thông tin nhóm theo ID
 * GET /groups/{groupId}
 */
export const getGroup = async (groupId: string): Promise<ApiResponse<IGroup>> => {
  const response = await http.get<ApiResponse<IGroup>>(`${URI}/groups/${groupId}`);
  return response.data;
};

/**
 * Cập nhật thông tin nhóm
 * PUT /groups/{groupId}
 * Note: Chỉ admin mới được phép
 */
export const updateGroup = async (
  groupId: string,
  data: UpdateGroupRequest
): Promise<ApiResponse<IGroup>> => {
  const response = await http.put<ApiResponse<IGroup>>(
    `${URI}/groups/${groupId}`,
    data
  );
  return response.data;
};

/**
 * Xóa nhóm
 * DELETE /groups/{groupId}
 * Note: Chỉ admin mới được phép
 */
export const deleteGroup = async (groupId: string): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(`${URI}/groups/${groupId}`);
  return response.data;
};

/**
 * Rời khỏi nhóm
 * POST /groups/{groupId}/leave
 * Note: Admin phải chuyển quyền trước khi có thể rời nhóm
 */
export const leaveGroup = async (groupId: string): Promise<ApiResponse<void>> => {
  const response = await http.post<ApiResponse<void>>(`${URI}/groups/${groupId}/leave`);
  return response.data;
};

// ===========================
// GROUP MEMBER MANAGEMENT APIs
// ===========================

/**
 * Thêm thành viên vào nhóm
 * POST /groups/{groupId}/members
 */
export const addMembers = async (
  groupId: string,
  data: AddMembersRequest
): Promise<ApiResponse<void>> => {
  const response = await http.post<ApiResponse<void>>(
    `${URI}/groups/${groupId}/members`,
    data
  );
  return response.data;
};

/**
 * Xóa thành viên khỏi nhóm
 * DELETE /groups/{groupId}/members/{memberId}
 * Note: Chỉ admin mới được phép
 */
export const removeMember = async (
  groupId: string,
  memberId: string
): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(
    `${URI}/groups/${groupId}/members/${memberId}`
  );
  return response.data;
};

/**
 * Tìm kiếm thành viên trong nhóm
 * GET /groups/{groupId}/members?name=string&page=0&size=20
 */
export const getMembers = async (
  groupId: string,
  filter?: GroupMemberFilter
): Promise<PaginatedResponse<IGroupMember>> => {
  const response = await http.get(`${URI}/groups/${groupId}/members`, {
    params: {
      name: filter?.name,
      page: filter?.page || 0,
      size: filter?.size || 20,
    },
  });

  // Handle response format (similar to chat.api.ts)
  const responseAny = response as any;

  // Nếu response đã là { meta, results } (đã unwrap)
  if (responseAny && Array.isArray(responseAny.results)) {
    return responseAny as PaginatedResponse<IGroupMember>;
  }

  // Nếu response là { data: { meta, results } }
  if (responseAny?.data && Array.isArray(responseAny.data.results)) {
    return responseAny.data as PaginatedResponse<IGroupMember>;
  }

  // Fallback - trả về empty
  console.warn('⚠️ Unexpected members response format:', response);
  return {
    meta: { pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 },
    results: [],
  };
};

// ===========================
// EXPORT ALL
// ===========================

export const groupApi = {
  // Group CRUD
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  leaveGroup,

  // Member Management
  addMembers,
  removeMember,
  getMembers,
};

export default groupApi;

