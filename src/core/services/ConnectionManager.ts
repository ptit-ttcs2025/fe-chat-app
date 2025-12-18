/**
 * ConnectionManager
 * Manages WebSocket connection lifecycle, reconnection, and transport detection
 */

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { ConnectionConfig, ConnectionQuality } from './websocket.types';

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
            console.log('WebSocket already connected for user:', config.userId);
            return;
        }

        // Disconnect previous connection if switching user
        if (this.state.isConnected && this.state.currentUserId !== config.userId) {
            console.log('Switching user, disconnecting previous connection');
            this.disconnect();
        }

        this.state.currentUserId = config.userId;

        // Convert ws:// to http:// for SockJS
        const httpUrl = config.wsUrl
            .replace(/^wss:/, 'https:')
            .replace(/^ws:/, 'http:');

        // Create SockJS instance
        const sockjs = new SockJS(httpUrl, null, {
            transports: ['websocket', 'xhr-streaming'],
            timeout: this.config.timeout,
        });
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
        console.log(`✅ [${timestamp}] WebSocket connected`);
        console.log('   - User ID:', this.state.currentUserId);
        console.log('   - Transport:', this.state.transport);

        // Warning if using fallback
        if (this.isUsingFallbackTransport()) {
            console.warn('⚠️ Using fallback transport (not native WebSocket)');
            console.warn('   - Current transport:', this.state.transport);
        } else if (this.state.transport === 'websocket') {
            console.log('✅ Native WebSocket connection confirmed');
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
        console.log('👋 WebSocket disconnected');
        console.log('   - Reconnect attempts:', this.state.reconnectAttempts);
        console.log('   - Last transport:', this.state.transport);

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
        this.state.isConnected = false;
        this.state.quality = 'disconnected';
    }

    /**
     * Handle WebSocket error
     */
    private handleWebSocketError(event: any): void {
        console.error('❌ WebSocket error:', event);
        console.error('   - Type:', event.type);
        this.state.isConnected = false;
        this.state.quality = 'poor';
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

        console.log(`🔄 Reconnecting in ${delay}ms (${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        // Notify callback
        if (this.onReconnectCallback) {
            this.onReconnectCallback(this.state.reconnectAttempts);
        }

        setTimeout(() => {
            if (!this.state.isConnected) {
                console.log('🔄 Attempting reconnection...');
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
            } catch (error) {
                console.debug('Could not detect transport directly');
            }
        }

        this.state.transport = transport;
    }

    /**
     * Handle debug logs
     */
    private handleDebugLog(str: string): void {
        const timestamp = new Date().toISOString();

        if (import.meta.env.PROD) {
            if (str.includes('ERROR') || str.includes('DISCONNECT')) {
                console.error(`🔍 [${timestamp}] STOMP:`, str);
            } else if (str.includes('CONNECTED')) {
                console.log(`✅ [${timestamp}] STOMP:`, str);
            }
        } else {
            if (str.includes('ERROR')) {
                console.error(`❌ [${timestamp}] STOMP Error:`, str);
            } else if (str.includes('CONNECTED') || str.includes('DISCONNECT')) {
                console.log(`🔍 [${timestamp}] STOMP:`, str);
            }
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
}

/**
 * Singleton instance
 */
export const connectionManager = new ConnectionManager();

