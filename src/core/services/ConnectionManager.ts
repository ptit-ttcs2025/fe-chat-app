/**
 * ConnectionManager
 * Manages WebSocket connection lifecycle, reconnection, and transport detection
 */

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { ConnectionConfig, ConnectionQuality } from './websocket.types';
import { environment } from '@/environment';

/**
 * Connection state
 */
interface ConnectionState {
    isConnected: boolean;
    currentUserId: string | null;
    reconnectAttempts: number;
    transport: string;
    quality: ConnectionQuality;
}

/**
 * ConnectionManager class
 */
export class ConnectionManager {
    private client: Client | null = null;
    private sockjsInstance: any = null;

    private state: ConnectionState = {
        isConnected: false,
        currentUserId: null,
        reconnectAttempts: 0,
        transport: 'unknown',
        quality: 'disconnected',
    };

    private config: Required<ConnectionConfig> = {
        wsUrl: '',
        token: '',
        userId: '',
        maxReconnectAttempts: 10,
        heartbeatIncoming: 30000,
        heartbeatOutgoing: 30000,
        timeout: 15000,
    };

    // Callbacks
    private onConnectCallback: ((client: Client) => void) | null = null;
    private onDisconnectCallback: (() => void) | null = null;
    private onReconnectCallback: ((attempt: number) => void) | null = null;

    /**
     * Set callbacks
     */
    setCallbacks(callbacks: {
        onConnect?: (client: Client) => void;
        onDisconnect?: () => void;
        onReconnect?: (attempt: number) => void;
    }): void {
        if (callbacks.onConnect) this.onConnectCallback = callbacks.onConnect;
        if (callbacks.onDisconnect) this.onDisconnectCallback = callbacks.onDisconnect;
        if (callbacks.onReconnect) this.onReconnectCallback = callbacks.onReconnect;
    }

    /**
     * Connect to WebSocket
     */
    connect(config: ConnectionConfig): void {
        // Update config
        this.config = { ...this.config, ...config };

        // Check if already connected
        if (this.state.isConnected && this.state.currentUserId === config.userId) {
            return;
        }

        // Disconnect previous connection if switching user
        if (this.state.isConnected && this.state.currentUserId !== config.userId) {
            this.disconnect();
        }

        this.state.currentUserId = config.userId;

        // Convert ws:// to http:// for SockJS
        const httpUrl = config.wsUrl
            .replace(/^wss:/, 'https:')
            .replace(/^ws:/, 'http:');

        // Get transport options from environment (fallback to default)
        const transports = environment.websocket.transports || ['websocket', 'xhr-streaming'];

        // Create SockJS instance
        const sockjs = new SockJS(httpUrl, null, {
            transports: transports as any,
            timeout: this.config.timeout,
        });
        
        // Log SockJS events for debugging
        if (environment.websocket.enableDebugLogs) {
            sockjs.onopen = () => {};
            sockjs.onclose = () => {};
            sockjs.onerror = (error) => {
                console.error('❌ SockJS error:', error);
            };
        }
        this.sockjsInstance = sockjs;

        // Create STOMP client
        this.client = new Client({
            webSocketFactory: () => sockjs as any,
            connectHeaders: {
                'Authorization': `Bearer ${config.token}`,
            },
            debug: (str) => this.handleDebugLog(str),
            reconnectDelay: 0, // Use custom reconnection logic
            heartbeatIncoming: this.config.heartbeatIncoming,
            heartbeatOutgoing: this.config.heartbeatOutgoing,
            onConnect: (frame) => this.handleConnect(frame),
            onStompError: (frame) => this.handleStompError(frame),
            onWebSocketError: (event) => this.handleWebSocketError(event),
            onDisconnect: () => this.handleDisconnect(),
        });

        // Activate connection
        this.client.activate();
    }

    /**
     * Disconnect
     */
    disconnect(): void {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }

        this.sockjsInstance = null;
        this.state.isConnected = false;
        this.state.currentUserId = null;
        this.state.reconnectAttempts = 0;
        this.state.quality = 'disconnected';
    }

    /**
     * Handle connect
     */
    private handleConnect(_frame: any): void {
        this.state.isConnected = true;
        this.state.reconnectAttempts = 0;
        this.state.quality = 'good';

        // Detect transport
        this.detectTransport();

        const timestamp = new Date().toISOString();
        console.info(`✅ [${timestamp}] WebSocket connected - Transport: ${this.state.transport}`);

        // Warning if using fallback
        if (this.isUsingFallbackTransport()) {
            console.warn('⚠️ Using fallback transport (not native WebSocket)', this.state.transport);
        }

        // Notify callback
        if (this.onConnectCallback && this.client) {
            this.onConnectCallback(this.client);
        }
    }

    /**
     * Handle disconnect
     */
    private handleDisconnect(): void {
        console.info('👋 WebSocket disconnected');

        this.state.isConnected = false;
        this.state.quality = 'disconnected';

        // Notify callback
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }

        // Attempt reconnection
        this.attemptReconnect();
    }

    /**
     * Handle STOMP error
     */
    private handleStompError(frame: any): void {
        console.error('❌ STOMP error:', frame);
        console.error('   - Headers:', frame.headers);
        console.error('   - Body:', frame.body);
        console.error('   - Current transport:', this.state.transport);
        console.error('   - Reconnect attempts:', this.state.reconnectAttempts);
        
        // Log thêm thông tin trong production để debug
        if (import.meta.env.PROD) {
            console.error('   - WS URL:', this.config.wsUrl);
            console.error('   - User ID:', this.state.currentUserId);
        }
        
        this.state.isConnected = false;
        this.state.quality = 'disconnected';
        
        // Attempt reconnection nếu chưa vượt quá max attempts
        if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.attemptReconnect();
        }
    }

    /**
     * Handle WebSocket error
     */
    private handleWebSocketError(event: any): void {
        console.error('❌ WebSocket error:', event);
        console.error('   - Type:', event.type);
        console.error('   - Current transport:', this.state.transport);
        console.error('   - Reconnect attempts:', this.state.reconnectAttempts);
        
        // Log thêm thông tin trong production để debug
        if (import.meta.env.PROD) {
            console.error('   - WS URL:', this.config.wsUrl);
            console.error('   - User ID:', this.state.currentUserId);
        }
        
        this.state.isConnected = false;
        this.state.quality = 'poor';
        
        // Attempt reconnection nếu chưa vượt quá max attempts
        if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.attemptReconnect();
        }
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            console.error('   - Please refresh the page to reconnect');
            this.state.quality = 'disconnected';
            return;
        }

        this.state.reconnectAttempts++;
        this.state.quality = 'poor';

        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, this.state.reconnectAttempts - 1), 30000);
        const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
        const delay = Math.round(baseDelay + jitter);

        // Notify callback
        if (this.onReconnectCallback) {
            this.onReconnectCallback(this.state.reconnectAttempts);
        }

        setTimeout(() => {
            if (!this.state.isConnected) {
                this.connect(this.config);
            }
        }, delay);
    }

    /**
     * Detect transport type
     */
    private detectTransport(): void {
        let transport = 'unknown';

        if (this.sockjsInstance) {
            try {
                const sockjsTransport = (this.sockjsInstance as any)._transport;

                if (sockjsTransport) {
                    if (sockjsTransport instanceof WebSocket) {
                        transport = 'websocket';
                    } else {
                        const transportName = sockjsTransport.transportName ||
                                            sockjsTransport.name ||
                                            sockjsTransport.protocol || '';

                        if (transportName.includes('websocket') || transportName === 'websocket') {
                            transport = 'websocket';
                        } else if (transportName.includes('xhr') || transportName.includes('streaming')) {
                            transport = 'xhr-streaming';
                        } else if (transportName) {
                            transport = transportName;
                        }
                    }
                } else {
                    const url = (this.sockjsInstance as any).url || '';
                    if (url.includes('/websocket')) {
                        transport = 'websocket';
                    } else if (url.includes('/xhr')) {
                        transport = 'xhr-streaming';
                    }
                }
            } catch (_error) {}
        }

        this.state.transport = transport;
    }

    /**
     * Handle debug logs
     */
    private handleDebugLog(str: string): void {
        const timestamp = new Date().toISOString();

        if (str.includes('ERROR') || str.includes('DISCONNECT')) {
            console.error(`🔍 [${timestamp}] STOMP:`, str);
        }
    }

    /**
     * Get client
     */
    getClient(): Client | null {
        return this.client;
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.state.isConnected;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId(): string | null {
        return this.state.currentUserId;
    }

    /**
     * Get connection quality
     */
    getConnectionQuality(): { status: string; transport: string; quality: string } {
        return {
            status: this.state.isConnected ? 'connected' : 'disconnected',
            transport: this.state.transport,
            quality: this.state.quality,
        };
    }

    /**
     * Check if using fallback transport
     */
    isUsingFallbackTransport(): boolean {
        return this.state.transport !== 'websocket' && this.state.transport !== 'unknown';
    }

    /**
     * Get current transport
     */
    getCurrentTransport(): string {
        return this.state.transport;
    }

    /**
     * Get current token
     */
    getToken(): string {
        return this.config.token;
    }
}

/**
 * Singleton instance
 */
export const connectionManager = new ConnectionManager();

