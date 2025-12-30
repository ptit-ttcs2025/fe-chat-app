/**
 * WebSocket Hook for Friend Nickname Updates
 * Subscribes to /user/queue/friend-updates for real-time nickname changes
 * Reference: FRIEND_NICKNAME_GUIDE.md
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '@/core/services/websocket.service';
import { connectionManager } from '@/core/services/ConnectionManager';

// Define message type locally to avoid circular import
interface FriendNicknameUpdateMessage {
    type: 'FRIEND_NICKNAME_UPDATED';
    friendId: string;
    newNickname: string;
    timestamp: string;
}

/**
 * Hook to subscribe to friend nickname updates via WebSocket
 *
 * Features:
 * - Real-time updates when friend nickname changes
 * - Auto-invalidates queries to refresh UI
 * - Waits for WebSocket connection before subscribing
 * - Auto-retries subscription when connection is established
 * - Auto-cleanup on unmount
 *
 * @param enabled - Whether to enable the subscription
 *
 * @example
 * ```tsx
 * // In ContactTab or ChatList component
 * useFriendNicknameWebSocket(true);
 *
 * // UI will auto-update when friend nickname changes via WebSocket
 * ```
 */
export const useFriendNicknameWebSocket = (enabled: boolean = true) => {
    const queryClient = useQueryClient();
    const [isConnected, setIsConnected] = useState(websocketService.getConnectionStatus());
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 10; // Maximum 10 retries (10 seconds total)

    // Stable callback reference for nickname updates
    const handleNicknameUpdate = useCallback((message: FriendNicknameUpdateMessage) => {
        console.log('📡 Friend nickname update received via WebSocket:', {
            friendId: message.friendId,
            newNickname: message.newNickname,
            timestamp: message.timestamp,
        });

        // ✅ UPDATE CACHE DIRECTLY for instant UI update (before invalidation)

        // 1. Update conversation list caches
        queryClient.setQueriesData<any>({ queryKey: ['chat', 'conversations'] }, (old: any) => {
            if (!old?.results) return old;

            return {
                ...old,
                results: old.results.map((conv: any) => {
                    // Update if this conversation involves the friend
                    if (conv.peerUserId === message.friendId) {
                        return {
                            ...conv,
                            name: message.newNickname,
                            peerDisplayName: message.newNickname,
                        };
                    }
                    return conv;
                }),
            };
        });

        // 2. Update conversation detail caches
        queryClient.setQueriesData<any>({ queryKey: ['conversation-detail'] }, (old: any) => {
            if (!old) return old;

            if (old.peerUserId === message.friendId) {
                return {
                    ...old,
                    peerDisplayName: message.newNickname,
                    name: message.newNickname,
                };
            }
            return old;
        });

        // 3. Invalidate queries for background refetch (with correct keys)
        queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        queryClient.invalidateQueries({ queryKey: ['friendDetail', message.friendId] });
        queryClient.invalidateQueries({
            queryKey: ['chat', 'conversations'],
            refetchType: 'active',
        });
        queryClient.invalidateQueries({
            queryKey: ['conversation-detail'],
            refetchType: 'active',
        });
        queryClient.invalidateQueries({
            queryKey: ['chat', 'conversation'],
            refetchType: 'active',
        });

        console.log('✅ WebSocket: Cache updated directly + queries invalidated for background refresh');
    }, [queryClient]);

    // Poll connection status periodically
    useEffect(() => {
        if (!enabled) return;

        const checkInterval = setInterval(() => {
            const connected = websocketService.getConnectionStatus();
            if (connected !== isConnected) {
                console.log(`🔄 WebSocket status changed: ${isConnected} → ${connected}`);
                setIsConnected(connected);
            }
        }, 1000); // Check every second

        return () => clearInterval(checkInterval);
    }, [enabled, isConnected]);

    // Subscribe to nickname updates when WebSocket is connected
    useEffect(() => {
        if (!enabled) {
            console.log('⏸️ Nickname WebSocket subscription disabled');
            return;
        }

        if (!isConnected) {
            console.log('⏳ Waiting for WebSocket connection...');
            retryCountRef.current = 0; // Reset retry count
            return;
        }

        console.log('🔌 Attempting to subscribe to /user/queue/friend-updates...');

        const attemptSubscribe = () => {
            try {
                // Directly using connectionManager to get the client
                const client = connectionManager.getClient();

                if (!client) {
                    retryCountRef.current += 1;

                    if (retryCountRef.current >= MAX_RETRIES) {
                        console.error(`❌ Failed to get WebSocket client after ${MAX_RETRIES} retries`);
                        retryCountRef.current = 0;
                        return;
                    }

                    console.warn(`⚠️ WebSocket client not available yet (attempt ${retryCountRef.current}/${MAX_RETRIES}), retrying in 1s...`);

                    // Retry after 1 second
                    retryTimeoutRef.current = setTimeout(() => {
                        attemptSubscribe();
                    }, 1000);

                    return;
                }

                // Reset retry count on success
                retryCountRef.current = 0;

                // Subscribe to friend updates
                subscriptionRef.current = client.subscribe(
                    '/user/queue/friend-updates',
                    (message: { body: string }) => {
                        try {
                            const data: FriendNicknameUpdateMessage = JSON.parse(message.body);

                            // Only handle FRIEND_NICKNAME_UPDATED messages
                            if (data.type === 'FRIEND_NICKNAME_UPDATED') {
                                handleNicknameUpdate(data);
                            } else {
                                console.log('📭 Received other friend update type:', data.type);
                            }
                        } catch (error) {
                            console.error('❌ Failed to parse friend update message:', error);
                        }
                    }
                );

                console.log('✅ Successfully subscribed to friend nickname updates');
            } catch (error) {
                console.error('❌ Failed to subscribe to nickname updates:', error);

                // Retry on error
                retryCountRef.current += 1;
                if (retryCountRef.current < MAX_RETRIES) {
                    retryTimeoutRef.current = setTimeout(() => {
                        attemptSubscribe();
                    }, 1000);
                }
            }
        };

        // Start subscription attempt
        attemptSubscribe();

        // Cleanup subscription on unmount or when connection changes
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            if (subscriptionRef.current) {
                console.log('🔌 Unsubscribing from friend nickname updates...');
                try {
                    subscriptionRef.current.unsubscribe();
                } catch (error) {
                    console.error('Failed to unsubscribe:', error);
                }
                subscriptionRef.current = null;
            }

            retryCountRef.current = 0;
        };
    }, [enabled, isConnected, handleNicknameUpdate]);
};
