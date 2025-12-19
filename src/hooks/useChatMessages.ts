/**
 * Custom Hook for Chat Messages Management
 * Quản lý messages với REST API và WebSocket realtime
 * 
 * ✅ UPDATED: Sử dụng Cursor-Based Pagination cho performance tối ưu
 * - Initial load: Lấy N tin nhắn mới nhất
 * - Scroll up: Load older messages với beforeMessageId
 * - Performance: ~30ms consistent (vs 500ms+ với offset pagination)
 * 
 * ✅ NEW: Explicit ACK với Simple Pending Tracker
 * - Backend gửi ACK qua /user/queue/ack
 * - Simple Map để track pending messages
 * - Timeout detection (10s) → REST API fallback
 * - No complex queue, no throttling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/apis/chat/chat.api';
import type {
    IMessage,
    SendMessageRequest,
    MessageResponse,
    MarkAsReadRequest,
    CursorInfo,
} from '@/apis/chat/chat.type';
import { useConversationMessages } from './useWebSocketChat';
import { UNREAD_KEYS } from './useUnreadMessages';
import websocketService from '@/core/services/websocket.service';
import { environment } from '@/environment';

interface UseChatMessagesOptions {
    conversationId: string | null;
    pageSize?: number;
    autoMarkAsRead?: boolean;
    currentUserId?: string;
}

// Type để phân biệt response từ 2 loại API
type MessagesResponse = 
    | { type: 'cursor'; data: { messages: IMessage[]; cursor: CursorInfo } }
    | { type: 'pagination'; data: { results: IMessage[]; meta: { pageNumber: number; pageSize: number; totalPages: number; totalElements: number } } };

export const useChatMessages = ({
    conversationId,
    pageSize = 50,
    autoMarkAsRead = true,
    currentUserId,
}: UseChatMessagesOptions) => {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [cursor, setCursor] = useState<CursorInfo | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(0); // Dùng cho fallback pagination
    const [apiType, setApiType] = useState<'cursor' | 'pagination'>('cursor'); // Track API type being used
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasMarkedAsReadRef = useRef(false); // Track đã mark as read chưa

    // ✅ NEW: Simple Pending Tracker
    // Map: tempId -> { timeoutId, content, conversationId }
    const pendingMessages = useRef<Map<string, { timeoutId: NodeJS.Timeout; content: string; conversationId: string }>>(new Map());

    // Query key
    const queryKey = ['chat', 'messages', conversationId];

    // Reset states khi conversation thay đổi
    useEffect(() => {
        setMessages([]);
        setCursor(null);
        setCurrentPage(0);
        // Reset apiType để thử cursor API mới cho mỗi conversation
        setApiType('cursor');
        // Reset mark as read flag
        hasMarkedAsReadRef.current = false;
    }, [conversationId]);

    // Fetch messages từ API - LUÔN thử cursor API trước
    const {
        data: messagesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: [...queryKey, apiType],
        queryFn: async (): Promise<MessagesResponse> => {
            if (!conversationId) {
                throw new Error('No conversation selected');
            }
            
            // Nếu đang dùng pagination API (đã fallback trước đó)
            if (apiType === 'pagination') {
                const response = await chatApi.getMessages(conversationId, 0, pageSize);
                return { type: 'pagination', data: response };
            }
            
            // Thử cursor API trước
            try {
                const response = await chatApi.getMessagesCursor(conversationId, pageSize);
                
                // Check nếu response có messages field (cursor API format)
                if (response && 'messages' in response) {
                    return { type: 'cursor', data: response };
                }
                
                // Nếu response không có messages field
                throw new Error('Invalid cursor API response format');
            } catch (error: any) {
                console.error('❌ Cursor API error:', error);
                
                // Set apiType để lần sau dùng pagination
                setApiType('pagination');
                
                // Fallback về pagination API
                const response = await chatApi.getMessages(conversationId, 0, pageSize);
                return { type: 'pagination', data: response };
            }
        },
        enabled: !!conversationId,
        staleTime: 30000, // 30 seconds
        retry: false, // Không retry, để fallback tự xử lý
    });

  // Update local messages khi data thay đổi
    useEffect(() => {
        if (!messagesData) return;
    
        if (messagesData.type === 'cursor') {
            // Cursor API response
            const results = messagesData.data.messages || [];
            if (Array.isArray(results)) {
                // Reverse để có thứ tự cũ → mới (ASC) cho hiển thị
                const orderedResults = [...results].reverse();
                setMessages(orderedResults);
                setCursor(messagesData.data.cursor);
            }
        } else if (messagesData.type === 'pagination') {
            // Pagination API response
            const results = messagesData.data.results || [];
            if (Array.isArray(results)) {
                // Reverse để có thứ tự cũ → mới (ASC)
                const orderedResults = [...results].reverse();
                setMessages(orderedResults);
        
                // Tạo cursor info từ pagination meta
                const meta = messagesData.data.meta;
                if (meta) {
                    setCursor({
                        hasMore: meta.pageNumber < meta.totalPages - 1,
                        hasNewer: false,
                        oldestMessageId: orderedResults[0]?.id || null,
                        newestMessageId: orderedResults[orderedResults.length - 1]?.id || null,
                        count: results.length,
                        pageSize: meta.pageSize,
                    });
                }
            }
        }
    }, [messagesData]);

    // Helper: Scroll to bottom - định nghĩa trước để tránh lỗi reference
    const scrollToBottom = useCallback((instant: boolean = false) => {
        requestAnimationFrame(() => {
            const chatBody = document.querySelector('#middle .chat-body.chat-page-group') as HTMLElement;
            if (!chatBody) return;
            
            const scrollHeight = chatBody.scrollHeight;
            const clientHeight = chatBody.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            
            if (instant) {
                chatBody.scrollTop = Math.max(0, maxScroll);
            } else {
                chatBody.scrollTo({
                    top: Math.max(0, maxScroll),
                    behavior: 'smooth'
                });
            }
        });
        
        if (messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ 
                    behavior: instant ? 'instant' : 'smooth',
                    block: 'end',
                    inline: 'nearest'
                });
            }, 50);
        }
    }, []);

    // ✅ NEW: Subscribe to ACK events  
    // ACK chỉ dùng để log, actual confirmation là từ broadcast
    useEffect(() => {
        const unsubscribeAck = websocketService.on('message-ack', () => {
            // ACK confirms backend received message
            // Actual delivery confirmation comes from broadcast
        });

        const unsubscribeError = websocketService.on('message-error', (error: any) => {
            console.error('❌ [useChatMessages] Error received:', error);
            // Mark all pending messages as failed
            pendingMessages.current.forEach((pending, tempId) => {
                setMessages(prev =>
                    prev.map(m => m.id === tempId ? { ...m, status: 'failed', error: 'Gửi thất bại' } : m)
                );
                clearTimeout(pending.timeoutId);
            });
            pendingMessages.current.clear();
        });

        return () => {
            unsubscribeAck();
            unsubscribeError();
        };
    }, [conversationId]);

    // Handle real-time messages từ WebSocket
    const handleNewMessage = useCallback(
        (message: MessageResponse) => {
            // Check if this is our own message (implicit ACK via broadcast)
            if (message.senderId === currentUserId) {
                // Tìm pending message matching với broadcast message
                let foundTempId: string | null = null;
                
                pendingMessages.current.forEach((pending, tempId) => {
                    if (pending.content === message.content && 
                        pending.conversationId === message.conversationId) {
                        foundTempId = tempId;
                    }
                });
                
                if (foundTempId) {
                    // Update status: sending → delivered
                    // Replace optimistic message with real one
                    setMessages(prev =>
                        prev.map(m => m.id === foundTempId ? { ...message, status: 'delivered' } : m)
                    );
                    
                    // Clear pending
                    const pending = pendingMessages.current.get(foundTempId);
                    if (pending) {
                        clearTimeout(pending.timeoutId);
                        pendingMessages.current.delete(foundTempId);
                    }
                } else {
                    // Message không match với pending nào, có thể từ device khác
                    setMessages(prev => {
                        const exists = prev.find(m => m.id === message.id);
                        if (exists) return prev;
                        return [...prev, { ...message, status: 'delivered' }];
                    });
                }
                
                return;
            }

            setMessages((prev) => {
                // 1. Check duplicate bằng real ID
                const existingIndex = prev.findIndex((m) => m.id === message.id);
                if (existingIndex !== -1) {
                    return prev;
                }

                // 2. ✅ FIX: Tìm và replace optimistic message của chính mình
                // CHỈ áp dụng cho message từ currentUser để tránh replace nhầm
                if (message.senderId === currentUserId) {
                    // Tìm optimistic message có content GIỐNG NHAU
                    // Dùng timestamp để match chính xác hơn (trong vòng 5 giây)
                    const messageTime = new Date(message.createdAt).getTime();
                    
                    const optimisticMatchIndex = prev.findIndex(m => {
                        if (!m.id.startsWith('optimistic-')) return false;
                        if (m.content !== message.content) return false;
                        
                        // Check timestamp trong vòng 5 giây
                        const optimisticTime = new Date(m.createdAt).getTime();
                        const timeDiff = Math.abs(messageTime - optimisticTime);
                        return timeDiff < 5000; // 5 seconds tolerance
                    });

                    if (optimisticMatchIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[optimisticMatchIndex] = message;
                        return newMessages;
                    }
                }

                // 3. Add new message (from others or no optimistic match)
                return [...prev, message];
            });

            // ✅ FIX: XÓA scrollToBottom() - để ChatBody tự động scroll qua useEffect
            // Tránh conflict giữa 2 scroll mechanisms

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

    // ✅ NEW: Send message với pending tracker
    const sendMessageMutation = useMutation({
        mutationFn: async (data: SendMessageRequest) => {
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Optimistic update UI
            const optimisticMessage: IMessage = {
                id: tempId,
                conversationId: data.conversationId,
                content: data.content,
                senderId: currentUserId || '',
                senderName: 'Bạn',
                type: data.type || 'TEXT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isDeleted: false,
                readCount: 0,
                readByUserIds: [],
                pinned: false,
                status: 'sending', // Status: sending → sent (ACK) → delivered (broadcast)
                attachment: undefined,
            };

            setMessages((prev) => [...prev, optimisticMessage]);
            scrollToBottom(true);

            // Check if WebSocket is connected
            if (!websocketService.getConnectionStatus()) {
                console.warn('⚠️ WebSocket offline, using REST API');
                // Fallback to REST API immediately
                const response = await chatApi.sendMessage(data);
                
                // Replace optimistic message with real one
                setMessages((prev) =>
                    prev.map(m => m.id === tempId ? { ...response.data, status: 'delivered' } : m)
                );
                
                return response.data;
            }

            // Send via WebSocket
            websocketService.sendMessage({
                conversationId: data.conversationId,
                content: data.content,
                type: data.type,
                repliedToMessageId: data.repliedToMessageId,
                attachmentId: data.attachmentId,
            });

            // Track pending with timeout
            const timeoutId = setTimeout(async () => {
                console.warn(`⏱️ [useChatMessages] Message timeout: ${tempId}`);
                
                // Fallback to REST API
                try {
                    const response = await chatApi.sendMessage(data);
                    
                    // Replace optimistic message
                    setMessages((prev) =>
                        prev.map(m => m.id === tempId ? { ...response.data, status: 'delivered' } : m)
                    );
                    
                    pendingMessages.current.delete(tempId);
                } catch (error) {
                    console.error('❌ REST API fallback failed:', error);
                    
                    // Mark as failed
                    setMessages((prev) =>
                        prev.map(m => m.id === tempId ? { ...m, status: 'failed', error: 'Gửi tin nhắn thất bại' } : m)
                    );
                }
            }, environment.websocket.ackTimeout || 10000);

            pendingMessages.current.set(tempId, { 
                timeoutId, 
                content: data.content,
                conversationId: data.conversationId 
            });

            return { id: tempId } as any;
        },
        onError: (error) => {
            console.error('❌ Failed to send message:', error);
        },
    });

    // Mutation: Mark as read
    const markAsReadMutation = useMutation({
        mutationFn: (data: MarkAsReadRequest) => chatApi.markMessagesAsRead(data),
        onSuccess: (_, variables) => {
            // Update messages locally
            queryClient.invalidateQueries({ queryKey });
            
            // ✅ Invalidate unread queries theo UNREAD_MESSAGES_GUIDE.md
            queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.summary() });
            queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.totalCount() });
            queryClient.invalidateQueries({ queryKey: UNREAD_KEYS.byConversation(variables.conversationId) });
            
            // Update conversations list để refresh unreadCount
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        },
        onError: (error) => {
            console.error('❌ Failed to mark as read:', error);
        },
    });

    // Mutation: Delete message
    const deleteMessageMutation = useMutation({
        mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
        onSuccess: (_, messageId) => {
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
            // Update message in local state - chỉ update pinned status
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.id === response.data?.id) {
                        return {
                            ...m,
                            pinned: response.data.pinned ?? !m.pinned,
                        };
                    }
                    return m;
                })
            );
            
            // Invalidate query để refresh
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => {
            console.error('❌ Failed to update pin status:', error);
        },
    });

    // ✅ Auto mark as read khi VÀO conversation (theo UNREAD_MESSAGES_GUIDE.md section 5.5)
    useEffect(() => {
        if (
            autoMarkAsRead &&
            conversationId &&
            currentUserId &&
            messages.length > 0 &&
            !isLoading &&
            !hasMarkedAsReadRef.current
        ) {
            // Lọc tin nhắn chưa đọc (tin nhắn của người khác)
            const unreadMessageIds = messages
                .filter((msg) => msg.senderId !== currentUserId)
                .map((msg) => msg.id);

            if (unreadMessageIds.length > 0) {
                // Delay 500ms để đảm bảo user đã "thấy" messages
                const timer = setTimeout(() => {
                    markAsReadMutation.mutate({
                        conversationId,
                        messageIds: unreadMessageIds,
                    });
                    hasMarkedAsReadRef.current = true;
                }, 500);

                return () => clearTimeout(timer);
            } else {
                // Không có tin nhắn chưa đọc, đánh dấu đã check
                hasMarkedAsReadRef.current = true;
            }
        }
    }, [conversationId, messages, isLoading, autoMarkAsRead, currentUserId, markAsReadMutation]);

    // Helper: Load more messages (supports both cursor and pagination APIs)
    const loadMoreMessages = useCallback(async () => {
        if (!conversationId || !cursor?.hasMore || isLoadingMore) {
            return;
        }
        
        const chatBody = document.querySelector('#middle .chat-body.chat-page-group') as HTMLElement;
        if (!chatBody) {
            return;
        }

        setIsLoadingMore(true);
        
        // Lưu vị trí tin nhắn đầu tiên hiện tại (tin nhắn cũ nhất đang hiển thị)
        const firstMessageElement = chatBody.querySelector('.chats, .chats-right') as HTMLElement;
        const firstMessageOffsetTop = firstMessageElement?.offsetTop || 0;
        const currentScrollTop = chatBody.scrollTop;

        try {
            let olderMessages: IMessage[] = [];
            let newCursor: CursorInfo | null = null;

                if (apiType === 'pagination') {
                // Fallback: Sử dụng pagination API
                const nextPage = currentPage + 1;
                
                const response = await chatApi.getMessages(conversationId, nextPage, pageSize);
                const results = response.results || [];
                
                if (Array.isArray(results) && results.length > 0) {
                    olderMessages = [...results].reverse();
                    setCurrentPage(nextPage);
                    
                    // Update cursor from pagination meta
                    const meta = response.meta;
                    if (meta) {
                        newCursor = {
                            hasMore: meta.pageNumber < meta.totalPages - 1,
                            hasNewer: false,
                            oldestMessageId: olderMessages[0]?.id || null,
                            newestMessageId: olderMessages[olderMessages.length - 1]?.id || null,
                            count: results.length,
                            pageSize: meta.pageSize,
                        };
                    }
                }
            } else {
                // Cursor API
                if (!cursor?.oldestMessageId) {
                    setIsLoadingMore(false);
                    return;
                }
                
                const response = await chatApi.getMessagesCursor(
                    conversationId,
                    pageSize,
                    cursor.oldestMessageId // beforeMessageId - load older messages
                );

                if (response?.messages && Array.isArray(response.messages)) {
                    olderMessages = [...response.messages].reverse();
                    newCursor = response.cursor;
                }
            }

            if (olderMessages.length > 0) {
                // Prepend older messages to the beginning
                setMessages((prev) => [...olderMessages, ...prev]);
                if (newCursor) {
                    setCursor(newCursor);
                }

                // Maintain scroll position - đợi React render xong rồi restore
                // QUAN TRỌNG: Giữ isLoadingMore = true cho đến khi scroll được restore
                // để tránh auto-scroll effect trong ChatBody chạy
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Tìm lại element tin nhắn đầu tiên CŨ (giờ nó không còn là đầu tiên nữa)
                            // Sau khi thêm olderMessages, firstMessage sẽ ở vị trí index = olderMessages.length
                            const allMessages = chatBody.querySelectorAll('.chats, .chats-right');
                            const newFirstOldMessageIndex = olderMessages.length;
                            const newFirstOldMessage = allMessages[newFirstOldMessageIndex] as HTMLElement;
                            
                            if (newFirstOldMessage) {
                                // Scroll đến vị trí tin nhắn cũ với offset như trước
                                const newOffsetTop = newFirstOldMessage.offsetTop;
                                const offsetDiff = currentScrollTop - firstMessageOffsetTop;
                                chatBody.scrollTop = newOffsetTop + offsetDiff;
                            } else {
                                // Fallback: scroll đến vị trí tương đối
                                const newScrollHeight = chatBody.scrollHeight;
                                const heightAdded = newScrollHeight - (chatBody.scrollHeight || 0);
                                chatBody.scrollTop = currentScrollTop + heightAdded;
                            }
                            resolve();
                        });
                    });
                });
            }
        } catch (error) {
            console.error('❌ Error loading more messages:', error);
        } finally {
            // Đợi thêm 1 frame nữa để đảm bảo scroll đã ổn định
            requestAnimationFrame(() => {
                setIsLoadingMore(false);
            });
        }
    }, [conversationId, cursor, pageSize, isLoadingMore, apiType, currentPage]);

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
        setCursor(null);
        setMessages([]);
        setCurrentPage(0);
        refetch();
    }, [refetch]);

    return {
        // Data
        messages,
        isLoading,
        error,
        hasMore: cursor?.hasMore ?? false,
        cursor,
        isLoadingMore,

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

