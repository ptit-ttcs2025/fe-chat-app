import http from '@/lib/apiBase';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { 
    INotification, 
    IUnreadCountResponse,
    IMarkAsReadResponse,
    IDeleteNotificationResponse
} from './notification.type';

const URI = ''; // ✅ baseURL đã có /api/v1 rồi

export const notificationUri = {
    getNotifications: `${URI}/notifications`,
    getUnreadCount: `${URI}/notifications/unread-count`,
    markAsRead: (notificationId: string) => `${URI}/notifications/${notificationId}/read`,
    markAllAsRead: `${URI}/notifications/mark-all-read`,
    deleteNotification: (notificationId: string) => `${URI}/notifications/${notificationId}`,
};

export const notificationApis = {
    /**
     * Get notifications list
     */
    getNotifications: async (page: number = 0, size: number = 20): Promise<INotification[]> => {
        const response = await http.get(notificationUri.getNotifications, {
            params: { page, size }
        }) as any;

        const rawResults = response?.data?.results || [];

        // Chuẩn hóa dữ liệu theo INotification dựa trên API_DOCUMENTATION & ví dụ JSON
        const mapped: INotification[] = rawResults.map((item: any) => {
            const senderAvatarUrl =
                item.senderAvatarUrl === 'null' ? null : item.senderAvatarUrl;

            return {
                id: item.id,
                userId: item.recipientId ?? item.userId ?? '',
                type: item.type,
                title: item.title,
                content: item.content,
                isSeen: item.isSeen ?? item.isRead ?? false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,

                // Friend request specific mapping
                requestId: item.requestId,
                recipientId: item.recipientId,
                senderId: item.senderId,
                senderName: item.senderName,
                senderDisplayName: item.senderName,
                senderAvatarUrl,
                relatedId: item.relatedId,
                message: item.message,
            };
        });

        return mapped;
    },

    /**
     * Get unread notifications count
     */
    getUnreadCount: async (): Promise<number> => {
        try {
            const response = await http.get<IUnreadCountResponse>(notificationUri.getUnreadCount);
            return response.data.data || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId: string): Promise<IMarkAsReadResponse> => {
        const response = await http.put<IMarkAsReadResponse>(
            notificationUri.markAsRead(notificationId)
        );
        return response.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<IMarkAsReadResponse> => {
        const response = await http.put<IMarkAsReadResponse>(
            notificationUri.markAllAsRead
        );
        return response.data;
    },

    /**
     * Delete notification
     */
    deleteNotification: async (notificationId: string): Promise<IDeleteNotificationResponse> => {
        const response = await http.delete<IDeleteNotificationResponse>(
            notificationUri.deleteNotification(notificationId)
        );
        return response.data;
    },
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook get notifications
 */
export const useGetNotifications = (page: number = 0, size: number = 20) => {
    return useQuery<INotification[], AxiosError>({
        queryKey: ['notifications', page, size],
        queryFn: () => notificationApis.getNotifications(page, size),
        retry: false,
        refetchInterval: 30000, // Auto refresh every 30s
    });
};

/**
 * Hook get unread count
 */
export const useGetUnreadCount = () => {
    return useQuery<number, AxiosError>({
        queryKey: ['notificationUnreadCount'],
        queryFn: notificationApis.getUnreadCount,
        retry: false,
        refetchInterval: 30000, // Auto refresh every 30s
        initialData: 0,
    });
};

/**
 * Hook mark notification as read
 */
export const useMarkAsRead = () => {
    return useMutation<IMarkAsReadResponse, AxiosError<{message: string}>, string>({
        mutationFn: notificationApis.markAsRead,
    });
};

/**
 * Hook mark all as read
 */
export const useMarkAllAsRead = () => {
    return useMutation<IMarkAsReadResponse, AxiosError<{message: string}>, void>({
        mutationFn: notificationApis.markAllAsRead,
    });
};

/**
 * Hook delete notification
 */
export const useDeleteNotification = () => {
    return useMutation<IDeleteNotificationResponse, AxiosError<{message: string}>, string>({
        mutationFn: notificationApis.deleteNotification,
    });
};

