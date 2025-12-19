/**
 * WebSocketService - Refactored Facade Pattern
 */

import type { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import type { INotification } from '@/apis/notification/notification.type';
import type {
    MessageResponse,
    TypingStatus,
    MessageRead,
    UserStatus,
} from '@/apis/chat/chat.type';

// Import refactored managers
import { connectionManager } from './ConnectionManager';
import { subscriptionManager } from './SubscriptionManager';
import { messageHandler, MessageHandler } from './MessageHandler';
import { environment } from '@/environment';
import type {
    NotificationCallback,
    MessageCallback,
    TypingCallback,
    ReadCallback,
    UserStatusCallback,
    SystemMessageCallback,
} from './websocket.types';

class WebSocketService {
    private static instance: WebSocketService | null = null;

    // Notification-specific (not migrated to SubscriptionManager for backward compatibility)
    private notificationCallbacks: Set<NotificationCallback> = new Set();
    private notificationSubscription: StompSubscription | null = null;

    // ✅ NEW: Event emitter for ACK events
    private eventHandlers: Map<string, Set<Function>> = new Map();

    private constructor() {
        // Setup connection callbacks
        connectionManager.setCallbacks({
            onConnect: (client) => this.handleConnect(client),
            onDisconnect: () => this.handleDisconnect(),
        });
    }


    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    /**
     * Connect to WebSocket
     * Delegates to ConnectionManager
     */
    connect(wsUrl: string, token: string, userId: string): void {
        connectionManager.connect({
            wsUrl,
            token,
            userId,
            maxReconnectAttempts: environment.websocket.maxReconnectAttempts,
            heartbeatIncoming: environment.websocket.heartbeatInterval,
            heartbeatOutgoing: environment.websocket.heartbeatInterval,
            timeout: environment.websocket.connectionTimeout,
        });
    }

    /**
     * Handle connection established
     * Called by ConnectionManager
     */
    private handleConnect(client: Client): void {
        // Update SubscriptionManager with new client
        subscriptionManager.setClient(client);

        // Subscribe to personal notifications
        const userId = connectionManager.getCurrentUserId();
        if (userId) {
            const notificationTopic = `/topic/users/${userId}/notifications`;
            this.notificationSubscription = client.subscribe(
                notificationTopic,
                (message: IMessage) => {
                    const result = messageHandler.parseMessage<INotification>(message);
                    if (result.success && result.data) {
                        messageHandler.notifyCallbacks(
                            this.notificationCallbacks,
                            result.data,
                            'notification'
                        );
                    }
                }
            );
        }

        // ✅ NEW: Subscribe to ACK channel
        this.subscribeToAckChannel();

        // ✅ NEW: Subscribe to Error channel
        this.subscribeToErrorChannel();

        // Re-subscribe to all previous subscriptions
        subscriptionManager.resubscribeAll();
    }

    /**
     * Handle disconnection
     * Called by ConnectionManager
     */
    private handleDisconnect(): void {
        // Cleanup notification subscription
        if (this.notificationSubscription) {
            this.notificationSubscription.unsubscribe();
            this.notificationSubscription = null;
        }
    }

    /**
     * Disconnect WebSocket
     * Delegates to ConnectionManager
     */
    disconnect(): void {
        // Cleanup subscriptions first
        subscriptionManager.cleanup();

        // Cleanup notifications
        if (this.notificationSubscription) {
            this.notificationSubscription.unsubscribe();
            this.notificationSubscription = null;
        }

        // Disconnect
        connectionManager.disconnect();
    }


    // ===========================
    // PUBLIC API METHODS
    // ===========================

    /**
     * Subscribe to notification events
     */
    onNotification(callback: NotificationCallback): () => void {
        this.notificationCallbacks.add(callback);
        
        return () => {
            this.notificationCallbacks.delete(callback);
        };
    }

    /**
     * Send message (generic)
     */
    send(destination: string, body: any): void {
        const client = connectionManager.getClient();
        if (client && connectionManager.isConnected()) {
            client.publish({
                destination,
                body: JSON.stringify(body),
            });
        } else {
            console.warn('Cannot send message: WebSocket not connected');
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): boolean {
        return connectionManager.isConnected();
    }

    /**
     * Get current user ID
     */
    getCurrentUserId(): string | null {
        return connectionManager.getCurrentUserId();
    }

    /**
     * Get connection quality metrics
     */
    getConnectionQuality(): { status: string; transport: string; quality: string } {
        return connectionManager.getConnectionQuality();
    }

    /**
     * Check if using fallback transport
     */
    isUsingFallbackTransport(): boolean {
        return connectionManager.isUsingFallbackTransport();
    }

    /**
     * Get current transport type
     */
    getCurrentTransport(): string {
        return connectionManager.getCurrentTransport();
    }


    // ===========================
    // CHAT WEBSOCKET METHODS
    // ===========================

    /**
     * Subscribe to conversation messages
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToConversation(
        conversationId: string,
        callback: MessageCallback
    ): () => void {
        return subscriptionManager.subscribe<MessageResponse>(
            `conversation-${conversationId}`,
            `/topic/conversations/${conversationId}`,
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * Subscribe to typing status
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToTyping(
        conversationId: string,
        callback: TypingCallback
    ): () => void {
        return subscriptionManager.subscribe<TypingStatus>(
            `typing-${conversationId}`,
            `/topic/conversations/${conversationId}/typing`,
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * Subscribe to read receipts
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToReadReceipts(
        conversationId: string,
        callback: ReadCallback
    ): () => void {
        return subscriptionManager.subscribe<MessageRead>(
            `read-${conversationId}`,
            `/topic/conversations/${conversationId}/read`,
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * Subscribe to user status
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToUserStatus(callback: UserStatusCallback): () => void {
        return subscriptionManager.subscribe<UserStatus>(
            'user-status',
            '/topic/user-status',
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * Subscribe to personal notifications (messages when offline)
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToPersonalNotifications(callback: MessageCallback): () => void {
        return subscriptionManager.subscribe<MessageResponse>(
            'personal-notifications',
            '/user/queue/messages',
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * Subscribe to system messages
     * Uses SubscriptionManager for generic subscription handling
     */
    subscribeToSystemMessages(callback: SystemMessageCallback): () => void {
        return subscriptionManager.subscribe<any>(
            'system-messages',
            '/user/queue/system',
            callback,
            MessageHandler.jsonParser
        );
    }

    /**
     * ✅ NEW: Subscribe to ACK channel
     */
    private subscribeToAckChannel(): void {
        subscriptionManager.subscribe<any>(
            'message-ack',
            '/user/queue/ack',
            (ack) => {
                this.emit('message-ack', ack);
            },
            MessageHandler.jsonParser
        );
    }

    /**
     * ✅ NEW: Subscribe to Error channel
     */
    private subscribeToErrorChannel(): void {
        subscriptionManager.subscribe<any>(
            'message-error',
            '/user/queue/errors',
            (error) => {
                console.error('❌ [WebSocket] Error received:', error);
                this.emit('message-error', error);
            },
            MessageHandler.jsonParser
        );
    }

    /**
     * ✅ NEW: Event emitter
     */
    on(event: string, handler: Function): () => void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);

        // Return unsubscribe function
        return () => {
            this.eventHandlers.get(event)?.delete(handler);
        };
    }

    /**
     * ✅ NEW: Emit event
     */
    private emit(event: string, data: any): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    /**
     * Send message via WebSocket
     * ✅ UPDATED: Removed callbacks - use event emitter instead
     * ✅ UPDATED: Add Authorization header
     */
    sendMessage(message: {
        conversationId: string;
        content: string;
        type?: string;
        repliedToMessageId?: string;
        attachmentId?: string;
    }): void {
        const client = connectionManager.getClient();
        if (!client?.connected) {
            console.error('❌ WebSocket not connected. Cannot send message.');
            this.emit('message-error', { error: 'WebSocket not connected' });
            return;
        }

        try {
            client.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(message),
            });
        } catch (error: any) {
            console.error('❌ WebSocket send error:', error);
            this.emit('message-error', { error: error.message || 'Failed to send message' });
        }
    }

    /**
     * Send typing status
     */
    sendTypingStatus(
        conversationId: string,
        isTyping: boolean,
        userName: string
    ): void {
        const client = connectionManager.getClient();
        if (!client?.connected) {
            console.warn('WebSocket not connected. Cannot send typing status.');
            return;
        }

        client.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({
                conversationId,
                userName,
                isTyping,
                timestamp: new Date().toISOString(),
            }),
        });
    }

    /**
     * Mark messages as read
     */
    markAsRead(conversationId: string, messageIds: string[]): void {
        const client = connectionManager.getClient();
        if (!client?.connected) {
            console.warn('WebSocket not connected. Cannot mark as read.');
            return;
        }

        client.publish({
            destination: '/app/chat.read',
            body: JSON.stringify({
                conversationId,
                messageIds,
                timestamp: new Date().toISOString(),
            }),
        });
    }
}

export default WebSocketService.getInstance();
