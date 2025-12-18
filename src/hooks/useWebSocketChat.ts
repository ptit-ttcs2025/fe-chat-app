/**
 * Custom Hooks for WebSocket Chat
 * Quản lý WebSocket connections và subscriptions cho chat
 */

import React, { useEffect, useCallback, useRef } from 'react';
import websocketService from '@/core/services/websocket.service';
import type {
    MessageResponse,
    TypingStatus,
    MessageRead,
    UserStatus,
} from '@/apis/chat/chat.type';

/**
 * Hook để check WebSocket connection status
 * ✅ Optimized: CHỈ update state khi status thực sự thay đổi
 */
export const useWebSocketStatus = () => {
    const [isConnected, setIsConnected] = React.useState(
        websocketService.getConnectionStatus()
    );

    useEffect(() => {
        // Check connection status periodically
        const interval = setInterval(() => {
            const connected = websocketService.getConnectionStatus();
            // CHỈ update state khi có thay đổi → tránh re-render không cần thiết
            setIsConnected(prev => {
                if (prev !== connected) {
                    // Chỉ log khi status thay đổi (quan trọng)
                    return connected;
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []); // ✅ Empty deps - không phụ thuộc vào isConnected

    return isConnected;
};

/**
 * Hook để subscribe conversation messages
 */
export const useConversationMessages = (
    conversationId: string | null,
    onMessage: (message: MessageResponse) => void,
    enabled: boolean = true
) => {
    const onMessageRef = useRef(onMessage);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!conversationId || !enabled || !isConnected) {
            return;
        }

        // Subscribe with stable callback reference
        const unsubscribe = websocketService.subscribeToConversation(
            conversationId,
            (message) => {
                onMessageRef.current(message);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [conversationId, enabled, isConnected]);
};

/**
 * Hook để subscribe typing status
 */
export const useTypingStatus = (
    conversationId: string | null,
    onTyping: (status: TypingStatus) => void,
    enabled: boolean = true
) => {
    const onTypingRef = useRef(onTyping);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onTypingRef.current = onTyping;
    }, [onTyping]);

    useEffect(() => {
        if (!conversationId || !enabled || !isConnected) return;

        const unsubscribe = websocketService.subscribeToTyping(
            conversationId,
            (status) => onTypingRef.current(status)
        );

        return () => {
            unsubscribe();
        };
    }, [conversationId, enabled, isConnected]);
};

/**
 * Hook để subscribe read receipts
 */
export const useReadReceipts = (
    conversationId: string | null,
    onRead: (read: MessageRead) => void,
    enabled: boolean = true
) => {
    const onReadRef = useRef(onRead);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onReadRef.current = onRead;
    }, [onRead]);

    useEffect(() => {
        if (!conversationId || !enabled || !isConnected) return;

        const unsubscribe = websocketService.subscribeToReadReceipts(
            conversationId,
            (read) => onReadRef.current(read)
        );

        return () => {
            unsubscribe();
        };
    }, [conversationId, enabled, isConnected]);
};

/**
 * Hook để subscribe user status
 */
export const useUserStatus = (
    onStatus: (status: UserStatus) => void,
    enabled: boolean = true
) => {
    const onStatusRef = useRef(onStatus);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onStatusRef.current = onStatus;
    }, [onStatus]);

    useEffect(() => {
        if (!enabled || !isConnected) return;

        const unsubscribe = websocketService.subscribeToUserStatus(
            (status) => onStatusRef.current(status)
        );

        return () => {
            unsubscribe();
        };
    }, [enabled, isConnected]);
};

/**
 * Hook để subscribe personal notifications
 */
export const usePersonalNotifications = (
    onNotification: (message: MessageResponse) => void,
    enabled: boolean = true
) => {
    const onNotificationRef = useRef(onNotification);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        if (!enabled || !isConnected) return;

        const unsubscribe = websocketService.subscribeToPersonalNotifications(
            (message) => onNotificationRef.current(message)
        );

        return () => {
            unsubscribe();
        };
    }, [enabled, isConnected]);
};

/**
 * Hook để subscribe system messages
 */
export const useSystemMessages = (
    onMessage: (message: any) => void,
    enabled: boolean = true
) => {
    const onMessageRef = useRef(onMessage);
    const isConnected = useWebSocketStatus();

    // Update ref when callback changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!enabled || !isConnected) return;

        const unsubscribe = websocketService.subscribeToSystemMessages(
            (message) => onMessageRef.current(message)
        );

        return () => {
            unsubscribe();
        };
    }, [enabled, isConnected]);
};

/**
 * Hook tổng hợp để send messages và typing status
 */
export const useChatActions = () => {
    const sendMessage = useCallback(
        (message: {
            conversationId: string;
            content: string;
            type?: string;
            repliedToMessageId?: string;
            attachmentId?: string;
        }) => {
            websocketService.sendMessage(message);
        },
        []
    );

    const sendTypingStatus = useCallback(
        (conversationId: string, isTyping: boolean, userName: string) => {
            websocketService.sendTypingStatus(conversationId, isTyping, userName);
        },
        []
    );

    const markAsRead = useCallback(
        (conversationId: string, messageIds: string[]) => {
            websocketService.markAsRead(conversationId, messageIds);
        },
        []
    );

    return {
        sendMessage,
        sendTypingStatus,
        markAsRead,
    };
};

/**
 * Hook để quản lý typing timeout
 */
export const useTypingTimeout = (
    conversationId: string | null,
    userName: string,
    timeout: number = 1000
) => {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { sendTypingStatus } = useChatActions();

    const startTyping = useCallback(() => {
        if (!conversationId) return;

        // Send typing status
        sendTypingStatus(conversationId, true, userName);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after timeout
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(conversationId, false, userName);
        }, timeout);
    }, [conversationId, userName, timeout, sendTypingStatus]);

    const stopTyping = useCallback(() => {
        if (!conversationId) return;

        // Clear timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        // Send stop typing status
        sendTypingStatus(conversationId, false, userName);
    }, [conversationId, userName, sendTypingStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        startTyping,
        stopTyping,
    };
};

