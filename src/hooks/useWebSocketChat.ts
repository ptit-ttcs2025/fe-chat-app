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
 * Hook để subscribe conversation messages
 */
export const useConversationMessages = (
    conversationId: string | null,
    onMessage: (message: MessageResponse) => void,
    enabled: boolean = true
) => {
    const onMessageRef = useRef(onMessage);

    // Update ref when callback changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!conversationId || !enabled) return;

        console.log(`🔌 Subscribing to conversation messages: ${conversationId}`);

        // Subscribe with stable callback reference
        const unsubscribe = websocketService.subscribeToConversation(
            conversationId,
            (message) => onMessageRef.current(message)
        );

        return () => {
            console.log(`🔌 Unsubscribing from conversation messages: ${conversationId}`);
            unsubscribe();
        };
    }, [conversationId, enabled]);
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

    // Update ref when callback changes
    useEffect(() => {
        onTypingRef.current = onTyping;
    }, [onTyping]);

    useEffect(() => {
        if (!conversationId || !enabled) return;

        console.log(`⌨️ Subscribing to typing status: ${conversationId}`);

        const unsubscribe = websocketService.subscribeToTyping(
            conversationId,
            (status) => onTypingRef.current(status)
        );

        return () => {
            console.log(`⌨️ Unsubscribing from typing status: ${conversationId}`);
            unsubscribe();
        };
    }, [conversationId, enabled]);
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

    // Update ref when callback changes
    useEffect(() => {
        onReadRef.current = onRead;
    }, [onRead]);

    useEffect(() => {
        if (!conversationId || !enabled) return;

        console.log(`📖 Subscribing to read receipts: ${conversationId}`);

        const unsubscribe = websocketService.subscribeToReadReceipts(
            conversationId,
            (read) => onReadRef.current(read)
        );

        return () => {
            console.log(`📖 Unsubscribing from read receipts: ${conversationId}`);
            unsubscribe();
        };
    }, [conversationId, enabled]);
};

/**
 * Hook để subscribe user status
 */
export const useUserStatus = (
    onStatus: (status: UserStatus) => void,
    enabled: boolean = true
) => {
    const onStatusRef = useRef(onStatus);

    // Update ref when callback changes
    useEffect(() => {
        onStatusRef.current = onStatus;
    }, [onStatus]);

    useEffect(() => {
        if (!enabled) return;

        console.log('👤 Subscribing to user status');

        const unsubscribe = websocketService.subscribeToUserStatus(
            (status) => onStatusRef.current(status)
        );

        return () => {
            console.log('👤 Unsubscribing from user status');
            unsubscribe();
        };
    }, [enabled]);
};

/**
 * Hook để subscribe personal notifications
 */
export const usePersonalNotifications = (
    onNotification: (message: MessageResponse) => void,
    enabled: boolean = true
) => {
    const onNotificationRef = useRef(onNotification);

    // Update ref when callback changes
    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        if (!enabled) return;

        console.log('📬 Subscribing to personal notifications');

        const unsubscribe = websocketService.subscribeToPersonalNotifications(
            (message) => onNotificationRef.current(message)
        );

        return () => {
            console.log('📬 Unsubscribing from personal notifications');
            unsubscribe();
        };
    }, [enabled]);
};

/**
 * Hook để subscribe system messages
 */
export const useSystemMessages = (
    onMessage: (message: any) => void,
    enabled: boolean = true
) => {
    const onMessageRef = useRef(onMessage);

    // Update ref when callback changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!enabled) return;

        console.log('🔔 Subscribing to system messages');

        const unsubscribe = websocketService.subscribeToSystemMessages(
            (message) => onMessageRef.current(message)
        );

        return () => {
            console.log('🔔 Unsubscribing from system messages');
            unsubscribe();
        };
    }, [enabled]);
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

/**
 * Hook để check WebSocket connection status
 */
export const useWebSocketStatus = () => {
    const [isConnected, setIsConnected] = React.useState(
        websocketService.getConnectionStatus()
    );

    useEffect(() => {
        // Check connection status periodically
        const interval = setInterval(() => {
            const connected = websocketService.getConnectionStatus();
            setIsConnected(connected);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return isConnected;
};

