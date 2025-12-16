/**
 * WebSocket Connection Test Utility
 * Dùng để debug và test WebSocket connection
 * 
 * Cách sử dụng trong Console:
 * 1. Mở Console (F12)
 * 2. Gọi: testWebSocketConnection()
 */

import { environment } from '@/environment';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const testWebSocketConnection = () => {
    console.log('🧪 ===== WebSocket Connection Test =====');
    console.log('');
    
    // Step 1: Kiểm tra environment
    console.log('📋 Step 1: Checking Environment Variables');
    console.log('   - API Base URL:', environment.apiBaseUrl);
    console.log('   - WS URL (Original):', environment.wsUrl);
    
    // Step 2: Kiểm tra URL conversion
    const httpUrl = environment.wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
    console.log('   - WS URL (Converted):', httpUrl);
    
    if (environment.wsUrl.startsWith('wss://') || environment.wsUrl.startsWith('ws://')) {
        console.warn('⚠️  WARNING: WS URL đang dùng ws:// hoặc wss://');
        console.warn('⚠️  Nên đổi thành https:// hoặc http:// cho SockJS');
    } else {
        console.log('✅ WS URL đúng format (http/https)');
    }
    console.log('');
    
    // Step 3: Test SockJS connection
    console.log('📋 Step 2: Testing SockJS Connection');
    console.log('   - Đang kết nối đến:', httpUrl);
    
    try {
        const sockjs = new SockJS(httpUrl);
        
        sockjs.onopen = () => {
            console.log('✅ SockJS connection opened!');
            sockjs.close();
        };
        
        sockjs.onerror = (error) => {
            console.error('❌ SockJS connection error:', error);
        };
        
        sockjs.onclose = () => {
            console.log('👋 SockJS connection closed');
        };
        
        setTimeout(() => {
            if (sockjs.readyState !== SockJS.OPEN) {
                console.error('❌ SockJS connection timeout (5s)');
                sockjs.close();
            }
        }, 5000);
    } catch (error) {
        console.error('❌ Error creating SockJS:', error);
    }
    
    console.log('');
    console.log('🧪 ===== Test Completed =====');
    console.log('');
};

export const testStompConnection = (token: string, userId: string) => {
    console.log('🧪 ===== STOMP Connection Test =====');
    console.log('');
    console.log('📋 Parameters:');
    console.log('   - Token:', token.substring(0, 20) + '...');
    console.log('   - User ID:', userId);
    console.log('');
    
    const httpUrl = environment.wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
    console.log('📋 Connecting to:', httpUrl);
    
    const client = new Client({
        webSocketFactory: () => new SockJS(httpUrl) as any,
        connectHeaders: {
            'Authorization': `Bearer ${token}`
        },
        debug: (str) => {
            console.log('🔧 STOMP:', str);
        },
        onConnect: (frame) => {
            console.log('✅ STOMP Connected!', frame);
            
            // Test subscribe
            const subscription = client.subscribe(
                `/topic/users/${userId}/notifications`,
                (message) => {
                    console.log('📨 Received notification:', message.body);
                }
            );
            
            console.log('📡 Subscribed to:', `/topic/users/${userId}/notifications`);
            
            // Cleanup after 10s
            setTimeout(() => {
                subscription.unsubscribe();
                client.deactivate();
                console.log('👋 Test completed, connection closed');
            }, 10000);
        },
        onStompError: (frame) => {
            console.error('❌ STOMP Error:', frame);
        },
        onWebSocketError: (event) => {
            console.error('❌ WebSocket Error:', event);
        },
    });
    
    client.activate();
    console.log('⏳ Connecting...');
};

export const getWebSocketStatus = () => {
    console.log('📊 ===== WebSocket Status =====');
    console.log('');
    console.log('Environment:');
    console.log('   - Mode:', environment.production ? 'Production' : 'Development');
    console.log('   - API URL:', environment.apiBaseUrl);
    console.log('   - WS URL:', environment.wsUrl);
    console.log('');
    console.log('Browser Support:');
    console.log('   - WebSocket:', 'WebSocket' in window ? '✅ Supported' : '❌ Not supported');
    console.log('   - EventSource:', 'EventSource' in window ? '✅ Supported' : '❌ Not supported');
    console.log('');
};

// Export cho global scope để dùng trong console
if (typeof window !== 'undefined') {
    (window as any).testWebSocketConnection = testWebSocketConnection;
    (window as any).testStompConnection = testStompConnection;
    (window as any).getWebSocketStatus = getWebSocketStatus;
}

