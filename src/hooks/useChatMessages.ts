/**
 * Custom Hook for Chat Messages Management
 * Quản lý messages với REST API và WebSocket realtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/apis/chat/chat.api';
import type {
    IMessage,
    SendMessageRequest,
    MessageResponse,
    MarkAsReadRequest,
} from '@/apis/chat/chat.type';
import { useConversationMessages } from './useWebSocketChat';

interface UseChatMessagesOptions {
    conversationId: string | null;
    pageSize?: number;
    autoMarkAsRead?: boolean;
    currentUserId?: string;
}

export const useChatMessages = ({
    conversationId,
    pageSize = 20,
    autoMarkAsRead = true,
    currentUserId,
}: UseChatMessagesOptions) => {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [page, setPage] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Query key
    const queryKey = ['chat', 'messages', conversationId];

    // Fetch messages từ API
    const {
        data: messagesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: [...queryKey, page],
        queryFn: () =>
            conversationId
                ? chatApi.getMessages(conversationId, page, pageSize)
                : Promise.reject('No conversation selected'),
        enabled: !!conversationId,
        staleTime: 30000, // 30 seconds
    });

  // Update local messages khi data thay đổi
  useEffect(() => {
    if (messagesData?.data) {
      // Handle both PaginatedResponse and direct array
      const results = messagesData.data.results || messagesData.data;
      if (Array.isArray(results)) {
        if (page === 0) {
          setMessages(results);
        } else {
          // Append older messages (pagination)
          setMessages((prev) => [...results, ...prev]);
        }
      }
    }
  }, [messagesData, page]);

    // Handle real-time messages từ WebSocket
    const handleNewMessage = useCallback(
        (message: MessageResponse) => {
            setMessages((prev) => {
                // Check if message already exists (prevent duplicates)
                const exists = prev.some((m) => m.id === message.id);
                if (exists) return prev;

                // Add new message to the end
                return [...prev, message];
            });

            // Scroll to bottom
            scrollToBottom();

            // Auto mark as read if message from others
            if (
                autoMarkAsRead &&
                currentUserId &&
                message.senderId !== currentUserId
            ) {
                setTimeout(() => {
                    markAsReadMutation.mutate({
                        conversationId: message.conversationId,
                        messageIds: [message.id],
                    });
                }, 1000);
            }

            // Invalidate conversations query để update lastMessage
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        },
        [autoMarkAsRead, currentUserId, queryClient]
    );

    // Subscribe to real-time messages
    useConversationMessages(conversationId, handleNewMessage, !!conversationId);

    // Mutation: Send message
    const sendMessageMutation = useMutation({
        mutationFn: (data: SendMessageRequest) => chatApi.sendMessage(data),
        onSuccess: (response) => {
            console.log('✅ Message sent successfully:', response);
            // Message will be added via WebSocket subscription
            scrollToBottom();
        },
        onError: (error) => {
            console.error('❌ Failed to send message:', error);
        },
    });

    // Mutation: Mark as read
    const markAsReadMutation = useMutation({
        mutationFn: (data: MarkAsReadRequest) => chatApi.markMessagesAsRead(data),
        onSuccess: () => {
            console.log('✅ Messages marked as read');
            // Update messages locally
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => {
            console.error('❌ Failed to mark as read:', error);
        },
    });

    // Mutation: Delete message
    const deleteMessageMutation = useMutation({
        mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
        onSuccess: (_, messageId) => {
            console.log('✅ Message deleted:', messageId);
            // Remove message from local state
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
        },
        onError: (error) => {
            console.error('❌ Failed to delete message:', error);
        },
    });

    // Mutation: Pin/Unpin message
    const togglePinMutation = useMutation({
        mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
            chatApi.togglePinMessage(messageId, pinned),
        onSuccess: (response) => {
            console.log('✅ Message pin status updated:', response);
            // Update message in local state
            setMessages((prev) =>
                prev.map((m) => (m.id === response.data.id ? response.data : m))
            );
        },
        onError: (error) => {
            console.error('❌ Failed to update pin status:', error);
        },
    });

    // Helper: Load more messages (pagination)
    const loadMoreMessages = useCallback(() => {
        if (messagesData?.data?.hasNext) {
            setPage((prev) => prev + 1);
        }
    }, [messagesData]);

    // Helper: Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Helper: Send message
    const sendMessage = useCallback(
        (content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
            if (!conversationId || !content.trim()) return;

            sendMessageMutation.mutate({
                conversationId,
                content: content.trim(),
                type,
            });
        },
        [conversationId, sendMessageMutation]
    );

    // Helper: Mark messages as read
    const markAsRead = useCallback(
        (messageIds: string[]) => {
            if (!conversationId || messageIds.length === 0) return;

            markAsReadMutation.mutate({
                conversationId,
                messageIds,
            });
        },
        [conversationId, markAsReadMutation]
    );

    // Helper: Delete message
    const deleteMessage = useCallback(
        (messageId: string) => {
            deleteMessageMutation.mutate(messageId);
        },
        [deleteMessageMutation]
    );

    // Helper: Toggle pin message
    const togglePin = useCallback(
        (messageId: string, pinned: boolean) => {
            togglePinMutation.mutate({ messageId, pinned });
        },
        [togglePinMutation]
    );

    // Helper: Refresh messages
    const refresh = useCallback(() => {
        setPage(0);
        refetch();
    }, [refetch]);

    return {
        // Data
        messages,
        isLoading,
        error,
        hasMore: messagesData?.data?.hasNext || false,
        totalPages: messagesData?.data?.totalPages || 0,
        currentPage: page,

        // Actions
        sendMessage,
        markAsRead,
        deleteMessage,
        togglePin,
        loadMoreMessages,
        scrollToBottom,
        refresh,

        // Mutation states
        isSending: sendMessageMutation.isPending,
        isDeleting: deleteMessageMutation.isPending,

        // Refs
        messagesEndRef,
    };
};

/**
 * Hook để quản lý typing users
 */
export const useTypingUsers = (currentUserId: string) => {
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const handleTypingStatus = useCallback(
        (status: { userId: string; userName: string; isTyping: boolean }) => {
            // Ignore own typing status
            if (status.userId === currentUserId) return;

            setTypingUsers((prev) => {
                const newSet = new Set(prev);

                if (status.isTyping) {
                    newSet.add(status.userName);

                    // Clear existing timeout
                    const existingTimeout = timeoutRefs.current.get(status.userId);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    // Auto remove after 3 seconds
                    const timeout = setTimeout(() => {
                        setTypingUsers((current) => {
                            const updated = new Set(current);
                            updated.delete(status.userName);
                            return updated;
                        });
                        timeoutRefs.current.delete(status.userId);
                    }, 3000);

                    timeoutRefs.current.set(status.userId, timeout);
                } else {
                    newSet.delete(status.userName);

                    // Clear timeout
                    const existingTimeout = timeoutRefs.current.get(status.userId);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                        timeoutRefs.current.delete(status.userId);
                    }
                }

                return newSet;
            });
        },
        [currentUserId]
    );

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
            timeoutRefs.current.clear();
        };
    }, []);

    return {
        typingUsers: Array.from(typingUsers),
        handleTypingStatus,
    };
};

/**
 * Hook để quản lý read receipts
 */
export const useReadReceipts = () => {
    const queryClient = useQueryClient();

    const handleReadReceipt = useCallback(
        (read: {
            conversationId: string;
            userId: string;
            messageIds: string[];
        }) => {
            // Update messages in query cache
            queryClient.setQueryData(
                ['chat', 'messages', read.conversationId],
                (oldData: any) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        data: {
                            ...oldData.data,
                            results: oldData.data.results.map((msg: IMessage) => {
                                if (read.messageIds.includes(msg.id)) {
                                    return {
                                        ...msg,
                                        readByUserIds: [
                                            ...(msg.readByUserIds || []),
                                            read.userId,
                                        ],
                                        readCount: (msg.readCount || 0) + 1,
                                    };
                                }
                                return msg;
                            }),
                        },
                    };
                }
            );
        },
        [queryClient]
    );

    return {
        handleReadReceipt,
    };
};

