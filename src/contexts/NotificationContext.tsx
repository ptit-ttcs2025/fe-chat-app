import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import websocketService from '@/core/services/websocket.service';
import { notificationApis } from '@/apis/notification/notification.api';
import type { INotification } from '@/apis/notification/notification.type';
import { useQueryClient } from '@tanstack/react-query';
import authStorage from '@/lib/authStorage';
import type { NewReportNotification } from '@/apis/report/report.type';

interface NotificationContextType {
    notifications: INotification[];
    unreadCount: number;
    isConnected: boolean;
    toastNotifications: INotification[]; // Toast notifications to display
    addNotification: (notification: INotification) => void;
    removeNotification: (notificationId: string) => void;
    dismissToast: (notificationId: string) => void; // Dismiss a toast
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    refreshNotifications: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [toastNotifications, setToastNotifications] = useState<INotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const queryClient = useQueryClient();

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('🔊 Notification sound played');
        }
    }, []);

    // Add notification
    const addNotification = useCallback((notification: INotification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Add to toast notifications for display
        setToastNotifications(prev => [...prev, notification]);
        
        if (!notification.isSeen) {
            setUnreadCount(prev => prev + 1);
        }
        playNotificationSound();
    }, [playNotificationSound]);

    // Dismiss toast
    const dismissToast = useCallback((notificationId: string) => {
        setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, []);

    // Remove notification
    const removeNotification = useCallback((notificationId: string) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === notificationId);
            if (notification && !notification.isSeen) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== notificationId);
        });
    }, []);

    // Mark as read - optimistic update
    const markAsRead = useCallback((notificationId: string) => {
        // Check if already read
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification || notification.isSeen) return;
        
        // Optimistic update
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, isSeen: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // API call in background
        notificationApis.markAsRead(notificationId)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
            })
            .catch(error => {
                console.error('Error marking notification as read:', error);
                // Revert optimistic update on error
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, isSeen: false } : n
                    )
                );
                setUnreadCount(prev => prev + 1);
            });
    }, [notifications, queryClient]);

    // Mark all as read - optimistic update
    const markAllAsRead = useCallback(() => {
        if (unreadCount === 0) return;
        
        // Store previous state for rollback
        const prevNotifications = [...notifications];
        const prevUnreadCount = unreadCount;
        
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => ({ ...n, isSeen: true }))
        );
        setUnreadCount(0);
        
        // API call in background
        notificationApis.markAllAsRead()
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
            })
            .catch(error => {
                console.error('Error marking all notifications as read:', error);
                // Revert on error
                setNotifications(prevNotifications);
                setUnreadCount(prevUnreadCount);
            });
    }, [notifications, unreadCount, queryClient]);

    // Clear notifications (UI only)
    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Refresh notifications from server
    const refreshNotifications = useCallback(async () => {
        try {
            const data = await notificationApis.getNotifications(0, 20);
            setNotifications(data);
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        }
    }, []);

    // Refresh unread count
    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await notificationApis.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error refreshing unread count:', error);
        }
    }, []);

    // Handle incoming WebSocket notification
    const handleWebSocketNotification = useCallback((notification: INotification) => {
        console.log('📩 Context received notification:', notification);
        addNotification(notification);
        
        // Invalidate related queries based on notification type
        if (notification.type === 'FRIEND_REQUEST') {
            queryClient.invalidateQueries({ queryKey: ['friendRequests', 'received'] });
            queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
        } else if (notification.type === 'FRIEND_REQUEST_ACCEPTED') {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
            queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
        } else if (notification.type === 'FRIEND_REQUEST_REJECTED') {
            queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
        } else if (notification.type === 'NEW_REPORT') {
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
        }
    }, [addNotification, queryClient]);

    // Subscribe to WebSocket notifications
    useEffect(() => {
        const unsubscribe = websocketService.onNotification(handleWebSocketNotification);
        
        // Update connection status
        const checkConnection = setInterval(() => {
            setIsConnected(websocketService.getConnectionStatus());
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(checkConnection);
        };
    }, [handleWebSocketNotification]);

    // Subscribe to admin report notifications (only for admin users)
    useEffect(() => {
        const checkIfAdmin = (): boolean => {
            const user = authStorage.getUser();
            return user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
        };

        const isAdmin = checkIfAdmin();
        if (!isAdmin) return;

        const handleNewReport = (notification: NewReportNotification) => {
            console.log('📩 Admin received new report notification:', notification);
            
            // Convert NewReportNotification to INotification format
            const user = authStorage.getUser();
            const inotification: INotification = {
                id: `report-${notification.reportId}`,
                userId: user?.id || '',
                type: 'NEW_REPORT',
                title: 'Báo cáo mới',
                content: `${notification.reporterName} đã báo cáo ${notification.targetUserName}`,
                isSeen: false,
                createdAt: notification.createdAt,
                relatedId: notification.reportId, // Store reportId for navigation
                senderName: notification.reporterName,
                senderDisplayName: notification.reporterName,
            };

            addNotification(inotification);
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
        };

        const unsubscribe = websocketService.subscribeToNewReports(handleNewReport);

        return () => {
            unsubscribe();
        };
    }, [addNotification, queryClient]);

    // Load initial notifications - chỉ gọi khi đã đăng nhập
    useEffect(() => {
        const isAuthenticated = !!authStorage.getAccessToken();
        if (isAuthenticated) {
            refreshNotifications();
            refreshUnreadCount();
        } else {
            // Clear notifications khi chưa đăng nhập
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [refreshNotifications, refreshUnreadCount]);

    const value: NotificationContextType = {
        notifications,
        toastNotifications,
        unreadCount,
        isConnected,
        addNotification,
        removeNotification,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refreshNotifications,
        refreshUnreadCount,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook to use notification context
export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

