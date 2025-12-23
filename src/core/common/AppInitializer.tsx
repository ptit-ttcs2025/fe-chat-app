import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { rehydrateAuth, setCredentials } from '@/slices/auth/reducer';
import { setDark } from '@/core/data/redux/commonSlice';
import authStorage from '@/lib/authStorage';
import { authApis } from '@/apis/auth/auth.api';
import websocketService from '@/core/services/websocket.service';
import { RootState } from '@/store/store';
import { environment } from '../../environment';

/**
 * Component này chạy khi app khởi động
 * Nhiệm vụ: 
 * - Rehydrate auth state từ cookies + sessionStorage
 * - Nếu có token nhưng không có user → Tự động fetch user từ API
 * - Kết nối WebSocket khi user đã đăng nhập
 * - Khôi phục dark mode từ localStorage
 */
export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();
    const { user, accessToken } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const initializeAuth = async () => {
            // ✅ Rehydrate auth state từ cookies + sessionStorage
            dispatch(rehydrateAuth());
            
            // ✅ Khôi phục dark mode từ localStorage
            const darkMode = localStorage.getItem("darkMode");
            if (darkMode === "enabled") {
                dispatch(setDark(true));
            } else {
                dispatch(setDark(false));
            }

            // ✅ Kiểm tra: Nếu có token nhưng không có user → Fetch từ API
            const accessToken = authStorage.getAccessToken();
            const user = authStorage.getUser();
            
            if (accessToken && !user) {
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
                } catch (error) {
                    console.error('❌ Failed to fetch user - Clearing invalid token');
                    // Token không hợp lệ → Xóa toàn bộ
                    authStorage.clearAuthData();
                }
            }
            
        };
        
        initializeAuth();
    }, [dispatch]);

    // ✅ Kết nối WebSocket khi user đã đăng nhập
    useEffect(() => {
        if (user && accessToken) {
            const wsUrl = environment.wsUrl;
            websocketService.connect(wsUrl, accessToken, user.id);
        } else {
            // Disconnect nếu user đăng xuất
            if (websocketService.getConnectionStatus()) {
                websocketService.disconnect();
            }
        }

        // Cleanup: disconnect khi component unmount hoặc user change
        return () => {
            // Không disconnect tự động vì có thể là hot-reload
            // WebSocket sẽ tự disconnect khi logout
        };
    }, [user, accessToken]);

    return <>{children}</>;
};

export default AppInitializer;

