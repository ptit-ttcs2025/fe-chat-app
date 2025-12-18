/**
 * WebSocket Services Index
 * Centralized exports for WebSocket-related services and types
 */

// Main service (default export maintained for backward compatibility)
export { default } from './websocket.service';
export { default as websocketService } from './websocket.service';

// Individual managers (for advanced usage or testing)
export { connectionManager } from './ConnectionManager';
export { subscriptionManager } from './SubscriptionManager';
export { messageHandler, MessageHandler } from './MessageHandler';

// Types (for TypeScript consumers)
export type {
    // Callback types
    NotificationCallback,
    MessageCallback,
    TypingCallback,
    ReadCallback,
    UserStatusCallback,
    SystemMessageCallback,
    SubscriptionCallback,

    // Configuration types
    ConnectionConfig,
    ConnectionMetrics,
    ConnectionQuality,

    // Subscription types
    SubscriptionConfig,
    SubscriptionEntry,

    // Message types
    ParsedMessage,
    MessageHandlerConfig,

    // Outgoing message types
    SendMessagePayload,
    TypingStatusPayload,
    ReadReceiptPayload,

    // Other types
    TransportInfo,
} from './websocket.types';

export {
    SubscriptionType,
    WebSocketErrorType,
    WebSocketError,
} from './websocket.types';

