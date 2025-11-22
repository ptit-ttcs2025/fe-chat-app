import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import type { INotification } from '@/apis/notification/notification.type';

type NotificationCallback = (notification: INotification) => void;

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
        
        // Unsubscribe
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
}

export default WebSocketService.getInstance();
