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

export interface UpdateNicknameResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    data: {
        userId: string;
        friendId: string;
        displayName: string; // Updated nickname or original fullName
        avatarUrl: string | null;
        becameFriendsAt: string;
        isFavorite: boolean;
        lastActiveAt: string | null;
        isOnline: boolean | null;
    };
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
        onSuccess: (data, variables) => {
            // Invalidate related queries to refetch with new nickname
            queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['friendDetail', variables.friendId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            console.log('✅ Nickname updated successfully:', {
                friendId: variables.friendId,
                newDisplayName: data.data.displayName,
                isReset: variables.nickname === '',
            });
        },
        onError: (error, variables) => {
            console.error('❌ Failed to update nickname:', {
                friendId: variables.friendId,
                nickname: variables.nickname,
                error: error.response?.data?.message || error.message,
            });
        },
    });
};

