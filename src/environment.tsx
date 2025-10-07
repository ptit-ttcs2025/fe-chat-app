export const base_path ='/react/template'
export const img_path ='/react/template/src/'

export const environment = {
    production: import.meta.env.PROD,

    // API Configuration
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
    wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:8080/api/v1/ws',
    websocketUrl: import.meta.env.VITE_WS_URL,
    imageURL: import.meta.env.VITE_IMAGE_URL || "/assets/img/",

    // App Configuration
    app: {
        name: 'PTIT Chat',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        defaultLanguage: 'vi',
        supportedLanguages: ['vi', 'en'],
    },

    // API Settings
    api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
    },

    // Chat Configuration
    chat: {
        messagePageSize: 20,
        typingTimeout: 1000,
        reconnectAttempts: 5,
        fileUploadMaxSize: 10 * 1024 * 1024, // 10MB
        supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        supportedFileTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ],
    },

    // WebSocket Configuration
    websocket: {
        reconnectInterval: 1000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
    },

    // Storage Keys
    storage: {
        authToken: 'ptit_chat_token',
        refreshToken: 'ptit_chat_refresh_token',
        userPreferences: 'ptit_chat_preferences',
        draftMessages: 'ptit_chat_drafts',
        themeMode: 'ptit_chat_theme',
    },

    // Feature Flags
    features: {
        voiceMessages: import.meta.env.VITE_FEATURE_VOICE_MESSAGES === 'true',
        videoCalls: import.meta.env.VITE_FEATURE_VIDEO_CALLS === 'true',
        fileSharing: import.meta.env.VITE_FEATURE_FILE_SHARING !== 'false',
        messageReactions: import.meta.env.VITE_FEATURE_MESSAGE_REACTIONS === 'true',
        messageEditing: import.meta.env.VITE_FEATURE_MESSAGE_EDITING === 'true',
        darkMode: import.meta.env.VITE_FEATURE_DARK_MODE !== 'false',
    },

    // Development Settings
    development: {
        enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
        enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE === 'true',
        useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    },
};

export type Environment = typeof environment;

// Validate required environment variables
const requiredEnvVars = ['VITE_API_BASE_URL'];

requiredEnvVars.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
        console.warn(`⚠️ Missing environment variable: ${envVar}`);
    }
});

export default environment;
