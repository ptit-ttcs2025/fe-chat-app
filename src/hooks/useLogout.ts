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
            // 1. Disconnect WebSocket trước
            WebSocketService.disconnect();

            // 2. Clear Redux state
            // 2a. Clear auth state (tokens, user info)
            dispatch(logoutAction());
            
            // 2b. Clear common state (UI settings, sidebar, etc.)
            dispatch(resetCommonState());

            // 3. Clear localStorage và sessionStorage
            // (Giữ lại theme và language settings)
            clearAllUserStorage();

            // 4. Clear React Query cache
            // Reset toàn bộ cache để không còn data cũ
            queryClient.clear();
            // Cancel all ongoing queries to prevent them from making API calls after logout
            queryClient.cancelQueries();

            // 5. Navigate về trang login
            // Use replace: true to prevent back navigation
            navigate(all_routes.signin, { replace: true });
        } catch (error) {
            console.error('❌ Lỗi khi đăng xuất:', error);
            
            // Vẫn logout ngay cả khi có lỗi
            try {
                dispatch(logoutAction());
                dispatch(resetCommonState());
                clearAllUserStorage();
                queryClient.clear();
                queryClient.cancelQueries();
            } catch (cleanupError) {
                console.error('❌ Lỗi khi cleanup:', cleanupError);
            }
            
            navigate(all_routes.signin, { replace: true });
        }
    }, [dispatch, navigate, queryClient]);

    return { handleLogout };
};