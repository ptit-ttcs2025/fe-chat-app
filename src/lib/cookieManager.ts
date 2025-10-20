/**
 * Cookie Manager - Simple & Reliable
 * Không dùng secure flag, không dùng sameSite phức tạp
 * Chỉ focus vào set, get, remove đơn giản nhất
 */

export const cookieManager = {
    /**
     * Set cookie - Cách đơn giản nhất
     */
    set(name: string, value: string, days: number = 7): void {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;
        
        // ✅ Cách đơn giản nhất - KHÔNG dùng secure, KHÔNG dùng sameSite phức tạp
        document.cookie = `${name}=${value}; ${expires}; path=/`;
        
        console.log(`✅ Cookie set: ${name}`);
        console.log(`📋 All cookies now:`, document.cookie);
        
        // Verify ngay lập tức
        const check = this.get(name);
        if (!check) {
            console.error(`❌ FAILED to set cookie: ${name}`);
            console.error(`Browser may be blocking cookies. Check settings.`);
        }
    },

    /**
     * Get cookie
     */
    get(name: string): string | null {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    },

    /**
     * Remove cookie - Cách đơn giản nhất
     */
    remove(name: string): void {
        console.log(`🗑️ Removing cookie: ${name}`);
        console.log(`📋 Before remove:`, document.cookie);
        
        // ✅ Cách 1: Set expires về quá khứ
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        
        // ✅ Cách 2: Set max-age = 0
        document.cookie = `${name}=; max-age=0; path=/`;
        
        // ✅ Cách 3: Set empty value
        document.cookie = `${name}=; path=/`;
        
        console.log(`📋 After remove:`, document.cookie);
        
        // Verify
        const check = this.get(name);
        if (check) {
            console.error(`❌ Cookie still exists: ${name} = ${check}`);
            console.error(`This may be a browser issue or cookie protection.`);
        } else {
            console.log(`✅ Cookie removed successfully: ${name}`);
        }
    },

    /**
     * Clear all cookies
     */
    clearAll(): void {
        console.log(`🗑️ Clearing ALL cookies...`);
        const cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            if (name) {
                this.remove(name);
            }
        }
        
        console.log(`📋 Cookies after clear all:`, document.cookie);
    },

    /**
     * Check if cookie exists
     */
    exists(name: string): boolean {
        return this.get(name) !== null;
    },
};

export default cookieManager;

