/**
 * WebSocketInitializer
 * Component này khởi tạo WebSocket connection khi user đăng nhập
 * Thêm component này vào AppInitializer hoặc layout chính
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import websocketService from '@/core/services/websocket.service';
import { environment } from '../../environment.tsx';

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  token: string | null;
}

interface RootState {
  auth: AuthState;
}

const WebSocketInitializer: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    // Chỉ connect khi có token và user
    if (!token || !user?.id) {
      return;
    }

    // Get base URL (remove /api/v1 suffix if exists)
    const baseUrl = environment.apiBaseUrl.replace(/\/api\/v1$/, '');

    try {
      // Connect WebSocket
      websocketService.connect(baseUrl, token, user.id);
    } catch (error) {
      console.error('❌ WebSocket: Connection failed:', error);
    }

    // Cleanup: Disconnect khi component unmount hoặc user logout
    return () => {
      websocketService.disconnect();
    };
  }, [token, user]);

  // Component này không render gì cả
  return null;
};

export default WebSocketInitializer;

/**
 * USAGE:
 * 
 * 1. Thêm vào AppInitializer.tsx:
 * 
 * import WebSocketInitializer from '@/core/common/WebSocketInitializer';
 * 
 * export const AppInitializer = () => {
 *   return (
 *     <>
 *       <WebSocketInitializer />
 *       {// ... other initializers ...}
 *     </>
 *   );
 * };
 * 
 * 2. Hoặc thêm vào layout chính (feature.tsx):
 * 
 * import WebSocketInitializer from '@/core/common/WebSocketInitializer';
 * 
 * const Feature = () => {
 *   return (
 *     <>
 *       <WebSocketInitializer />
 *       <Header />
 *       <Outlet />
 *       <Footer />
 *     </>
 *   );
 * };
 */

