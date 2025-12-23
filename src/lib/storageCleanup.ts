/**
 * Utility để clear localStorage khi logout
 * Giữ lại một số settings như theme để UX tốt hơn
 */

const KEYS_TO_KEEP = [
    'darkMode', // Giữ theme preference
    'ptit_chat_theme', // Giữ theme preference từ environment
    'ptit_chat_language', // Giữ language preference
];

/**
 * Clear localStorage ngoại trừ các keys được giữ lại
 */
export const clearUserDataFromStorage = (): void => {
    // Lưu các keys cần giữ lại
    const keysToKeep: { [key: string]: string | null } = {};
    KEYS_TO_KEEP.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            keysToKeep[key] = value;
        }
    });

    // Clear toàn bộ localStorage
    localStorage.clear();

    // Restore các keys đã giữ lại
    Object.entries(keysToKeep).forEach(([key, value]) => {
        if (value) {
            localStorage.setItem(key, value);
        }
    });
};

/**
 * Clear sessionStorage hoàn toàn
 */
export const clearSessionStorage = (): void => {
    sessionStorage.clear();
};

/**
 * Clear all storage (cả localStorage và sessionStorage)
 * Ngoại trừ theme/language settings
 */
export const clearAllUserStorage = (): void => {
    clearUserDataFromStorage();
    clearSessionStorage();
};

export default {
    clearUserDataFromStorage,
    clearSessionStorage,
    clearAllUserStorage,
};

