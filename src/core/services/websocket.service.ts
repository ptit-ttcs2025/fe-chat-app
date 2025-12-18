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
    private maxReconnectAttempts: number = 10; // ✅ Tăng từ 5 -> 10
    private reconnectDelay: number = 5000;
    private currentUserId: string | null = null;

    // ✅ New: Transport & Connection Quality Monitoring
    private currentTransport: string = 'unknown';
    private connectionQuality: 'good' | 'poor' | 'disconnected' = 'disconnected';

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

    connect(wsUrl: string, token: string, userId: string): void {
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

        // ✅ SockJS yêu cầu URL HTTP/HTTPS, không phải ws:// hay wss://
        // Convert wss:// -> https:// và ws:// -> http:// nếu cần
        const httpUrl = wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
        
        // Create STOMP client
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(httpUrl, null, {
                // ✅ Force WebSocket transport, fallback to xhr-streaming if needed
                transports: ['websocket', 'xhr-streaming'],
                timeout: 15000, // ✅ 15s connection timeout (tăng từ 10s cho production)
                // Debug transport selection
                debug: import.meta.env.PROD, // Enable detailed debug in production
            }) as any,
            connectHeaders: {
                'Authorization': `Bearer ${token}`
            },
            debug: (str) => {
                // ✅ Enhanced logging for production debugging
                const timestamp = new Date().toISOString();
                if (import.meta.env.PROD) {
                    if (str.includes('ERROR') || str.includes('DISCONNECT')) {
                        console.error(`🔍 [${timestamp}] STOMP:`, str);
                    } else if (str.includes('CONNECTED')) {
                        console.log(`✅ [${timestamp}] STOMP:`, str);
                    } else if (str.includes('SEND') || str.includes('MESSAGE')) {
                        // Log message flow in production for debugging
                        console.debug(`📤 [${timestamp}] STOMP:`, str.substring(0, 100));
                    }
                } else {
                    // Development: log all for debugging
                    if (str.includes('ERROR')) {
                        console.error(`❌ [${timestamp}] STOMP Error:`, str);
                    } else if (str.includes('CONNECTED') || str.includes('DISCONNECT')) {
                        console.log(`🔍 [${timestamp}] STOMP:`, str);
                    }
                }
            },
            reconnectDelay: 0, // ✅ Disable STOMP auto-reconnect, use custom logic
            heartbeatIncoming: 30000, // ✅ 30s (tối ưu cho production, giảm overhead)
            heartbeatOutgoing: 30000, // ✅ 30s - match với backend config
            onConnect: (frame) => {
                this.onConnected(frame);
            },
            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame);
                console.error('   - Headers:', frame.headers);
                console.error('   - Body:', frame.body);
                this.isConnected = false;
                this.connectionQuality = 'disconnected';
            },
            onWebSocketError: (event) => {
                console.error('❌ WebSocket error:', event);
                console.error('   - Type:', event.type);
                this.isConnected = false;
                this.connectionQuality = 'poor';
            },
            onDisconnect: () => {
                console.log('👋 WebSocket disconnected');
                console.log('   - Reconnect attempts:', this.reconnectAttempts);
                console.log('   - Last transport:', this.currentTransport);
                this.isConnected = false;
                this.connectionQuality = 'disconnected';
                this.handleReconnect(wsUrl, token, userId);
            },
        });

        // Activate connection
        this.stompClient.activate();
    }

    private onConnected(frame: any): void {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionQuality = 'good';
        
        // ✅ Detect and log actual transport being used
        const sockjs = (this.stompClient as any)?._webSocket?._transport;
        this.currentTransport = sockjs?.transportName || 'unknown';
        
        console.log('✅ WebSocket connected');
        console.log('   - User ID:', this.currentUserId);
        console.log('   - Transport:', this.currentTransport); // ⭐ KEY INFO
        console.log('   - URL:', sockjs?.url || 'N/A');

        // Subscribe to personal notification topic
        if (this.stompClient && this.currentUserId) {
            const notificationTopic = `/topic/users/${this.currentUserId}/notifications`;
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
            // Notify all registered callbacks
            this.notificationCallbacks.forEach(callback => {
                try {
                    callback(notification);
                } catch (error) {
                    console.error('❌ Error in notification callback:', error);
                }
            });
        } catch (error) {
            console.error('❌ Error parsing notification:', error);
        }
    }

    private handleReconnect(wsUrl: string, token: string, userId: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.connectionQuality = 'disconnected';
            return;
        }

        this.reconnectAttempts++;
        this.connectionQuality = 'poor';
        
        // ✅ Exponential backoff: 1s, 2s, 4s, 8s, 16s, ... (max 30s)
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        
        console.log(`🔄 Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.connect(wsUrl, token, userId);
            }
        }, delay);
    }

    disconnect(): void {
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

    /**
     * ✅ Get connection quality metrics
     */
    getConnectionQuality(): { status: string; transport: string; quality: string } {
        return {
            status: this.isConnected ? 'connected' : 'disconnected',
            transport: this.currentTransport,
            quality: this.connectionQuality,
        };
    }

    /**
     * ✅ Detect if using fallback transport (not native WebSocket)
     */
    isUsingFallbackTransport(): boolean {
        return this.currentTransport !== 'websocket' && this.currentTransport !== 'unknown';
    }

    /**
     * ✅ Get current transport type
     */
    getCurrentTransport(): string {
        return this.currentTransport;
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
            console.warn('⚠️ WebSocket not connected. Cannot subscribe to conversation.');
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
                    try {
                        const data = JSON.parse(message.body) as MessageResponse;
                        // Notify all callbacks for this conversation
                        const callbacks = this.messageCallbacks.get(conversationId);
                        callbacks?.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in message callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
                    try {
                        const data = JSON.parse(message.body) as TypingStatus;
                        // Notify all callbacks
                        this.typingCallbacks.get(conversationId)?.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in typing callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing typing status:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
                    try {
                        const data = JSON.parse(message.body) as MessageRead;
                        // Notify all callbacks
                        this.readCallbacks.get(conversationId)?.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in read callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing read receipt:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
                    try {
                        const data = JSON.parse(message.body) as UserStatus;
                        // Notify all callbacks
                        this.userStatusCallbacks.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in user status callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing user status:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
                    try {
                        const data = JSON.parse(message.body) as MessageResponse;
                        // Notify all callbacks
                        this.personalNotificationCallbacks.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in personal notification callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing personal notification:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
                    try {
                        const data = JSON.parse(message.body);
                        // Notify all callbacks
                        this.systemMessageCallbacks.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (error) {
                                console.error('❌ Error in system message callback:', error);
                            }
                        });
                    } catch (error) {
                        console.error('❌ Error parsing system message:', error);
                    }
                }
            );

            this.chatSubscriptions.set(subscriptionKey, subscription);
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
    }

    /**
     * Cleanup all chat subscriptions
     */
    cleanupChatSubscriptions(): void {
        // Unsubscribe all chat subscriptions
        this.chatSubscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });

        // Clear all maps and sets
        this.chatSubscriptions.clear();
        this.messageCallbacks.clear();
        this.typingCallbacks.clear();
        this.readCallbacks.clear();
        this.userStatusCallbacks.clear();
        this.personalNotificationCallbacks.clear();
        this.systemMessageCallbacks.clear();
    }
}

export default WebSocketService.getInstance();
