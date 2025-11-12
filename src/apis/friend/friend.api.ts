import http from '@/lib/apiBase';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { 
    IUser, 
    ISearchUserParams, 
    IAddFriendRequest, 
    IAddFriendResponse,
    IFriend,
    IFriendRequest,
    IRespondFriendRequestPayload,
    IRespondFriendRequestResponse,
    ISearchFriendsParams,
    IFriendRequestCountResponse,
    IDeleteFriendResponse,
    IFriendDetail
} from './friend.type';

const URI = '/api/v1';

export const friendUri = {
    searchUsers: `${URI}/users`,
    addFriend: `${URI}/friends/requests`,
    searchFriends: `${URI}/friends/search`, // Dùng chung cho cả search và get all
    getReceivedRequests: `${URI}/friends/requests/received`,
    getSentRequests: `${URI}/friends/requests/sent`,
    getRequestCount: `${URI}/friends/requests/count`,
    respondRequest: (requestId: string, action: string) => `${URI}/friends/requests/${requestId}/${action.toLowerCase()}`,
    deleteFriend: (friendId: string) => `${URI}/friends/${friendId}`,
    getFriendDetail: (friendId: string) => `${URI}/friends/${friendId}`,
};

export const friendApis = {
    /**
     * Search users by name
     */
    searchUsers: async (params: ISearchUserParams): Promise<IUser[]> => {
        const response = await http.get(friendUri.searchUsers, {
            params: { name: params.name }
        }) as any;
        // Response sau interceptor: { statusCode, message, timestamp, path, data: { meta, results } }
        return response.data?.results || [];
    },

    /**
     * Send friend request
     */
    addFriend: async (payload: IAddFriendRequest): Promise<IAddFriendResponse> => {
        const response = await http.post<IAddFriendResponse>(friendUri.addFriend, payload);
        return response.data;
    },

    /**
     * Get received friend requests
     */
    getReceivedRequests: async (page: number = 0, size: number = 50): Promise<IFriendRequest[]> => {
        const response = await http.get(friendUri.getReceivedRequests, {
            params: { page, size }
        }) as any;
        // Response sau interceptor: { statusCode, message, timestamp, data: { meta, results } }
        return response.data?.results || [];
    },

    /**
     * Get sent friend requests
     */
    getSentRequests: async (page: number = 0, size: number = 50): Promise<IFriendRequest[]> => {
        const response = await http.get(friendUri.getSentRequests, {
            params: { page, size }
        }) as any;
        // Response sau interceptor: { statusCode, message, timestamp, data: { meta, results } }
        return response.data?.results || [];
    },

    /**
     * Accept or Reject friend request
     */
    respondFriendRequest: async (payload: IRespondFriendRequestPayload): Promise<IRespondFriendRequestResponse> => {
        const response = await http.post<IRespondFriendRequestResponse>(
            friendUri.respondRequest(payload.requestId, payload.action)
        );
        return response.data;
    },

    /**
     * Search friends by name (q rỗng = lấy tất cả)
     */
    searchFriends: async (params: ISearchFriendsParams): Promise<IFriend[]> => {
        const response = await http.get(friendUri.searchFriends, {
            params: {
                q: params.q || '', // q rỗng = lấy tất cả
                pageNumber: params.pageNumber || 0,
                pageSize: params.pageSize || 50
            }
        }) as any;
        // Response sau interceptor: { statusCode, message, timestamp, data: { meta, results } }
        return response.data?.results || [];
    },

    /**
     * Get friend requests count (unread)
     */
    getRequestCount: async (): Promise<number> => {
        try {
            const response = await http.get<IFriendRequestCountResponse>(friendUri.getRequestCount);
            console.log('response', response.data);
            return response.data.data || 0; // Fallback to 0 if undefined
        } catch (error) {
            console.error('Error fetching request count:', error);
            return 0; // Return 0 on error
        }
    },

    /**
     * Delete friend (unfriend)
     */
    deleteFriend: async (friendId: string): Promise<IDeleteFriendResponse> => {
        const response = await http.delete<IDeleteFriendResponse>(friendUri.deleteFriend(friendId));
        return response.data;
    },

    /**
     * Get friend detail
     */
    getFriendDetail: async (friendId: string): Promise<IFriendDetail> => {
        const response = await http.get(friendUri.getFriendDetail(friendId)) as any;
        // Response sau interceptor: { statusCode, message, timestamp, data: { ... } }
        return response.data;
    },
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook search users
 */
export const useSearchUsers = (name: string, enabled: boolean = false) => {
    return useQuery<IUser[], AxiosError>({
        queryKey: ['searchUsers', name],
        queryFn: () => friendApis.searchUsers({ name }),
        enabled: enabled && name.length > 0,
        retry: false,
    });
};

/**
 * Hook add friend
 */
export const useAddFriend = () => {
    return useMutation<IAddFriendResponse, AxiosError<{message: string}>, IAddFriendRequest>({
        mutationFn: friendApis.addFriend,
    });
};

/**
 * Hook get friends list (sử dụng search với q rỗng)
 */
export const useGetFriends = (page: number = 0, size: number = 50) => {
    return useQuery<IFriend[], AxiosError>({
        queryKey: ['friends', page, size],
        queryFn: () => friendApis.searchFriends({ q: '', pageNumber: page, pageSize: size }),
        retry: false,
    });
};

/**
 * Hook get received friend requests
 */
export const useGetReceivedRequests = (page: number = 0, size: number = 50) => {
    return useQuery<IFriendRequest[], AxiosError>({
        queryKey: ['friendRequests', 'received', page, size],
        queryFn: () => friendApis.getReceivedRequests(page, size),
        retry: false,
    });
};

/**
 * Hook get sent friend requests
 */
export const useGetSentRequests = (page: number = 0, size: number = 50) => {
    return useQuery<IFriendRequest[], AxiosError>({
        queryKey: ['friendRequests', 'sent', page, size],
        queryFn: () => friendApis.getSentRequests(page, size),
        retry: false,
    });
};

/**
 * Hook respond to friend request
 */
export const useRespondFriendRequest = () => {
    return useMutation<IRespondFriendRequestResponse, AxiosError<{message: string}>, IRespondFriendRequestPayload>({
        mutationFn: friendApis.respondFriendRequest,
    });
};

/**
 * Hook search friends
 */
export const useSearchFriends = (params: ISearchFriendsParams, enabled: boolean = true) => {
    return useQuery<IFriend[], AxiosError>({
        queryKey: ['searchFriends', params.q, params.pageNumber, params.pageSize],
        queryFn: () => friendApis.searchFriends(params),
        enabled: enabled,
        retry: false,
    });
};

/**
 * Hook get friend requests count
 */
export const useGetRequestCount = () => {
    return useQuery<number, AxiosError>({
        queryKey: ['friendRequestCount'],
        queryFn: friendApis.getRequestCount,
        retry: false,
        refetchInterval: 30000, // Auto refresh mỗi 30s
        initialData: 0, // Khởi tạo với giá trị 0 để tránh undefined
    });
};

/**
 * Hook delete friend
 */
export const useDeleteFriend = () => {
    return useMutation<IDeleteFriendResponse, AxiosError<{message: string}>, string>({
        mutationFn: friendApis.deleteFriend,
    });
};

/**
 * Hook get friend detail
 */
export const useGetFriendDetail = (friendId: string, enabled: boolean = true) => {
    return useQuery<IFriendDetail, AxiosError>({
        queryKey: ['friendDetail', friendId],
        queryFn: () => friendApis.getFriendDetail(friendId),
        enabled: enabled && !!friendId,
        retry: false,
    });
};

