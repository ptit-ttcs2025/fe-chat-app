// src/types/unread.ts
// Types cho tính năng tin nhắn chưa đọc (theo UNREAD_MESSAGES_GUIDE.md & API_DOCUMENTATION.md)

/**
 * Thông tin tin nhắn chưa đọc của một conversation
 */
export interface UnreadConversation {
  conversationId: string;
  unreadCount: number;
  lastReadMessageId: string | null;
  lastMessageTimestamp: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
  lastMessageSenderId: string | null;
  conversationName: string | null;
  conversationAvatarUrl: string | null;
  conversationType: 'ONE_TO_ONE' | 'GROUP';
}

/**
 * Tổng hợp tin nhắn chưa đọc của user
 */
export interface UnreadSummary {
  totalUnreadCount: number;
  unreadConversationCount: number;
  unreadConversations: UnreadConversation[];
}


