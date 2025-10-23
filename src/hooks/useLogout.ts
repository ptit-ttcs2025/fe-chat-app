import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout as logoutAction } from '@/slices/auth/reducer';
import { resetCommonState } from '@/core/data/redux/commonSlice';
import { all_routes } from '@/feature-module/router/all_routes';
import WebSocketService from '@/core/services/websocket.service';
import { clearAllUserStorage } from '@/lib/storageCleanup';

/**
 * Hook xử lý logout - Clear TOÀN BỘ state và cache
 * 
 * Các bước thực hiện:
 * 1. Disconnect WebSocket
 * 2. Clear Redux state (auth + common)
 * 3. Clear localStorage/sessionStorage (giữ theme settings)
 * 4. Clear React Query cache
 * 5. Navigate về trang login
 */
export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleLogout = useCallback(async () => {
        try {
            console.log('🚪 Starting logout process...');

            // 1. Disconnect WebSocket trước
            WebSocketService.disconnect();
            console.log('✅ WebSocket disconnected');

            // 2. Clear Redux state
            // 2a. Clear auth state (tokens, user info)
            dispatch(logoutAction());
            
            // 2b. Clear common state (UI settings, sidebar, etc.)
            dispatch(resetCommonState());
            console.log('✅ Redux state cleared');

            // 3. Clear localStorage và sessionStorage
            // (Giữ lại theme và language settings)
            clearAllUserStorage();
            console.log('✅ Storage cleared');

            // 4. Clear React Query cache
            // Reset toàn bộ cache để không còn data cũ
            queryClient.clear();
            console.log('✅ React Query cache cleared');

            // 5. Navigate về trang login
            navigate(all_routes.signin, { replace: true });

            console.log('✅ Đăng xuất thành công - Tất cả state đã được xóa');
        } catch (error) {
            console.error('❌ Lỗi khi đăng xuất:', error);
            
            // Vẫn logout ngay cả khi có lỗi
            try {
                dispatch(logoutAction());
                dispatch(resetCommonState());
                clearAllUserStorage();
                queryClient.clear();
            } catch (cleanupError) {
                console.error('❌ Lỗi khi cleanup:', cleanupError);
            }
            
            navigate(all_routes.signin, { replace: true });
        }
    }, [dispatch, navigate, queryClient]);

    return { handleLogout };
};