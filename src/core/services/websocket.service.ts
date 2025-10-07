import io from 'socket.io-client';
import type { Socket } from 'socket.io-client'; // ✅ Import type đúng

class WebSocketService {
    private static instance: WebSocketService | null = null;
    private socket: Socket | null = null; // ✅ Dùng Socket type

    private constructor() {}

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    connect(url: string, token: string): void {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(url, {
            auth: { token },
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }

    getSocket(): Socket | null { // ✅ Return Socket type
        return this.socket;
    }
}

export default WebSocketService.getInstance();
