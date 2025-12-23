/**
 * WebSocket Service Types & Interfaces
 * Centralized type definitions for WebSocket service
 */

import type { StompSubscription } from '@stomp/stompjs';
import type { INotification } from '@/apis/notification/notification.type';
import type {
    MessageResponse,
    TypingStatus,
    MessageRead,
    UserStatus,
} from '@/apis/chat/chat.type';

// ==================== Callback Types ====================

export type NotificationCallback = (notification: INotification) => void;
export type MessageCallback = (message: MessageResponse) => void;
export type TypingCallback = (status: TypingStatus) => void;
export type ReadCallback = (read: MessageRead) => void;
export type UserStatusCallback = (status: UserStatus) => void;
export type SystemMessageCallback = (message: any) => void;

/**
 * Generic subscription callback
 */
export type SubscriptionCallback<T> = (data: T) => void;

// ==================== Configuration Types ====================

/**
 * Connection configuration
 */
export interface ConnectionConfig {
    wsUrl: string;
    token: string;
    userId: string;
    maxReconnectAttempts?: number;
    heartbeatIncoming?: number;
    heartbeatOutgoing?: number;
    timeout?: number;
}

/**
 * Connection quality status
 */
export type ConnectionQuality = 'good' | 'poor' | 'disconnected';

/**
 * Connection metrics
 */
export interface ConnectionMetrics {
    status: 'connected' | 'disconnected';
    transport: string;
    quality: ConnectionQuality;
}

// ==================== Subscription Types ====================

/**
 * Subscription configuration
 */
export interface SubscriptionConfig<T> {
    topic: string;
    key: string;
    parser: (body: string) => T;
    callbacks: Set<SubscriptionCallback<T>>;
}

/**
 * Subscription type enum
 */
export enum SubscriptionType {
    CONVERSATION = 'conversation',
    TYPING = 'typing',
    READ_RECEIPT = 'read',
    USER_STATUS = 'user-status',
    PERSONAL_NOTIFICATION = 'personal-notifications',
    SYSTEM_MESSAGE = 'system-messages',
}

/**
 * Subscription registry entry
 */
export interface SubscriptionEntry {
    subscription: StompSubscription;
    topic: string;
    type: SubscriptionType;
}

// ==================== Message Types ====================

/**
 * Parsed message wrapper
 */
export interface ParsedMessage<T> {
    success: boolean;
    data?: T;
    error?: Error;
}

/**
 * Message handler configuration
 */
export interface MessageHandlerConfig {
    enableLogging?: boolean;
    throwOnError?: boolean;
}

// ==================== Outgoing Message Types ====================

/**
 * Send message payload
 */
export interface SendMessagePayload {
    conversationId: string;
    content: string;
    type?: string;
    repliedToMessageId?: string;
    attachmentId?: string;
}

/**
 * Typing status payload
 */
export interface TypingStatusPayload {
    conversationId: string;
    userName: string;
    isTyping: boolean;
    timestamp: string;
}

/**
 * Read receipt payload
 */
export interface ReadReceiptPayload {
    conversationId: string;
    messageIds: string[];
    timestamp: string;
}

// ==================== Transport Detection ====================

/**
 * Transport information
 */
export interface TransportInfo {
    type: string;
    url: string;
    protocol?: string;
}

// ==================== Error Types ====================

/**
 * WebSocket error types
 */
export enum WebSocketErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
    MESSAGE_PARSE_FAILED = 'MESSAGE_PARSE_FAILED',
    SEND_FAILED = 'SEND_FAILED',
    RECONNECT_FAILED = 'RECONNECT_FAILED',
}

/**
 * WebSocket error
 */
export class WebSocketError extends Error {
    constructor(
        public type: WebSocketErrorType,
        message: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'WebSocketError';
    }
}

