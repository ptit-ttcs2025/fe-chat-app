import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePersonalNotifications } from './useWebSocketChat';
import { UNREAD_KEYS } from './useUnreadMessages';

/**
 * Đồng bộ số tin nhắn chưa đọc (unread) với WebSocket.
 *
 * - Lắng nghe tin nhắn mới từ queue cá nhân `/user/queue/messages`
 * - Mỗi khi có tin nhắn mới (tới user hiện tại), tự động:
 *   + invalidate unread summary & total count
 *   + invalidate danh sách conversations để cập nhật lastMessage
 */
export const useUnreadWebSocketSync = () => {
  const queryClient = useQueryClient();

  usePersonalNotifications(
    (message) => {
      // Khi có tin nhắn mới gửi tới user hiện tại (kể cả khi đang ở tab khác)
      // -> Refresh unread summary + tổng số + conversations list
      queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.summary() });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.totalCount() });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    true,
  );

  // Hook này không trả về gì, chỉ để side-effect WebSocket
  useEffect(() => {
    // Giữ cho hook luôn được mount trong suốt vòng đời layout
  }, []);
};


