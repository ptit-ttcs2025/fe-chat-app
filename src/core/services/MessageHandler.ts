/**
 * MessageHandler
 * Handles message parsing, validation, and error handling for WebSocket messages
 */

import type { IMessage } from '@stomp/stompjs';
import type {
    ParsedMessage,
    MessageHandlerConfig,
    SubscriptionCallback,
} from './websocket.types';

export class MessageHandler {
    private config: MessageHandlerConfig;

    constructor(config: MessageHandlerConfig = {}) {
        this.config = {
            enableLogging: true,
            throwOnError: false,
            ...config,
        };
    }

    /**
     * Parse message body safely
     */
    parseMessage<T>(message: IMessage, parser?: (body: string) => T): ParsedMessage<T> {
        try {
            const data = parser ? parser(message.body) : JSON.parse(message.body) as T;
            return { success: true, data };
        } catch (error) {
            const parseError = error instanceof Error ? error : new Error(String(error));

            if (this.config.enableLogging) {
                console.error('❌ Error parsing message:', parseError);
                console.error('   - Message body:', message.body?.substring(0, 100));
            }

            if (this.config.throwOnError) {
                throw parseError;
            }

            return { success: false, error: parseError };
        }
    }

    /**
     * Notify callbacks safely with error handling
     */
    notifyCallbacks<T>(
        callbacks: Set<SubscriptionCallback<T>> | undefined,
        data: T,
        errorContext?: string
    ): void {
        if (!callbacks || callbacks.size === 0) {
            return;
        }

        callbacks.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                if (this.config.enableLogging) {
                    const context = errorContext ? ` (${errorContext})` : '';
                    console.error(`❌ Error in callback${context}:`, error);
                }
            }
        });
    }

    /**
     * Create a message handler function
     */
    createMessageHandler<T>(
        callbacks: Set<SubscriptionCallback<T>>,
        parser?: (body: string) => T,
        errorContext?: string
    ): (message: IMessage) => void {
        return (message: IMessage) => {
            const result = this.parseMessage<T>(message, parser);

            if (result.success && result.data) {
                this.notifyCallbacks(callbacks, result.data, errorContext);
            }
        };
    }

    /**
     * Default JSON parser
     */
    static jsonParser<T>(body: string): T {
        return JSON.parse(body) as T;
    }

    /**
     * Log message flow (optional, for debugging)
     */
    logMessage(topic: string, direction: 'incoming' | 'outgoing', body?: any): void {
        if (!this.config.enableLogging) return;

        const timestamp = new Date().toISOString();
        const icon = direction === 'incoming' ? '📥' : '📤';

        console.debug(`${icon} [${timestamp}] ${topic}`, body ? body : '');
    }
}

/**
 * Singleton instance for shared usage
 */
export const messageHandler = new MessageHandler({
    enableLogging: true,
    throwOnError: false,
});

