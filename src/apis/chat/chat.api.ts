/**
 * Chat API Client  
 * REST API endpoints cho chat system (Updated theo API_DOCUMENTATION.md)
 */

import http  from '@/lib/apiBase';
import {
  SendMessageRequest,
  MarkAsReadRequest,
  SearchMessagesRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  AddParticipantsRequest,
  RemoveParticipantRequest,
  FileUploadRequest,
  ApiResponse,
  IMessage,
  IConversation,
  PaginatedResponse,
  FileUploadResponse,
  ConversationFilter,
  MessageFilter,
} from './chat.type';

// ===========================
// MESSAGE APIs
// ===========================

/**
 * Gửi tin nhắn mới
 * POST /messages
 */
export const sendMessage = async (data: SendMessageRequest): Promise<ApiResponse<IMessage>> => {
  const response = await http.post<ApiResponse<IMessage>>('/messages', data);
  return response.data;
};

/**
 * Lấy danh sách tin nhắn của conversation
 * GET /messages?conversationId={id}&page={page}&size={size}&keyword={keyword}
 */
export const getMessages = async (
  conversationId: string,
  page: number = 0,
  size: number = 20,
  keyword?: string
): Promise<ApiResponse<PaginatedResponse<IMessage>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<IMessage>>>(
    '/messages',
    {
      params: {
        conversationId,
        page,
        size,
        ...(keyword && { keyword }),
      },
    }
  );
  return response.data;
};

/**
 * Lấy một tin nhắn cụ thể
 */
export const getMessage = async (messageId: string): Promise<ApiResponse<IMessage>> => {
  const response = await http.get<ApiResponse<IMessage>>(`/messages/${messageId}`);
  return response.data;
};

/**
 * Tìm kiếm tin nhắn trong conversation
 * GET /messages/search?conversationId={id}&keyword={keyword}
 */
export const searchMessages = async (
  conversationId: string,
  keyword: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PaginatedResponse<IMessage>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<IMessage>>>(
    '/messages/search',
    {
      params: {
        conversationId,
        keyword,
        page,
        size,
      },
    }
  );
  return response.data;
};

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markMessagesAsRead = async (
  data: MarkAsReadRequest
): Promise<ApiResponse<void>> => {
  const response = await http.post<ApiResponse<void>>('/messages/read', data);
  return response.data;
};

/**
 * Pin/Unpin tin nhắn
 */
export const togglePinMessage = async (
  messageId: string,
  pinned: boolean
): Promise<ApiResponse<IMessage>> => {
  const response = await http.put<ApiResponse<IMessage>>(
    `/messages/${messageId}/pin`,
    null,
    {
      params: { pinned },
    }
  );
  return response.data;
};

/**
 * Xóa tin nhắn
 */
export const deleteMessage = async (messageId: string): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(`/messages/${messageId}`);
  return response.data;
};

/**
 * Chỉnh sửa tin nhắn
 */
export const updateMessage = async (
  messageId: string,
  content: string
): Promise<ApiResponse<IMessage>> => {
  const response = await http.put<ApiResponse<IMessage>>(
    `/messages/${messageId}`,
    { content }
  );
  return response.data;
};

/**
 * Lấy tin nhắn đã pin trong conversation
 */
export const getPinnedMessages = async (
  conversationId: string
): Promise<ApiResponse<IMessage[]>> => {
  const response = await http.get<ApiResponse<IMessage[]>>(
    '/messages/pinned',
    {
      params: { conversationId },
    }
  );
  return response.data;
};

// ===========================
// CONVERSATION APIs
// ===========================

/**
 * Lấy danh sách conversations
 */
export const getConversations = async (
  page: number = 0,
  size: number = 20,
  filter?: ConversationFilter
): Promise<ApiResponse<PaginatedResponse<IConversation>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<IConversation>>>(
    '/conversations',
    {
      params: {
        page,
        size,
        ...filter,
      },
    }
  );
  return response.data;
};

/**
 * Lấy thông tin một conversation
 */
export const getConversation = async (
  conversationId: string
): Promise<ApiResponse<IConversation>> => {
  const response = await http.get<ApiResponse<IConversation>>(
    `/conversations/${conversationId}`
  );
  return response.data;
};

/**
 * Tạo conversation ONE_TO_ONE mới
 * POST /conversations
 */
export const createConversation = async (
  otherMemberId: string
): Promise<ApiResponse<IConversation>> => {
  const response = await http.post<ApiResponse<IConversation>>(
    '/conversations',
    { otherMemberId }
  );
  return response.data;
};

/**
 * Cập nhật thông tin conversation
 */
export const updateConversation = async (
  conversationId: string,
  data: UpdateConversationRequest
): Promise<ApiResponse<IConversation>> => {
  const response = await http.put<ApiResponse<IConversation>>(
    `/conversations/${conversationId}`,
    data
  );
  return response.data;
};

/**
 * Xóa conversation
 */
export const deleteConversation = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(
    `/conversations/${conversationId}`
  );
  return response.data;
};

/**
 * Thêm participants vào conversation
 */
export const addParticipants = async (
  data: AddParticipantsRequest
): Promise<ApiResponse<IConversation>> => {
  const response = await http.post<ApiResponse<IConversation>>(
    `/conversations/${data.conversationId}/participants`,
    { userIds: data.userIds }
  );
  return response.data;
};

/**
 * Xóa participant khỏi conversation
 */
export const removeParticipant = async (
  data: RemoveParticipantRequest
): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(
    `/conversations/${data.conversationId}/participants/${data.userId}`
  );
  return response.data;
};

/**
 * Rời khỏi conversation
 */
export const leaveConversation = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  const response = await http.post<ApiResponse<void>>(
    `/conversations/${conversationId}/leave`
  );
  return response.data;
};

/**
 * Mute/Unmute conversation
 */
export const toggleMuteConversation = async (
  conversationId: string,
  muted: boolean
): Promise<ApiResponse<IConversation>> => {
  const response = await http.put<ApiResponse<IConversation>>(
    `/conversations/${conversationId}/mute`,
    null,
    {
      params: { muted },
    }
  );
  return response.data;
};

/**
 * Pin/Unpin conversation
 */
export const togglePinConversation = async (
  conversationId: string,
  pinned: boolean
): Promise<ApiResponse<IConversation>> => {
  const response = await http.put<ApiResponse<IConversation>>(
    `/conversations/${conversationId}/pin`,
    null,
    {
      params: { pinned },
    }
  );
  return response.data;
};

// ===========================
// FILE UPLOAD APIs
// ===========================

/**
 * Upload file/image
 */
export const uploadFile = async (
  data: FileUploadRequest
): Promise<ApiResponse<FileUploadResponse>> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('conversationId', data.conversationId);
  formData.append('type', data.type);

  const response = await http.post<ApiResponse<FileUploadResponse>>(
    '/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Upload ảnh
 */
export const uploadImage = async (
  file: File,
  conversationId: string
): Promise<ApiResponse<FileUploadResponse>> => {
  return uploadFile({
    file,
    conversationId,
    type: 'IMAGE',
  });
};

/**
 * Upload voice message
 */
export const uploadVoice = async (
  file: File,
  conversationId: string
): Promise<ApiResponse<FileUploadResponse>> => {
  return uploadFile({
    file,
    conversationId,
    type: 'VOICE',
  });
};

// ===========================
// STATISTICS & ANALYTICS
// ===========================

/**
 * Lấy số tin nhắn chưa đọc tổng
 */
export const getTotalUnreadCount = async (): Promise<ApiResponse<number>> => {
  const response = await http.get<ApiResponse<number>>('/messages/unread/count');
  return response.data;
};

/**
 * Lấy số tin nhắn chưa đọc của conversation
 */
export const getConversationUnreadCount = async (
  conversationId: string
): Promise<ApiResponse<number>> => {
  const response = await http.get<ApiResponse<number>>(
    `/messages/unread/count/${conversationId}`
  );
  return response.data;
};

// ===========================
// EXPORT ALL
// ===========================

export const chatApi = {
  // Messages
  sendMessage,
  getMessages,
  getMessage,
  searchMessages,
  markMessagesAsRead,
  togglePinMessage,
  deleteMessage,
  updateMessage,
  getPinnedMessages,

  // Conversations
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  addParticipants,
  removeParticipant,
  leaveConversation,
  toggleMuteConversation,
  togglePinConversation,

  // Files
  uploadFile,
  uploadImage,
  uploadVoice,

  // Statistics
  getTotalUnreadCount,
  getConversationUnreadCount,
};

export default chatApi;

