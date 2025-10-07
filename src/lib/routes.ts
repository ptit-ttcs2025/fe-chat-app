import { MenuAppType, NavigationAppType } from '@/types/app.type';

export const ROUTES = {
    // Authentication
    AUTH: {
        LOGIN: '/login',
        REGISTER: '/register',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
    },

    // Main Chat Interface
    CHAT: {
        INDEX: '/chat',
        DIRECT: '/chat/direct/:userId', // Direct messages with specific user
        GROUP: '/chat/group/:groupId', // Group chat
        NEW_CHAT: '/chat/new', // Start new conversation
        NEW_GROUP: '/chat/new-group', // Create new group
    },

    // Contacts & Friends
    CONTACTS: {
        INDEX: '/contacts',
        FRIENDS: '/contacts/friends',
        FRIEND_REQUESTS: '/contacts/requests',
        BLOCKED: '/contacts/blocked',
        SEARCH: '/contacts/search',
    },

    // Groups Management
    GROUPS: {
        INDEX: '/groups',
        CREATE: '/groups/create',
        DETAIL: '/groups/:groupId',
        SETTINGS: '/groups/:groupId/settings',
        MEMBERS: '/groups/:groupId/members',
        MEDIA: '/groups/:groupId/media', // Shared media/files
    },

    // User Profile & Settings
    PROFILE: {
        INDEX: '/profile',
        EDIT: '/profile/edit',
        SECURITY: '/profile/security',
        PRIVACY: '/profile/privacy',
        NOTIFICATIONS: '/profile/notifications',
        THEME: '/profile/theme',
    },

    // Notifications
    NOTIFICATIONS: {
        INDEX: '/notifications',
        MESSAGES: '/notifications/messages',
        FRIEND_REQUESTS: '/notifications/friend-requests',
        GROUP_INVITES: '/notifications/group-invites',
    },

    // Search
    SEARCH: {
        INDEX: '/search',
        MESSAGES: '/search/messages', // Search in message history
        USERS: '/search/users', // Find new users
        GROUPS: '/search/groups', // Find public groups
    },

    // Settings
    SETTINGS: {
        INDEX: '/settings',
        ACCOUNT: '/settings/account',
        PRIVACY: '/settings/privacy',
        SECURITY: '/settings/security',
        NOTIFICATIONS: '/settings/notifications',
        APPEARANCE: '/settings/appearance',
        DATA_STORAGE: '/settings/data-storage',
        ABOUT: '/settings/about',
    },

    // Admin Panel (Optional)
    ADMIN: {
        INDEX: '/admin',
        DASHBOARD: '/admin/dashboard',
        USERS: '/admin/users',
        GROUPS: '/admin/groups',
        REPORTS: '/admin/reports',
        SETTINGS: '/admin/settings',
    },
};

// Navigation structure cho Chat App
const BASE_NAVIGATION_APP: MenuAppType = {
    chat: {
        id: ROUTES.CHAT.INDEX,
        label: 'CHAT',
        icon: '/icons/chat/messages.svg',
        childrens: {
            all_chats: {
                id: ROUTES.CHAT.INDEX,
                label: 'Tất cả tin nhắn',
                path: ROUTES.CHAT.INDEX,
                icon: '/icons/chat/all-messages.svg',
            },
            new_chat: {
                id: ROUTES.CHAT.NEW_CHAT,
                label: 'Tin nhắn mới',
                path: ROUTES.CHAT.NEW_CHAT,
                icon: '/icons/chat/new-message.svg',
            },
        },
    },

    contacts: {
        id: ROUTES.CONTACTS.INDEX,
        label: 'DANH BẠ',
        icon: '/icons/contacts/contacts.svg',
        childrens: {
            friends: {
                id: ROUTES.CONTACTS.FRIENDS,
                label: 'Bạn bè',
                path: ROUTES.CONTACTS.FRIENDS,
                icon: '/icons/contacts/friends.svg',
            },
            friend_requests: {
                id: ROUTES.CONTACTS.FRIEND_REQUESTS,
                label: 'Lời mời kết bạn',
                path: ROUTES.CONTACTS.FRIEND_REQUESTS,
                icon: '/icons/contacts/friend-requests.svg',
            },
            blocked: {
                id: ROUTES.CONTACTS.BLOCKED,
                label: 'Đã chặn',
                path: ROUTES.CONTACTS.BLOCKED,
                icon: '/icons/contacts/blocked.svg',
            },
            search: {
                id: ROUTES.CONTACTS.SEARCH,
                label: 'Tìm bạn mới',
                path: ROUTES.CONTACTS.SEARCH,
                icon: '/icons/contacts/search.svg',
            },
        },
    },

    groups: {
        id: ROUTES.GROUPS.INDEX,
        label: 'NHÓM',
        icon: '/icons/groups/groups.svg',
        childrens: {
            my_groups: {
                id: ROUTES.GROUPS.INDEX,
                label: 'Nhóm của tôi',
                path: ROUTES.GROUPS.INDEX,
                icon: '/icons/groups/my-groups.svg',
            },
            create_group: {
                id: ROUTES.GROUPS.CREATE,
                label: 'Tạo nhóm mới',
                path: ROUTES.GROUPS.CREATE,
                icon: '/icons/groups/create-group.svg',
            },
        },
    },

    notifications: {
        id: ROUTES.NOTIFICATIONS.INDEX,
        label: 'THÔNG BÁO',
        icon: '/icons/notifications/notifications.svg',
        childrens: {
            all: {
                id: ROUTES.NOTIFICATIONS.INDEX,
                label: 'Tất cả thông báo',
                path: ROUTES.NOTIFICATIONS.INDEX,
                icon: '/icons/notifications/all.svg',
            },
            messages: {
                id: ROUTES.NOTIFICATIONS.MESSAGES,
                label: 'Tin nhắn',
                path: ROUTES.NOTIFICATIONS.MESSAGES,
                icon: '/icons/notifications/messages.svg',
            },
            friend_requests: {
                id: ROUTES.NOTIFICATIONS.FRIEND_REQUESTS,
                label: 'Lời mời kết bạn',
                path: ROUTES.NOTIFICATIONS.FRIEND_REQUESTS,
                icon: '/icons/notifications/friend-requests.svg',
            },
            group_invites: {
                id: ROUTES.NOTIFICATIONS.GROUP_INVITES,
                label: 'Lời mời nhóm',
                path: ROUTES.NOTIFICATIONS.GROUP_INVITES,
                icon: '/icons/notifications/group-invites.svg',
            },
        },
    },

    settings: {
        id: ROUTES.SETTINGS.INDEX,
        label: 'CÀI ĐẶT',
        icon: '/icons/settings/settings.svg',
        childrens: {
            account: {
                id: ROUTES.SETTINGS.ACCOUNT,
                label: 'Tài khoản',
                path: ROUTES.SETTINGS.ACCOUNT,
                icon: '/icons/settings/account.svg',
            },
            privacy: {
                id: ROUTES.SETTINGS.PRIVACY,
                label: 'Quyền riêng tư',
                path: ROUTES.SETTINGS.PRIVACY,
                icon: '/icons/settings/privacy.svg',
            },
            security: {
                id: ROUTES.SETTINGS.SECURITY,
                label: 'Bảo mật',
                path: ROUTES.SETTINGS.SECURITY,
                icon: '/icons/settings/security.svg',
            },
            notifications: {
                id: ROUTES.SETTINGS.NOTIFICATIONS,
                label: 'Thông báo',
                path: ROUTES.SETTINGS.NOTIFICATIONS,
                icon: '/icons/settings/notifications.svg',
            },
            appearance: {
                id: ROUTES.SETTINGS.APPEARANCE,
                label: 'Giao diện',
                path: ROUTES.SETTINGS.APPEARANCE,
                icon: '/icons/settings/appearance.svg',
            },
            data_storage: {
                id: ROUTES.SETTINGS.DATA_STORAGE,
                label: 'Dữ liệu & lưu trữ',
                path: ROUTES.SETTINGS.DATA_STORAGE,
                icon: '/icons/settings/storage.svg',
            },
        },
    },
};

// Function to create navigation with dynamic active chats
export const createNavigationApp = (
    activeChats?: Array<{ id: string; name: string; type: 'direct' | 'group' }>
): MenuAppType => {
    const dynamicChatChildren: Record<string, NavigationAppType> = {
        all_chats: {
            id: ROUTES.CHAT.INDEX,
            label: 'Tất cả tin nhắn',
            path: ROUTES.CHAT.INDEX,
            icon: '/icons/chat/all-messages.svg',
        },
        new_chat: {
            id: ROUTES.CHAT.NEW_CHAT,
            label: 'Tin nhắn mới',
            path: ROUTES.CHAT.NEW_CHAT,
            icon: '/icons/chat/new-message.svg',
        },
    };

    // Add pinned/recent chats to navigation
    if (activeChats && activeChats.length > 0) {
        activeChats.forEach((chat) => {
            const chatKey = `chat_${chat.id}`;
            const chatPath =
                chat.type === 'direct'
                    ? ROUTES.CHAT.DIRECT.replace(':userId', chat.id)
                    : ROUTES.CHAT.GROUP.replace(':groupId', chat.id);

            dynamicChatChildren[chatKey] = {
                id: chatPath,
                label: chat.name,
                path: chatPath,
                icon:
                    chat.type === 'direct'
                        ? '/icons/chat/user.svg'
                        : '/icons/chat/group.svg',
                isPinned: true,
            };
        });
    }

    return {
        ...BASE_NAVIGATION_APP,
        chat: {
            ...BASE_NAVIGATION_APP.chat,
            childrens: dynamicChatChildren,
        },
    };
};

// Export base navigation for backward compatibility
export const NAVIGATION_APP = BASE_NAVIGATION_APP;