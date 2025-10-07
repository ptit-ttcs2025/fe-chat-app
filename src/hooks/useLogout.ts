// src/lib/hooks/useLogout.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '@/slices/auth/reducer';
import { all_routes } from '@/feature-module/router/all_routes';
import WebSocketService from '@/core/services/websocket.service';

export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        try {
            // 1. Disconnect WebSocket
            WebSocketService.disconnect();

            // 2. Clear Redux state
            dispatch(logoutAction());

            // 3. Navigate to login page
            navigate(all_routes.signin, { replace: true });

            // Optional: Show success message
            console.log('Đăng xuất thành công');
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    }, [dispatch, navigate]);

    return { handleLogout };
};
