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

    // ✅ Sử dụng environment.wsUrl thay vì tính toán từ apiBaseUrl
    // wsUrl đã có đầy đủ protocol và path: ws://... hoặc wss://...
    // Cần bỏ /ws suffix vì websocket.service.ts sẽ tự thêm /ws
    const baseUrl = environment.wsUrl.replace(/\/ws$/, '');

    console.log('🔗 WebSocket connecting to:', baseUrl);

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

