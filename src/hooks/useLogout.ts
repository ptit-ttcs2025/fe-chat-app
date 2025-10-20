import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '@/slices/auth/reducer';
import { all_routes } from '@/feature-module/router/all_routes';
import WebSocketService from '@/core/services/websocket.service';

/**
 * Hook xử lý logout
 * - Disconnect WebSocket
 * - Clear cookies và sessionStorage (thông qua logout action)
 * - Navigate về trang login
 */
export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        try {
            // 1. Disconnect WebSocket trước
            WebSocketService.disconnect();

            // 2. Dispatch logout action
            // Action này sẽ tự động xóa:
            // - Tokens khỏi cookies (thông qua tokenManager)
            // - User info khỏi sessionStorage
            // - Clear Redux state
            dispatch(logoutAction());

            // 3. Navigate về trang login
            navigate(all_routes.signin, { replace: true });

            console.log('✅ Đăng xuất thành công');
        } catch (error) {
            console.error('❌ Lỗi khi đăng xuất:', error);
            // Vẫn logout ngay cả khi có lỗi
            dispatch(logoutAction());
            navigate(all_routes.signin, { replace: true });
        }
    }, [dispatch, navigate]);

    return { handleLogout };
};