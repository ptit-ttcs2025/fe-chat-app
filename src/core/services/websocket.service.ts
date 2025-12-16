import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import type { INotification } from '@/apis/notification/notification.type';
import type {
    MessageResponse,
    TypingStatus,
    MessageRead,
    UserStatus,
} from '@/apis/chat/chat.type';

type NotificationCallback = (notification: INotification) => void;
type MessageCallback = (message: MessageResponse) => void;
type TypingCallback = (status: TypingStatus) => void;
type ReadCallback = (read: MessageRead) => void;
type UserStatusCallback = (status: UserStatus) => void;

class WebSocketService {
    private static instance: WebSocketService | null = null;
    private stompClient: Client | null = null;
    private isConnected: boolean = false;
    private notificationCallbacks: Set<NotificationCallback> = new Set();
    private subscription: StompSubscription | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 5000;
    private currentUserId: string | null = null;

    // Chat-related subscriptions and callbacks
    private chatSubscriptions: Map<string, StompSubscription> = new Map();
    private messageCallbacks: Map<string, Set<MessageCallback>> = new Map();
    private typingCallbacks: Map<string, Set<TypingCallback>> = new Map();
    private readCallbacks: Map<string, Set<ReadCallback>> = new Map();
    private userStatusCallbacks: Set<UserStatusCallback> = new Set();
    private personalNotificationCallbacks: Set<MessageCallback> = new Set();
    private systemMessageCallbacks: Set<(message: any) => void> = new Set();

    private constructor() {}

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    connect(baseUrl: string, token: string, userId: string): void {
        if (this.isConnected && this.currentUserId === userId) {
            console.log('WebSocket already connected for user:', userId);
            return;
        }

        // Disconnect previous connection if exists
        if (this.isConnected && this.currentUserId !== userId) {
            console.log('Switching user, disconnecting previous connection');
            this.disconnect();
        }

        this.currentUserId = userId;

        console.log('🔗 Connecting WebSocket...', { baseUrl, userId });

        // Create STOMP client
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/ws`) as any,
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },
            debug: (str) => {
                if (str.includes('ERROR') || str.includes('CONNECT') || str.includes('DISCONNECT')) {
                    console.log('🔧 STOMP:', str);
                }
            },
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                this.onConnected(frame);
            },
            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame);
                this.isConnected = false;
            },
            onWebSocketError: (event) => {
                console.error('❌ WebSocket error:', event);
                this.isConnected = false;
            },
            onDisconnect: () => {
                console.log('👋 WebSocket disconnected');
                this.isConnected = false;
                this.handleReconnect(baseUrl, token, userId);
            },
        });

        // Activate connection
        this.stompClient.activate();
    }

    private onConnected(frame: any): void {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ WebSocket connected for user:', this.currentUserId);
        console.log('📡 Connection frame:', frame);

        // Subscribe to personal notification topic
        if (this.stompClient && this.currentUserId) {
            const notificationTopic = `/topic/users/${this.currentUserId}/notifications`;
            console.log(`📡 Subscribing to: ${notificationTopic}`);

            this.subscription = this.stompClient.subscribe(
                notificationTopic,
                (message: IMessage) => {
                    this.handleIncomingNotification(message);
                }
            );
        }
    }

    private handleIncomingNotification(message: IMessage): void {
        try {
            const notification: INotification = JSON.parse(message.body);
            console.log('📩 Received notification:', notification);

            // Notify all registered callbacks
            this.notificationCallbacks.forEach(callback => {
                try {
                    callback(notification);
                } catch (error) {
                    console.error('Error in notification callback:', error);
                }
            });
        } catch (error) {
            console.error('Error parsing notification:', error);
        }
    }

    private handleReconnect(baseUrl: string, token: string, userId: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.connect(baseUrl, token, userId);
            }
        }, this.reconnectDelay);
    }

    disconnect(): void {
        console.log('Disconnecting WebSocket...');
        
        // Cleanup chat subscriptions first
        this.cleanupChatSubscriptions();

        // Unsubscribe notifications
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }

        // Deactivate STOMP client
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }

        this.isConnected = false;
        this.currentUserId = null;
        this.reconnectAttempts = 0;
        
        console.log('👋 WebSocket disconnected');
    }

    // Subscribe to notification events
    onNotification(callback: NotificationCallback): () => void {
        this.notificationCallbacks.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.notificationCallbacks.delete(callback);
        };
    }

    // Send message (if needed)
    send(destination: string, body: any): void {
        if (this.stompClient && this.isConnected) {
            this.stompClient.publish({
                destination,
                body: JSON.stringify(body),
            });
        } else {
            console.warn('Cannot send message: WebSocket not connected');
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    getCurrentUserId(): string | null {
        return this.currentUserId;
    }

    // ===========================
    // CHAT WEBSOCKET METHODS
    // ===========================

    /**
     * Subscribe to conversation messages
     */
    subscribeToConversation(
        conversationId: string,
        callback: MessageCallback
    ): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to conversation.');
            return () => { };
        }

        // Initialize callbacks set if not exists
        if (!this.messageCallbacks.has(conversationId)) {
            this.messageCallbacks.set(conversationId, new Set());
        }

        // Add callback
        this.messageCallbacks.get(conversationId)!.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = `conversation-${conversationId}`;
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                `/topic/conversations/${conversationId}`,
                (message: IMessage) => {
                    const data = JSON.parse(message.body) as MessageResponse;
                    console.log('📨 Received message:', data);

                    // Notify all callbacks for this conversation
                    this.messageCallbacks.get(conversationId)?.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in message callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log(`📡 Subscribed to conversation: ${conversationId}`);
        }

        // Return unsubscribe function
        return () => {
            this.messageCallbacks.get(conversationId)?.delete(callback);

            // If no more callbacks, unsubscribe
            if (this.messageCallbacks.get(conversationId)?.size === 0) {
                this.unsubscribeFromConversation(conversationId);
            }
        };
    }

    /**
     * Unsubscribe from conversation
     */
    private unsubscribeFromConversation(conversationId: string): void {
        const subscriptionKey = `conversation-${conversationId}`;
        const subscription = this.chatSubscriptions.get(subscriptionKey);

        if (subscription) {
            subscription.unsubscribe();
            this.chatSubscriptions.delete(subscriptionKey);
            this.messageCallbacks.delete(conversationId);
            console.log(`🔕 Unsubscribed from conversation: ${conversationId}`);
        }
    }

    /**
     * Subscribe to typing status
     */
    subscribeToTyping(
        conversationId: string,
        callback: TypingCallback
    ): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to typing.');
            return () => { };
        }

        // Initialize callbacks set if not exists
        if (!this.typingCallbacks.has(conversationId)) {
            this.typingCallbacks.set(conversationId, new Set());
        }

        // Add callback
        this.typingCallbacks.get(conversationId)!.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = `typing-${conversationId}`;
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                `/topic/conversations/${conversationId}/typing`,
                (message: IMessage) => {
                    const data = JSON.parse(message.body) as TypingStatus;
                    console.log('⌨️ Typing status:', data);

                    // Notify all callbacks
                    this.typingCallbacks.get(conversationId)?.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in typing callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log(`📡 Subscribed to typing: ${conversationId}`);
        }

        // Return unsubscribe function
        return () => {
            this.typingCallbacks.get(conversationId)?.delete(callback);

            // If no more callbacks, unsubscribe
            if (this.typingCallbacks.get(conversationId)?.size === 0) {
                this.unsubscribeFromTyping(conversationId);
            }
        };
    }

    /**
     * Unsubscribe from typing
     */
    private unsubscribeFromTyping(conversationId: string): void {
        const subscriptionKey = `typing-${conversationId}`;
        const subscription = this.chatSubscriptions.get(subscriptionKey);

        if (subscription) {
            subscription.unsubscribe();
            this.chatSubscriptions.delete(subscriptionKey);
            this.typingCallbacks.delete(conversationId);
            console.log(`🔕 Unsubscribed from typing: ${conversationId}`);
        }
    }

    /**
     * Subscribe to read receipts
     */
    subscribeToReadReceipts(
        conversationId: string,
        callback: ReadCallback
    ): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to read receipts.');
            return () => { };
        }

        // Initialize callbacks set if not exists
        if (!this.readCallbacks.has(conversationId)) {
            this.readCallbacks.set(conversationId, new Set());
        }

        // Add callback
        this.readCallbacks.get(conversationId)!.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = `read-${conversationId}`;
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                `/topic/conversations/${conversationId}/read`,
                (message: IMessage) => {
                    const data = JSON.parse(message.body) as MessageRead;
                    console.log('📖 Read receipt:', data);

                    // Notify all callbacks
                    this.readCallbacks.get(conversationId)?.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in read callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log(`📡 Subscribed to read receipts: ${conversationId}`);
        }

        // Return unsubscribe function
        return () => {
            this.readCallbacks.get(conversationId)?.delete(callback);

            // If no more callbacks, unsubscribe
            if (this.readCallbacks.get(conversationId)?.size === 0) {
                this.unsubscribeFromReadReceipts(conversationId);
            }
        };
    }

    /**
     * Unsubscribe from read receipts
     */
    private unsubscribeFromReadReceipts(conversationId: string): void {
        const subscriptionKey = `read-${conversationId}`;
        const subscription = this.chatSubscriptions.get(subscriptionKey);

        if (subscription) {
            subscription.unsubscribe();
            this.chatSubscriptions.delete(subscriptionKey);
            this.readCallbacks.delete(conversationId);
            console.log(`🔕 Unsubscribed from read receipts: ${conversationId}`);
        }
    }

    /**
     * Subscribe to user status
     */
    subscribeToUserStatus(callback: UserStatusCallback): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to user status.');
            return () => { };
        }

        // Add callback
        this.userStatusCallbacks.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = 'user-status';
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                '/topic/user-status',
                (message: IMessage) => {
                    const data = JSON.parse(message.body) as UserStatus;
                    console.log('👤 User status:', data);

                    // Notify all callbacks
                    this.userStatusCallbacks.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in user status callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log('📡 Subscribed to user status');
        }

        // Return unsubscribe function
        return () => {
            this.userStatusCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to personal notifications (messages when offline)
     */
    subscribeToPersonalNotifications(callback: MessageCallback): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to personal notifications.');
            return () => { };
        }

        // Add callback
        this.personalNotificationCallbacks.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = 'personal-notifications';
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                '/user/queue/messages',
                (message: IMessage) => {
                    const data = JSON.parse(message.body) as MessageResponse;
                    console.log('📬 Personal notification:', data);

                    // Notify all callbacks
                    this.personalNotificationCallbacks.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in personal notification callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log('📡 Subscribed to personal notifications');
        }

        // Return unsubscribe function
        return () => {
            this.personalNotificationCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to system messages
     */
    subscribeToSystemMessages(callback: (message: any) => void): () => void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot subscribe to system messages.');
            return () => { };
        }

        // Add callback
        this.systemMessageCallbacks.add(callback);

        // Subscribe if not already subscribed
        const subscriptionKey = 'system-messages';
        if (!this.chatSubscriptions.has(subscriptionKey)) {
            const subscription = this.stompClient.subscribe(
                '/user/queue/system',
                (message: IMessage) => {
                    const data = JSON.parse(message.body);
                    console.log('🔔 System message:', data);

                    // Notify all callbacks
                    this.systemMessageCallbacks.forEach((cb) => {
                        try {
                            cb(data);
                        } catch (error) {
                            console.error('Error in system message callback:', error);
                        }
                    });
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
            console.log('📡 Subscribed to system messages');
        }

        // Return unsubscribe function
        return () => {
            this.systemMessageCallbacks.delete(callback);
        };
    }

    /**
     * Send message via WebSocket
     */
    sendMessage(message: {
        conversationId: string;
        content: string;
        type?: string;
        repliedToMessageId?: string;
        attachmentId?: string;
    }): void {
        if (!this.stompClient?.connected) {
            console.error('❌ WebSocket not connected. Cannot send message.');
            return;
        }

        this.stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(message),
        });

        console.log('📤 Sent message via WebSocket:', message);
    }

    /**
     * Send typing status
     */
    sendTypingStatus(
        conversationId: string,
        isTyping: boolean,
        userName: string
    ): void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot send typing status.');
            return;
        }

        this.stompClient.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({
                conversationId,
                userName,
                isTyping,
                timestamp: new Date().toISOString(),
            }),
        });

        console.log(`⌨️ Sent typing status: ${isTyping ? 'typing' : 'stopped'}`);
    }

    /**
     * Mark messages as read
     */
    markAsRead(conversationId: string, messageIds: string[]): void {
        if (!this.stompClient?.connected) {
            console.warn('WebSocket not connected. Cannot mark as read.');
            return;
        }

        this.stompClient.publish({
            destination: '/app/chat.read',
            body: JSON.stringify({
                conversationId,
                messageIds,
                timestamp: new Date().toISOString(),
            }),
        });

        console.log('📖 Marked messages as read:', messageIds);
    }

    /**
     * Cleanup all chat subscriptions
     */
    cleanupChatSubscriptions(): void {
        console.log('🧹 Cleaning up chat subscriptions...');

        // Unsubscribe all chat subscriptions
        this.chatSubscriptions.forEach((subscription, key) => {
            subscription.unsubscribe();
            console.log(`🔕 Unsubscribed from ${key}`);
        });

        // Clear all maps and sets
        this.chatSubscriptions.clear();
        this.messageCallbacks.clear();
        this.typingCallbacks.clear();
        this.readCallbacks.clear();
        this.userStatusCallbacks.clear();
        this.personalNotificationCallbacks.clear();
        this.systemMessageCallbacks.clear();

        console.log('✅ Chat subscriptions cleaned up');
    }
}

export default WebSocketService.getInstance();
