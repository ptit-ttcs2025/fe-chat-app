import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { rehydrateAuth, setCredentials } from '@/slices/auth/reducer';
import authStorage from '@/lib/authStorage';
import { authApis } from '@/apis/auth/auth.api';

/**
 * Component này chạy khi app khởi động
 * Nhiệm vụ: Rehydrate auth state từ cookies + sessionStorage
 * Nếu có token nhưng không có user → Tự động fetch user từ API
 */
export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeAuth = async () => {
            console.log('🚀 AppInitializer mounted - Starting auth rehydration...');
            
            // ✅ Rehydrate auth state từ cookies + sessionStorage
            dispatch(rehydrateAuth());
            
            // ✅ Kiểm tra: Nếu có token nhưng không có user → Fetch từ API
            const accessToken = authStorage.getAccessToken();
            const user = authStorage.getUser();
            
            if (accessToken && !user) {
                console.log('⚠️ Has token but no user - Fetching user from API...');
                
                try {
                    // Gọi API để lấy user info
                    const userInfo = await authApis.me();
                    const refreshToken = authStorage.getRefreshToken();
                    
                    // Lưu lại toàn bộ auth data
                    dispatch(setCredentials({
                        user: userInfo,
                        accessToken,
                        refreshToken: refreshToken || '',
                    }));
                    
                    console.log('✅ User fetched and auth restored:', userInfo.username);
                } catch (error) {
                    console.error('❌ Failed to fetch user - Clearing invalid token');
                    // Token không hợp lệ → Xóa toàn bộ
                    authStorage.clearAuthData();
                }
            }
            
            console.log('✅ AppInitializer completed');
        };
        
        initializeAuth();
    }, [dispatch]);

    return <>{children}</>;
};

export default AppInitializer;

