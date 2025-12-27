/**
 * Chat API Client
 * REST API endpoints cho chat system (Updated theo API_DOCUMENTATION.md)
 */

import http from "@/lib/apiBase";
import {
  SendMessageRequest,
  MarkAsReadRequest,
  UpdateConversationRequest,
  AddParticipantsRequest,
  RemoveParticipantRequest,
  FileUploadRequest,
  ApiResponse,
  IMessage,
  IConversation,
  PaginatedResponse,
  CursorPaginatedResponse,
  FileUploadResponse,
  ConversationFilter,
  MediaQueryParams,
  MediaMessage,
} from "./chat.type";

// API Base URI (baseURL đã có /api/v1 rồi)
const URI = "";

// ===========================
// MESSAGE APIs
// ===========================

/**
 * Gửi tin nhắn mới
 * POST /api/v1/messages
 */
export const sendMessage = async (
  data: SendMessageRequest
): Promise<ApiResponse<IMessage>> => {
  const response = await http.post<ApiResponse<IMessage>>(
    `${URI}/messages`,
    data
  );
  return response.data;
};

/**
 * Lấy danh sách tin nhắn của conversation
 * GET /api/v1/messages?conversationId={id}&page={page}&size={size}&keyword={keyword}
 */
export const getMessages = async (
  conversationId: string,
  page: number = 0,
  size: number = 20,
  keyword?: string
): Promise<PaginatedResponse<IMessage>> => {
  const response = await http.get(`${URI}/messages`, {
    params: {
      conversationId,
      page,
      size,
      ...(keyword && { keyword }),
    },
  });

  // console.log('📡 getMessages raw response:', response);

  const responseAny = response as any;

  // Nếu response đã là { meta, results } (đã unwrap)
  if (responseAny && Array.isArray(responseAny.results)) {
    return responseAny as PaginatedResponse<IMessage>;
  }

  // Nếu response là { data: { meta, results } }
  if (responseAny?.data && Array.isArray(responseAny.data.results)) {
    return responseAny.data as PaginatedResponse<IMessage>;
  }

  // Fallback - trả về empty
  console.warn("⚠️ Unexpected messages response format:", response);
  return {
    meta: { pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 },
    results: [],
  };
};

/**
 * Lấy một tin nhắn cụ thể
 */
export const getMessage = async (
  messageId: string
): Promise<ApiResponse<IMessage>> => {
  const response = await http.get<ApiResponse<IMessage>>(
    `${URI}/messages/${messageId}`
  );
  return response.data;
};

/**
 * Lấy tin nhắn với Cursor-Based Pagination (Optimized for infinite scroll)
 * GET /api/v1/messages/cursor
 *
 * @param conversationId - ID của conversation
 * @param size - Số lượng tin nhắn mỗi lần load (default: 50)
 * @param beforeMessageId - Load tin nhắn CŨ HƠN message này (scroll up)
 * @param afterMessageId - Load tin nhắn MỚI HƠN message này (refresh)
 *
 * Performance: ~30ms consistent (vs 500ms+ với offset pagination khi page lớn)
 */
export const getMessagesCursor = async (
  conversationId: string,
  size: number = 50,
  beforeMessageId?: string,
  afterMessageId?: string
): Promise<CursorPaginatedResponse<IMessage>> => {
  const response = await http.get(`${URI}/messages/cursor`, {
    params: {
      conversationId,
      size,
      ...(beforeMessageId && { beforeMessageId }),
      ...(afterMessageId && { afterMessageId }),
    },
  });

  const responseAny = response as any;

  // Handle response format: { data: { messages, cursor } }
  if (responseAny?.data?.messages) {
    return responseAny.data as CursorPaginatedResponse<IMessage>;
  }

  // Handle response format: { messages, cursor } (already unwrapped)
  if (responseAny?.messages) {
    return responseAny as CursorPaginatedResponse<IMessage>;
  }

  // Fallback - empty response
  console.warn("⚠️ Unexpected cursor messages response format:", response);
  return {
    messages: [],
    cursor: {
      hasMore: false,
      hasNewer: false,
      oldestMessageId: null,
      newestMessageId: null,
      count: 0,
      pageSize: size,
    },
  };
};

/**
 * Tìm kiếm tin nhắn trong conversation
 * GET /api/v1/messages/search?conversationId={id}&keyword={keyword}
 */
export const searchMessages = async (
  conversationId: string,
  keyword: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PaginatedResponse<IMessage>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<IMessage>>>(
    `${URI}/messages/search`,
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
  const response = await http.post<ApiResponse<void>>(
    `${URI}/messages/read`,
    data
  );
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
    `${URI}/messages/${messageId}/pin`,
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
export const deleteMessage = async (
  messageId: string
): Promise<ApiResponse<void>> => {
  const response = await http.delete<ApiResponse<void>>(
    `${URI}/messages/${messageId}`
  );
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
    `${URI}/messages/${messageId}`,
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
    `${URI}/messages/pinned`,
    {
      params: { conversationId },
    }
  );
  return response.data;
};

/**
 * Lấy media files (ảnh/file) trong conversation
 * GET /api/v1/messages/media?conversationId={id}&type={IMAGE|FILE}&page={page}&size={size}
 */
export const getMediaMessages = async (
  params: MediaQueryParams
): Promise<PaginatedResponse<MediaMessage>> => {
  const { conversationId, type, page = 0, size = 20 } = params;

  const response = await http.get(`${URI}/messages/media`, {
    params: {
      conversationId,
      type,
      page,
      size,
    },
  });

  const responseAny = response as any;

  // Nếu response đã là { meta, results }
  if (responseAny && Array.isArray(responseAny.results)) {
    return responseAny as PaginatedResponse<MediaMessage>;
  }

  // Nếu response là { data: { meta, results } }
  if (responseAny?.data && Array.isArray(responseAny.data.results)) {
    return responseAny.data as PaginatedResponse<MediaMessage>;
  }

  // Fallback
  console.warn("⚠️ Unexpected media response format:", response);
  return {
    meta: { pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 },
    results: [],
  };
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
): Promise<PaginatedResponse<IConversation>> => {
  const response = await http.get(`${URI}/conversations`, {
    params: {
      page,
      size,
      ...filter,
    },
  });

  // Debug log để xem response format
  // console.log('📡 getConversations raw response:', response);

  // Response có thể đã được unwrap bởi interceptor thành nhiều format khác nhau:
  // Format 1: { meta, results } - đã unwrap từ data
  // Format 2: { statusCode, data: { meta, results } } - full response
  // Format 3: { data: { meta, results } } - partial unwrap

  const responseAny = response as any;

  // Nếu response đã là { meta, results } (đã unwrap)
  if (responseAny && Array.isArray(responseAny.results)) {
    return responseAny as PaginatedResponse<IConversation>;
  }

  // Nếu response là { data: { meta, results } }
  if (responseAny?.data && Array.isArray(responseAny.data.results)) {
    return responseAny.data as PaginatedResponse<IConversation>;
  }

  // Fallback - trả về empty
  console.warn("⚠️ Unexpected response format:", response);
  return {
    meta: { pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 },
    results: [],
  };
};

/**
 * Lấy thông tin một conversation
 */
export const getConversation = async (
  conversationId: string
): Promise<ApiResponse<IConversation>> => {
  const response = await http.get<ApiResponse<IConversation>>(
    `${URI}/conversations/${conversationId}`
  );
  return response.data;
};

/**
 * Tạo conversation ONE_TO_ONE mới
 * POST /api/v1/conversations
 */
export const createConversation = async (
  otherMemberId: string
): Promise<ApiResponse<IConversation>> => {
  const response = await http.post<ApiResponse<IConversation>>(
    `${URI}/conversations`,
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
    `${URI}/conversations/${conversationId}`,
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
    `${URI}/conversations/${conversationId}`
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
    `${URI}/conversations/${data.conversationId}/participants`,
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
    `${URI}/conversations/${data.conversationId}/participants/${data.userId}`
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
    `${URI}/conversations/${conversationId}/leave`
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
    `${URI}/conversations/${conversationId}/mute`,
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
    `${URI}/conversations/${conversationId}/pin`,
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
 * Send file/image
 */
export const sendFile = async (
  data: FileUploadRequest
): Promise<ApiResponse<FileUploadResponse>> => {
  const formData = new FormData();
  formData.append("originalFile", data.originalFile);
  formData.append("conversationId", data.conversationId);
  if (data.thumbnailFile) {
    formData.append("thumbnailFile", data.thumbnailFile);
  }
  // Optional message content to send along with the file
  if (data.content && data.content.trim().length > 0) {
    formData.append("content", data.content.trim());
  }

  const response = await http.post<ApiResponse<FileUploadResponse>>(
    `${URI}/messages/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// ===========================
// STATISTICS & ANALYTICS
// ===========================

/**
 * Lấy số tin nhắn chưa đọc tổng
 */
export const getTotalUnreadCount = async (): Promise<ApiResponse<number>> => {
  const response = await http.get<ApiResponse<number>>(
    `${URI}/messages/unread/count`
  );
  return response.data;
};

/**
 * Lấy số tin nhắn chưa đọc của conversation
 */
export const getConversationUnreadCount = async (
  conversationId: string
): Promise<ApiResponse<number>> => {
  const response = await http.get<ApiResponse<number>>(
    `${URI}/messages/unread/count/${conversationId}`
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
  getMessagesCursor,
  getMessage,
  searchMessages,
  markMessagesAsRead,
  togglePinMessage,
  deleteMessage,
  updateMessage,
  getPinnedMessages,
  getMediaMessages,

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
  sendFile,

  // Statistics
  getTotalUnreadCount,
  getConversationUnreadCount,
};

export default chatApi;
