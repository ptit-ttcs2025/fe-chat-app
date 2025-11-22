export type NotificationType = 
    | 'FRIEND_REQUEST' 
    | 'FRIEND_REQUEST_ACCEPTED' 
    | 'FRIEND_REQUEST_REJECTED'
    | 'NEW_MESSAGE'
    | 'SYSTEM';

export interface INotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    isSeen: boolean;
    createdAt: string;
    // Friend request specific fields
    requestId?: string;
    senderDisplayName?: string;
    senderAvatarUrl?: string | null;
    senderId?: string;
    message?: string;
    // Accepted/Rejected specific fields
    acceptorDisplayName?: string;
    acceptedAt?: string;
    rejectorName?: string;
    rejectedAt?: string;
}

export interface INotificationMeta {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface INotificationsResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    data: {
        meta: INotificationMeta;
        results: INotification[];
    };
}

export interface IUnreadCountResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    data: number;
}

export interface IMarkAsReadResponse {
    statusCode: number;
    message: string;
    data?: any;
}

export interface IDeleteNotificationResponse {
    statusCode: number;
    message: string;
    data?: any;
}

