/**
 * Cookie Helper Utilities - Simplified
 * Quản lý việc lưu trữ và đọc cookies an toàn
 */

export interface CookieOptions {
    expires?: number | Date; // Số ngày hoặc Date object
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export const cookieHelper = {
    /**
     * Lưu cookie
     */
    set(name: string, value: string, options: CookieOptions = {}): void {
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        // Xử lý expires
        if (options.expires) {
            const expires =
                typeof options.expires === 'number'
                    ? new Date(Date.now() + options.expires * 864e5) // Chuyển số ngày sang ms
                    : options.expires;
            cookieString += `; expires=${expires.toUTCString()}`;
        }

        // Path (mặc định là root)
        cookieString += `; path=${options.path || '/'}`;

        // Domain
        if (options.domain) {
            cookieString += `; domain=${options.domain}`;
        }

        // Secure - CHỈ set khi yêu cầu VÀ đang ở HTTPS
        if (options.secure && window.location.protocol === 'https:') {
            cookieString += '; secure';
        }

        // SameSite
        cookieString += `; SameSite=${options.sameSite || 'Lax'}`;

        document.cookie = cookieString;
        
        console.log(`🍪 Set cookie: ${name}, value length: ${value.length}, expires: ${options.expires || 'session'}`);
    },

    /**
     * Lấy cookie
     */
    get(name: string): string | null {
        const nameEQ = encodeURIComponent(name) + '=';
        const cookies = document.cookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(nameEQ)) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }

        return null;
    },

    /**
     * Xóa cookie - Method đơn giản nhất
     */
    remove(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
        console.log(`🗑️ Attempting to remove cookie: ${name}`);
        
        const path = options.path || '/';
        
        // Method 1: Set empty value với max-age
        document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
        
        // Method 2: Set empty value với expires trong quá khứ (backup)
        document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        // Method 3: Thử xóa với domain nếu có
        if (options.domain) {
            document.cookie = `${encodeURIComponent(name)}=; path=${path}; domain=${options.domain}; max-age=0`;
        }
        
        // Verify
        setTimeout(() => {
            const stillExists = this.get(name);
            if (stillExists) {
                console.error(`❌ FAILED to remove cookie: ${name}`, {
                    value: stillExists,
                    allCookies: document.cookie
                });
            } else {
                console.log(`✅ Successfully removed cookie: ${name}`);
            }
        }, 100);
    },

    /**
     * Kiểm tra cookie có tồn tại không
     */
    exists(name: string): boolean {
        return this.get(name) !== null;
    },

    /**
     * Xóa tất cả cookies
     */
    removeAll(path: string = '/'): void {
        const cookies = document.cookie.split(';');

        for (const cookie of cookies) {
            const name = cookie.split('=')[0].trim();
            this.remove(name, { path });
        }
    },
};

export default cookieHelper;