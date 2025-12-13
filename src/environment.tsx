/**
 * Environment Configuration
 * Centralized configuration cho toàn bộ application
 * Sử dụng Vite environment variables với fallback values
 */

// ===========================
// PATH CONFIGURATION (từ template cũ)
// ===========================
export const base_path = '/'; // Ví dụ: '/react/template/'
export const img_path = '/src/';

// ===========================
// MAIN ENVIRONMENT OBJECT
// ===========================
export const environment = {
    // Production flag
    production: import.meta.env.PROD,

    // ===========================
    // API & WebSocket URLs
    // ===========================
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1/ws',

    // Image serving URL (có thể từ CDN hoặc local)
    imageURL: import.meta.env.VITE_IMAGE_URL || '/assets/img/',

    // ===========================
    // APP CONFIGURATION
    // ===========================
    app: {
        name: 'PTIT Chat',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        defaultLanguage: 'vi',
        supportedLanguages: ['vi', 'en'] as const,
    },

    // ===========================
    // API CLIENT SETTINGS
    // ===========================
    api: {
        timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // 30 seconds
        retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
        retryDelay: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000, // 1 second
    },

    // ===========================
    // CHAT CONFIGURATION
    // ===========================
    chat: {
        // Pagination
        messagePageSize: 20,
        conversationPageSize: 15,

        // Timeouts
        typingTimeout: 1000, // 1 second
        messageRetryTimeout: 3000, // 3 seconds

        // File Upload
        fileUploadMaxSize: 10 * 1024 * 1024, // 10MB
        supportedImageTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ] as const,
        supportedFileTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ] as const,

        // Message Features
        maxMessageLength: 5000,
        enableMessageEditing: true,
        messageEditTimeout: 15 * 60 * 1000, // 15 minutes
    },

    // ===========================
    // WEBSOCKET CONFIGURATION
    // ===========================
    websocket: {
        reconnectInterval: 1000, // 1 second
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000, // 30 seconds
        connectionTimeout: 10000, // 10 seconds

        // Event types
        events: {
            connect: 'connect',
            disconnect: 'disconnect',
            error: 'error',
            message: 'message',
            typing: 'typing',
            read: 'read',
            delivered: 'delivered',
        } as const,
    },

    // ===========================
    // LOCAL STORAGE KEYS
    // ===========================
    storage: {
        // Authentication
        authToken: 'ptit_chat_token',
        refreshToken: 'ptit_chat_refresh_token',

        // User Data
        userPreferences: 'ptit_chat_preferences',
        userProfile: 'ptit_chat_user',

        // Chat State
        draftMessages: 'ptit_chat_drafts',
        pinnedConversations: 'ptit_chat_pinned',

        // UI State
        themeMode: 'ptit_chat_theme',
        sidebarCollapsed: 'ptit_chat_sidebar',
        language: 'ptit_chat_language',
    },

    // ===========================
    // FEATURE FLAGS
    // ===========================
    features: {
        // Core Features
        voiceMessages: import.meta.env.VITE_FEATURE_VOICE_MESSAGES === 'true',
        videoCalls: import.meta.env.VITE_FEATURE_VIDEO_CALLS === 'true',
        fileSharing: import.meta.env.VITE_FEATURE_FILE_SHARING !== 'false',

        // Message Features
        messageReactions: import.meta.env.VITE_FEATURE_MESSAGE_REACTIONS === 'true',
        messageEditing: import.meta.env.VITE_FEATURE_MESSAGE_EDITING !== 'false',
        messageForwarding: import.meta.env.VITE_FEATURE_MESSAGE_FORWARDING !== 'false',

        // UI Features
        darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
        notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== 'false',

        // Group Features
        groupChat: import.meta.env.VITE_FEATURE_GROUP_CHAT !== 'false',
        groupAdmin: import.meta.env.VITE_FEATURE_GROUP_ADMIN === 'true',
    },

    // ===========================
    // DEVELOPMENT SETTINGS
    // ===========================
    development: {
        enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
        enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE === 'true',
        useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
        logLevel: (import.meta.env.VITE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    },

    // ===========================
    // PERFORMANCE SETTINGS
    // ===========================
    performance: {
        // Message List Virtualization
        enableVirtualization: true,
        virtualizedItemHeight: 80,
        virtualizedOverscan: 5,

        // Lazy Loading
        imageLazyLoadThreshold: 0.5,
        componentLazyLoadDelay: 300,

        // Cache
        cacheTime: 5 * 60 * 1000, // 5 minutes
        staleTime: 1 * 60 * 1000, // 1 minute
    },

    // ===========================
    // SECURITY SETTINGS
    // ===========================
    security: {
        // Token refresh
        tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry

        // Session
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        extendSessionOnActivity: true,

        // Rate Limiting
        maxRequestsPerMinute: 60,
    },
};

// ===========================
// TYPE EXPORTS
// ===========================
export type Environment = typeof environment;
export type StorageKeys = keyof typeof environment.storage;
export type FeatureFlags = keyof typeof environment.features;
export type WebSocketEvents = typeof environment.websocket.events[keyof typeof environment.websocket.events];

// ===========================
// VALIDATION
// ===========================
const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_WS_URL',
] as const;

// Validate required environment variables
requiredEnvVars.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
        console.warn(`⚠️ Missing required environment variable: ${envVar}`);

        if (environment.production) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
});

// ===========================
// HELPER FUNCTIONS
// ===========================
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = environment.apiBaseUrl.endsWith('/')
        ? environment.apiBaseUrl.slice(0, -1)
        : environment.apiBaseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
};

export const getWsUrl = (): string => {
    return environment.wsUrl;
};

export const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';

    // If already full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const baseUrl = environment.imageURL.endsWith('/')
        ? environment.imageURL.slice(0, -1)
        : environment.imageURL;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
};

export const isFeatureEnabled = (feature: FeatureFlags): boolean => {
    return environment.features[feature] || false;
};

export const getStorageKey = (key: StorageKeys): string => {
    return environment.storage[key];
};

// ===========================
// LOGGING UTILITY
// ===========================
export const log = {
    debug: (...args: any[]) => {
        if (environment.development.enableLogging &&
            environment.development.logLevel === 'debug') {
            console.log('[DEBUG]', ...args);
        }
    },
    info: (...args: any[]) => {
        if (environment.development.enableLogging) {
            console.info('[INFO]', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (environment.development.enableLogging) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
    },
};

export default environment;
