export interface IUser {
    id: string;
    username: string;
    email: string;
    fullName: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dob?: string;
    bio?: string;
    avatarUrl?: string | null;
}

export interface ISearchUserParams {
    name: string;
}

export interface ISearchUserMeta {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    sortBy: string;
    descending: boolean;
}

export interface ISearchUserData {
    meta: ISearchUserMeta;
    results: IUser[];
}

export interface ISearchUserResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    data: ISearchUserData;
}

export interface IAddFriendRequest {
    receiverId: string;
    message?: string;
}

export interface IAddFriendResponse {
    success: boolean;
    message: string;
}

// Friend (Bạn bè) - Match với backend response
export interface IFriend {
    userId: string;
    friendId: string; // ID của friend (dùng để lấy detail)
    displayName: string;
    avatarUrl: string | null;
    becameFriendsAt: string;
    isFavorite: boolean;
    lastActiveAt: string | null;
    isOnline: boolean | null;
}

export interface IFriendsResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    data: {
        meta: ISearchUserMeta;
        results: IFriend[];
    };
}

// Friend Request (Lời mời kết bạn)
export interface IFriendRequest {
    id: string;
    senderId: string;
    senderDisplayName: string;
    senderAvatarUrl: string | null;
    receiverId: string;
    receiverDisplayName: string;
    receiverAvatarUrl: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    message?: string;
    createdAt: string;
    processedAt?: string | null;
    expiresAt?: string;
}

export interface IFriendRequestsResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    data: {
        meta: ISearchUserMeta;
        results: IFriendRequest[];
    };
}

export interface IRespondFriendRequestPayload {
    requestId: string;
    action: 'ACCEPT' | 'REJECT';
}

export interface IRespondFriendRequestResponse {
    statusCode: number;
    message: string;
    data?: any;
}

// Search Friends
export interface ISearchFriendsParams {
    q: string; // Từ khóa tìm kiếm
    pageNumber?: number;
    pageSize?: number;
}

// Count Friend Requests
export interface IFriendRequestCountResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path: string;
    data: number; // Số lượng lời mời chưa đọc
}

// Delete Friend
export interface IDeleteFriendResponse {
    statusCode: number;
    message: string;
    data?: any;
}

// Friend Detail
export interface IFriendDetail {
    id: string;
    email: string;
    fullName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    dob: string | null;
    bio: string | null;
    avatarUrl: string | null;
    lastActiveAt: string | null;
    status: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

export interface IFriendDetailResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    data: IFriendDetail;
}

