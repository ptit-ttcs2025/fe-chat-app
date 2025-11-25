/**
 * Chat API Types & Interfaces
 * Định nghĩa types cho toàn bộ hệ thống chat
 */

// ===========================
// MESSAGE TYPES
// ===========================

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';

export interface MessageAttachment {
  id: string;
  url: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  fileName?: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  type: MessageType;
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  readByUserIds: string[];
  readCount: number;
  repliedToMessageId?: string;
  repliedToMessage?: IMessage;
  attachment?: MessageAttachment;
  isDeleted?: boolean;
}

// ===========================
// CONVERSATION TYPES
// ===========================

export type ConversationType = 'PRIVATE' | 'GROUP';

export interface IConversation {
  id: string;
  name?: string;
  type: ConversationType;
  participants: IParticipant[];
  lastMessage?: IMessage;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
  avatarUrl?: string;
  isActive: boolean;
  isMuted: boolean;
  isPinned: boolean;
}

export interface IParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  role?: 'ADMIN' | 'MEMBER';
  isOnline: boolean;
  lastSeenAt?: string;
  joinedAt: string;
}

// ===========================
// WEBSOCKET EVENT TYPES
// ===========================

export interface TypingStatus {
  type: 'TYPING_STATUS';
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface MessageRead {
  type: 'MESSAGE_READ';
  conversationId: string;
  userId: string;
  userName: string;
  messageIds: string[];
  readUpToTimestamp?: string;
  timestamp: string;
}

export interface UserStatus {
  type: 'USER_STATUS';
  userId: string;
  userName: string;
  isOnline: boolean;
  timestamp: string;
}

export interface MessageResponse extends IMessage {
  // Thêm các fields bổ sung nếu cần
}

// ===========================
// REQUEST DTOs
// ===========================

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  repliedToMessageId?: string;
  attachmentId?: string;
}

export interface MarkAsReadRequest {
  conversationId: string;
  messageIds: string[];
}

export interface TypingStatusRequest {
  conversationId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface SearchMessagesRequest {
  conversationId: string;
  keyword: string;
  page?: number;
  size?: number;
}

// ===========================
// RESPONSE DTOs
// ===========================

// Pagination response (theo API_DOCUMENTATION.md)
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

// API Response (theo API_DOCUMENTATION.md)
export interface ApiResponse<T> {
  statusCode: number;        // HTTP status code
  message: string;           // Message mô tả kết quả
  timestamp: string;         // ISO 8601 timestamp
  path?: string;             // API path (optional)
  data?: T;                  // Response data (optional)
  errors?: ErrorDetail[];    // Validation errors (optional)
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface MessagesResponse {
  data: PaginatedResponse<IMessage>;
}

export interface ConversationsResponse {
  data: PaginatedResponse<IConversation>;
}

export interface MessageActionResponse {
  success: boolean;
  message: string;
  data?: IMessage;
}

// ===========================
// FILE UPLOAD TYPES
// ===========================

export interface FileUploadRequest {
  file: File;
  conversationId: string;
  type: 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';
}

export interface FileUploadResponse {
  id: string;
  url: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  fileName: string;
}

// ===========================
// CONVERSATION ACTIONS
// ===========================

export interface CreateConversationRequest {
  name?: string;
  type: ConversationType;
  participantIds: string[];
}

export interface UpdateConversationRequest {
  name?: string;
  avatarUrl?: string;
}

export interface AddParticipantsRequest {
  conversationId: string;
  userIds: string[];
}

export interface RemoveParticipantRequest {
  conversationId: string;
  userId: string;
}

// ===========================
// SEARCH & FILTER
// ===========================

export interface ConversationFilter {
  type?: ConversationType;
  isPinned?: boolean;
  hasUnread?: boolean;
  searchTerm?: string;
}

export interface MessageFilter {
  conversationId: string;
  senderId?: string;
  type?: MessageType;
  startDate?: string;
  endDate?: string;
  isPinned?: boolean;
}

