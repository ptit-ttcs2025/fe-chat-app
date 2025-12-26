import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePersonalNotifications } from './useWebSocketChat';
import { UNREAD_KEYS } from './useUnreadMessages';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

/**
 * Đồng bộ số tin nhắn chưa đọc (unread) với WebSocket.
 *
 * - Lắng nghe tin nhắn mới từ queue cá nhân `/user/queue/messages`
 * - Mỗi khi có tin nhắn mới (từ NGƯỜI KHÁC và KHÔNG PHẢI conversation đang mở), tự động:
 *   + invalidate unread summary & total count
 *   + invalidate danh sách conversations để cập nhật lastMessage
 *
 */
export const useUnreadWebSocketSync = () => {
  const queryClient = useQueryClient();

  // Get current user ID to filter out own messages
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id;

  // Get current conversation ID to filter out messages from active conversation
  const selectedConversationId = useSelector((state: RootState) => state.common.selectedConversationId);

  // Track processed message IDs to prevent duplicate invalidations
  const processedMessageIds = useRef<Set<string>>(new Set());
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  usePersonalNotifications(
    (message) => {
      // ✅ CRITICAL FIX: Bỏ qua tin nhắn đã xử lý (tránh duplicate từ WebSocket)
      if (processedMessageIds.current.has(message.id)) {
        console.log('⏭️ Skipping duplicate message:', message.id);
        return;
      }

      console.log('📨 WebSocket message received:', {
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        currentUserId,
        selectedConversationId,
        isOwnMessage: message.senderId === currentUserId,
        isActiveConversation: message.conversationId === selectedConversationId,
        content: message.content?.substring(0, 50),
      });

      // Mark as processed
      processedMessageIds.current.add(message.id);

      // ✅ CRITICAL FIX: KHÔNG invalidate GÌ CẢ nếu tin nhắn từ conversation đang mở
      // User đang xem conversation này → useChatMessages sẽ tự động handle:
      // - Append message vào UI
      // - Auto mark as read
      // - Update lastMessage khi rời conversation
      const isActiveConversation = message.conversationId === selectedConversationId;

      if (isActiveConversation) {
        console.log('⏭️ Message from active conversation - skipping ALL invalidations (handled by useChatMessages)');
        // ✅ FIX: KHÔNG invalidate conversations để tránh backend trả về unread count sai!
        // useChatMessages đã handle mọi thứ cho conversation đang mở
        return;
      }

      // ✅ FIX: Chỉ invalidate unread count khi nhận tin nhắn TỪ NGƯỜI KHÁC
      // Nếu là tin nhắn của mình gửi đi → Không tăng unread count
      if (message.senderId !== currentUserId) {
        console.log('✅ Message from other user in different conversation - invalidating unread counts');

        // Debounce invalidate để tránh gọi nhiều lần
        if (invalidateTimeoutRef.current) {
          clearTimeout(invalidateTimeoutRef.current);
        }

        invalidateTimeoutRef.current = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.summary() });
          queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.totalCount() });
          // Invalidate conversations để update unread count + lastMessage
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        }, 300); // Debounce 300ms
      } else {
        console.log('⏭️ Message from self in different conversation - only update lastMessage');

        // Tin nhắn của mình nhưng ở conversation KHÁC (không đang mở)
        // Chỉ cần update conversations list để hiển thị lastMessage
        // KHÔNG invalidate unread counts vì không phải tin nhắn từ người khác
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      }

      // Cleanup old processed IDs (keep last 100)
      if (processedMessageIds.current.size > 100) {
        const idsArray = Array.from(processedMessageIds.current);
        processedMessageIds.current = new Set(idsArray.slice(-100));
      }
    },
    true,
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }
    };
  }, []);
};
