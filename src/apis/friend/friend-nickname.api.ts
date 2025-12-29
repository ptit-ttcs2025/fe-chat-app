/**
 * Friend Nickname API
 * Backend: PUT /friends/{friendId}/nickname
 * Reference: FRIEND_NICKNAME_GUIDE.md & IMPLEMENTATION_SUMMARY_NICKNAME.md
 */

import http from '@/lib/apiBase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const URI = ''; // baseURL already has /api/v1

// ==================== TYPES ====================

export interface UpdateNicknameRequest {
    nickname: string; // Max 100 chars, empty to reset
}

// ✅ Backend returns data directly (not wrapped in statusCode/message/data structure)
export interface UpdateNicknameResponseData {
    userId: string;
    friendId: string;
    displayName: string; // Updated nickname or original fullName
    avatarUrl: string | null;
    becameFriendsAt: string;
    isFavorite: boolean;
    lastActiveAt: string | null;
    isOnline?: boolean | null;
}

// ✅ Full response structure (if backend follows API spec)
export interface UpdateNicknameResponse {
    statusCode?: number;
    message?: string;
    timestamp?: string;
    data?: UpdateNicknameResponseData;
    // ✅ Also support direct data (when backend doesn't wrap)
    userId?: string;
    friendId?: string;
    displayName?: string;
    avatarUrl?: string | null;
    becameFriendsAt?: string;
    isFavorite?: boolean;
    lastActiveAt?: string | null;
    isOnline?: boolean | null;
}

export interface FriendNicknameUpdateMessage {
    type: 'FRIEND_NICKNAME_UPDATED';
    friendId: string;
    newNickname: string;
    timestamp: string;
}

// ==================== API ====================

export const nicknameUri = {
    updateNickname: (friendId: string) => `${URI}/friends/${friendId}/nickname`,
};

export const nicknameApis = {
    /**
     * Update friend nickname
     * PUT /friends/{friendId}/nickname
     *
     * @param friendId - Friend's user ID
     * @param nickname - New nickname (empty string to reset to fullName)
     * @returns Updated friend data with new displayName
     */
    updateNickname: async (
        friendId: string,
        nickname: string
    ): Promise<UpdateNicknameResponse> => {
        const response = await http.put<UpdateNicknameResponse>(
            nicknameUri.updateNickname(friendId),
            { nickname }
        );
        return response.data;
    },
};

// ==================== HOOKS ====================

/**
 * Hook to update friend nickname
 *
 * Features:
 * - Validates nickname length (max 100 chars)
 * - Auto-invalidates related queries (friends list, conversations)
 * - Supports reset nickname (empty string)
 *
 * @example
 * ```tsx
 * const updateNickname = useUpdateNickname();
 *
 * // Set nickname
 * await updateNickname.mutateAsync({
 *   friendId: 'user-123',
 *   nickname: 'Best Friend ❤️'
 * });
 *
 * // Reset nickname to original fullName
 * await updateNickname.mutateAsync({
 *   friendId: 'user-123',
 *   nickname: ''
 * });
 * ```
 */
export const useUpdateNickname = () => {
    const queryClient = useQueryClient();

    return useMutation<
        UpdateNicknameResponse,
        AxiosError<{ message: string }>,
        { friendId: string; nickname: string }
    >({
        mutationFn: ({ friendId, nickname }) =>
            nicknameApis.updateNickname(friendId, nickname),

        // ✅ OPTIMISTIC UPDATE: Update UI immediately before API call
        onMutate: async (variables) => {
            const { friendId, nickname } = variables;

            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ['chat', 'conversations'] });
            await queryClient.cancelQueries({ queryKey: ['conversation-detail'] });

            // Snapshot previous values for rollback
            const previousConversations = queryClient.getQueriesData({ queryKey: ['chat', 'conversations'] });
            const previousConversationDetails = queryClient.getQueriesData({ queryKey: ['conversation-detail'] });

            // ✅ Optimistically update conversation list caches
            queryClient.setQueriesData<any>({ queryKey: ['chat', 'conversations'] }, (old: any) => {
                if (!old?.results) return old;

                return {
                    ...old,
                    results: old.results.map((conv: any) => {
                        // Update if this conversation involves the friend
                        if (conv.peerUserId === friendId || conv.participants?.some((p: any) => p.userId === friendId)) {
                            return {
                                ...conv,
                                name: nickname || conv.peerDisplayName || conv.name,
                                peerDisplayName: nickname || conv.peerDisplayName,
                            };
                        }
                        return conv;
                    }),
                };
            });

            // ✅ Optimistically update conversation detail caches
            queryClient.setQueriesData<any>({ queryKey: ['conversation-detail'] }, (old: any) => {
                if (!old) return old;

                // Check if this conversation involves the friend
                if (old.peerUserId === friendId) {
                    return {
                        ...old,
                        peerDisplayName: nickname || old.peerDisplayName,
                        name: nickname || old.name,
                    };
                }
                return old;
            });

            console.log('🔄 Optimistic update applied:', { friendId, nickname: nickname || '(reset)' });

            // Return context for rollback
            return { previousConversations, previousConversationDetails };
        },

        onSuccess: (data, variables, context) => {
            // ✅ Handle both response structures
            const displayName = data.data?.displayName || data.displayName || variables.nickname || 'N/A';

            // ✅ UPDATE CACHE DIRECTLY for instant UI update with confirmed data

            // 1. Update conversation list caches with real data
            queryClient.setQueriesData<any>({ queryKey: ['chat', 'conversations'] }, (old: any) => {
                if (!old?.results) return old;

                return {
                    ...old,
                    results: old.results.map((conv: any) => {
                        if (conv.peerUserId === variables.friendId ||
                            conv.participants?.some((p: any) => p.userId === variables.friendId)) {
                            return {
                                ...conv,
                                name: displayName,
                                peerDisplayName: displayName,
                            };
                        }
                        return conv;
                    }),
                };
            });

            // 2. Update conversation detail caches
            queryClient.setQueriesData<any>({ queryKey: ['conversation-detail'] }, (old: any) => {
                if (!old) return old;

                if (old.peerUserId === variables.friendId) {
                    return {
                        ...old,
                        peerDisplayName: displayName,
                        name: displayName,
                    };
                }
                return old;
            });

            // 3. ✅ INVALIDATE queries with CORRECT KEY PATTERNS to trigger background refetch

            // Friend-related queries
            queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['friendDetail', variables.friendId] });

            // Conversation queries - use correct patterns
            // Pattern: ['chat', 'conversations', page, filter, type]
            queryClient.invalidateQueries({
                queryKey: ['chat', 'conversations'],
                refetchType: 'active', // Only refetch currently active queries
            });

            // Pattern: ['conversation-detail', conversationId]
            queryClient.invalidateQueries({
                queryKey: ['conversation-detail'],
                refetchType: 'active',
            });

            // Pattern: ['chat', 'conversation', conversationId]
            queryClient.invalidateQueries({
                queryKey: ['chat', 'conversation'],
                refetchType: 'active',
            });

            console.log('✅ Nickname updated successfully:', {
                friendId: variables.friendId,
                newDisplayName: displayName,
                isReset: variables.nickname === '',
                responseType: data.data ? 'wrapped' : 'unwrapped',
                cacheUpdated: true,
                queriesInvalidated: ['friends', 'conversations', 'conversation-detail'],
            });
        },

        onError: (error, variables, context) => {
            // ✅ ROLLBACK: Restore previous cache values on error
            if (context?.previousConversations) {
                context.previousConversations.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            if (context?.previousConversationDetails) {
                context.previousConversationDetails.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }

            console.error('❌ Failed to update nickname (rolled back):', {
                friendId: variables.friendId,
                nickname: variables.nickname,
                error: error?.response?.data?.message || error?.message || 'Unknown error',
            });
        },
    });
};
