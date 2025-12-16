import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import unreadApis from '@/apis/unread/unread.api';
import type { UnreadSummary } from '@/types/unread';
import authStorage from '@/lib/authStorage';

// Query Keys
export const UNREAD_KEYS = {
  all: ['unread'] as const,
  summary: () => [...UNREAD_KEYS.all, 'summary'] as const,
  conversations: () => [...UNREAD_KEYS.all, 'conversations'] as const,
  totalCount: () => [...UNREAD_KEYS.all, 'totalCount'] as const,
  byConversation: (id: string) => [...UNREAD_KEYS.all, 'conversation', id] as const,
};

/**
 * Hook lấy tổng hợp tin nhắn chưa đọc
 * Recommended cho initial load
 */
export function useUnreadSummary() {
  return useQuery<UnreadSummary>({
    queryKey: UNREAD_KEYS.summary(),
    queryFn: unreadApis.getUnreadSummary,
    enabled: !!authStorage.getAccessToken(), // Chỉ gọi khi đã đăng nhập
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook lấy tổng số tin nhắn chưa đọc (light-weight)
 */
export function useTotalUnreadCount() {
  return useQuery<number>({
    queryKey: UNREAD_KEYS.totalCount(),
    queryFn: unreadApis.getTotalUnreadCount,
    enabled: !!authStorage.getAccessToken(), // Chỉ gọi khi đã đăng nhập
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook lấy số tin nhắn chưa đọc của một conversation
 */
export function useUnreadCountByConversation(conversationId: string) {
  return useQuery<number>({
    queryKey: UNREAD_KEYS.byConversation(conversationId),
    queryFn: () => unreadApis.getUnreadCountByConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook đánh dấu tin nhắn đã đọc
 */
export function useMarkUnreadAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageIds,
    }: {
      conversationId: string;
      messageIds: string[];
    }) => unreadApis.markAsRead(conversationId, messageIds),
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.summary() });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.totalCount() });
      queryClient.invalidateQueries({
        queryKey: UNREAD_KEYS.byConversation(variables.conversationId),
      });
    },
  });
}

/**
 * Hook để cập nhật unread count khi nhận tin nhắn mới (từ WebSocket)
 * Dùng trong WebSocket listener nếu cần tối ưu realtime (hiện tại chưa tích hợp trực tiếp)
 */
export function useUpdateUnreadOnNewMessage() {
  const queryClient = useQueryClient();

  const incrementUnreadCount = (conversationId: string) => {
    // Update summary
    queryClient.setQueryData<UnreadSummary>(UNREAD_KEYS.summary(), (old) => {
      if (!old) return old;

      const existingConv = old.unreadConversations.find(
        (c) => c.conversationId === conversationId,
      );

      if (existingConv) {
        return {
          ...old,
          totalUnreadCount: old.totalUnreadCount + 1,
          unreadConversations: old.unreadConversations.map((c) =>
            c.conversationId === conversationId
              ? { ...c, unreadCount: c.unreadCount + 1 }
              : c,
          ),
        };
      }

      return {
        ...old,
        totalUnreadCount: old.totalUnreadCount + 1,
        unreadConversationCount: old.unreadConversationCount + 1,
      };
    });

    // Update total count
    queryClient.setQueryData<number>(UNREAD_KEYS.totalCount(), (old) => (old ?? 0) + 1);
  };

  const resetUnreadCount = (conversationId: string) => {
    queryClient.setQueryData<UnreadSummary>(UNREAD_KEYS.summary(), (old) => {
      if (!old) return old;

      const conv = old.unreadConversations.find((c) => c.conversationId === conversationId);
      const unreadToRemove = conv?.unreadCount ?? 0;

      return {
        ...old,
        totalUnreadCount: Math.max(0, old.totalUnreadCount - unreadToRemove),
        unreadConversationCount: Math.max(0, old.unreadConversationCount - 1),
        unreadConversations: old.unreadConversations.filter(
          (c) => c.conversationId !== conversationId,
        ),
      };
    });

    queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.totalCount() });
  };

  return { incrementUnreadCount, resetUnreadCount };
}


