import type { Client, StompSubscription } from '@stomp/stompjs';
import type { SubscriptionCallback } from './websocket.types';
import { messageHandler } from './MessageHandler';

/**
 * Generic subscription entry
 */
interface GenericSubscription<T> {
    topic: string;
    subscription: StompSubscription | null;
    callbacks: Set<SubscriptionCallback<T>>;
    parser?: (body: string) => T;
}

/**
 * SubscriptionManager class
 * Manages all WebSocket subscriptions with generic pattern
 */
export class SubscriptionManager {
    private client: Client | null = null;

    // Generic subscriptions storage
    // Key format: "type:identifier" (e.g., "conversation:123", "typing:123", "user-status")
    private subscriptions: Map<string, GenericSubscription<any>> = new Map();

    /**
     * Set STOMP client
     */
    setClient(client: Client | null): void {
        this.client = client;
    }

    /**
     * Check if connected
     */
    private isConnected(): boolean {
        return this.client?.connected ?? false;
    }

    /**
     * Subscribe to a topic with generic pattern
     */
    subscribe<T>(
        key: string,
        topic: string,
        callback: SubscriptionCallback<T>,
        parser?: (body: string) => T
    ): () => void {
        if (!this.isConnected()) {
            console.warn(`⚠️ WebSocket not connected. Cannot subscribe to: ${topic}`);
            return () => {};
        }

        // Get or create subscription entry
        let entry = this.subscriptions.get(key) as GenericSubscription<T> | undefined;

        if (!entry) {
            // Create new subscription entry
            entry = {
                topic,
                subscription: null,
                callbacks: new Set<SubscriptionCallback<T>>(),
                parser,
            };
            this.subscriptions.set(key, entry);
        }

        // Add callback
        entry.callbacks.add(callback);

        // Subscribe to topic if not already subscribed
        if (!entry.subscription && this.client) {
            const messageHandlerFn = messageHandler.createMessageHandler<T>(
                entry.callbacks,
                parser,
                key
            );

            entry.subscription = this.client.subscribe(topic, messageHandlerFn);
        }

        // Return unsubscribe function
        return () => {
            this.removeCallback(key, callback);
        };
    }

    /**
     * Remove callback and cleanup if no more callbacks
     */
    private removeCallback<T>(key: string, callback: SubscriptionCallback<T>): void {
        const entry = this.subscriptions.get(key) as GenericSubscription<T> | undefined;

        if (!entry) return;

        entry.callbacks.delete(callback);

        // If no more callbacks, unsubscribe
        if (entry.callbacks.size === 0) {
            this.unsubscribe(key);
        }
    }

    /**
     * Unsubscribe from topic
     */
    private unsubscribe(key: string): void {
        const entry = this.subscriptions.get(key);

        if (!entry) return;

        // Unsubscribe from STOMP
        if (entry.subscription) {
            try {
                entry.subscription.unsubscribe();
            } catch (error) {
                console.error(`❌ Error unsubscribing from ${key}:`, error);
            }
        }

        // Remove entry
        this.subscriptions.delete(key);
    }

    /**
     * Re-subscribe to all active subscriptions (after reconnection)
     */
    resubscribeAll(): void {
        if (!this.isConnected()) {
            console.warn('⚠️ Cannot re-subscribe: WebSocket not connected');
            return;
        }

        const timestamp = new Date().toISOString();
        console.log(`🔄 [${timestamp}] Re-subscribing to ${this.subscriptions.size} subscription(s)...`);

        this.subscriptions.forEach((entry, key) => {
            // Only re-subscribe if there are active callbacks
            if (entry.callbacks.size === 0) {
                return;
            }

            // Skip if already subscribed
            if (entry.subscription) {
                return;
            }

            // Re-subscribe
            console.log(`   - Re-subscribing to: ${entry.topic}`);

            const messageHandlerFn = messageHandler.createMessageHandler(
                entry.callbacks,
                entry.parser,
                key
            );

            try {
                entry.subscription = this.client!.subscribe(entry.topic, messageHandlerFn);
            } catch (error) {
                console.error(`❌ Failed to re-subscribe to ${key}:`, error);
            }
        });

        console.log(`✅ [${timestamp}] Re-subscription completed`);
    }

    /**
     * Cleanup all subscriptions
     */
    cleanup(): void {
        console.log(`🧹 Cleaning up ${this.subscriptions.size} subscription(s)...`);

        this.subscriptions.forEach((entry, key) => {
            if (entry.subscription) {
                try {
                    entry.subscription.unsubscribe();
                } catch (error) {
                    console.error(`❌ Error unsubscribing from ${key}:`, error);
                }
            }
        });

        this.subscriptions.clear();
    }

    /**
     * Get subscription stats (for debugging)
     */
    getStats(): {
        totalSubscriptions: number;
        activeSubscriptions: number;
        totalCallbacks: number;
    } {
        let activeSubscriptions = 0;
        let totalCallbacks = 0;

        this.subscriptions.forEach((entry) => {
            if (entry.subscription) activeSubscriptions++;
            totalCallbacks += entry.callbacks.size;
        });

        return {
            totalSubscriptions: this.subscriptions.size,
            activeSubscriptions,
            totalCallbacks,
        };
    }

    /**
     * Check if subscribed to a specific key
     */
    isSubscribed(key: string): boolean {
        const entry = this.subscriptions.get(key);
        return entry?.subscription !== null && entry?.subscription !== undefined;
    }
}

/**
 * Singleton instance
 */
export const subscriptionManager = new SubscriptionManager();

