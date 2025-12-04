import http from '@/lib/apiBase';
import type { UnreadSummary, UnreadConversation } from '@/types/unread';

const URI = '/api/v1';

export const unreadApis = {
  /**
   * Lấy tổng hợp tin nhắn chưa đọc
   * GET /messages/unread/summary
   */
  getUnreadSummary: async (): Promise<UnreadSummary> => {
    const response = await http.get(`${URI}/messages/unread/summary`) as any;
    // Hỗ trợ cả format { data: {...} } và {...}
    return (response?.data?.data ?? response?.data ?? response) as UnreadSummary;
  },

  /**
   * Lấy danh sách conversation có tin nhắn chưa đọc
   * GET /messages/unread/conversations
   */
  getUnreadConversations: async (): Promise<UnreadConversation[]> => {
    const response = await http.get(`${URI}/messages/unread/conversations`) as any;
    return (response?.data?.data ?? response?.data ?? response ?? []) as UnreadConversation[];
  },

  /**
   * Lấy tổng số tin nhắn chưa đọc (light-weight)
   * GET /messages/unread/count
   */
  getTotalUnreadCount: async (): Promise<number> => {
    const response = await http.get(`${URI}/messages/unread/count`) as any;
    return (response?.data?.data ?? response?.data ?? response ?? 0) as number;
  },

  /**
   * Lấy số tin nhắn chưa đọc của một conversation
   * GET /messages/unread/count/{conversationId}
   */
  getUnreadCountByConversation: async (conversationId: string): Promise<number> => {
    const response = await http.get(`${URI}/messages/unread/count/${conversationId}`) as any;
    return (response?.data?.data ?? response?.data ?? response ?? 0) as number;
  },

  /**
   * Đánh dấu tin nhắn đã đọc
   * POST /messages/read
   */
  markAsRead: async (conversationId: string, messageIds: string[]): Promise<void> => {
    await http.post(`${URI}/messages/read`, {
      conversationId,
      messageIds,
    });
  },
};

export default unreadApis;


