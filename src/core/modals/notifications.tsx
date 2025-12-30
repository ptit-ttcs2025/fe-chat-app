import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { getAvatarColor, getInitial, isValidUrl } from '@/lib/avatarHelper';
import ImageWithBasePath from '../common/imageWithBasePath';
import { useRespondFriendRequest } from '@/apis/friend/friend.api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useQueryClient } from '@tanstack/react-query';
import type { INotification } from '@/apis/notification/notification.type';
import { useState, useEffect } from 'react';

// Import SCSS
import './notifications.scss';

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications,
  } = useNotifications();
  
  const respondMutation = useRespondFriendRequest();
  const queryClient = useQueryClient();
  const MySwal = withReactContent(Swal);
  
  // Track if modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Processing states for optimistic UI
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // AUTO MARK AS READ: When modal opens, mark visible notifications as read
  useEffect(() => {
    if (isModalOpen && notifications.length > 0) {
      // Get IDs of unread notifications that are visible
      const unreadIds = notifications
        .filter(n => !n.isSeen)
        .map(n => n.id);

      if (unreadIds.length > 0) {
        // Mark them as read (only visible ones, pagination will handle rest)
        unreadIds.forEach(id => markAsRead(id));
      }
    }
  }, [isModalOpen, notifications, markAsRead]);

  // Listen for modal open/close events
  useEffect(() => {
    const modalElement = document.getElementById('notifications-modal');
    if (!modalElement) return;

    const handleModalShown = () => setIsModalOpen(true);
    const handleModalHidden = () => setIsModalOpen(false);

    modalElement.addEventListener('shown.bs.modal', handleModalShown);
    modalElement.addEventListener('hidden.bs.modal', handleModalHidden);

    return () => {
      modalElement.removeEventListener('shown.bs.modal', handleModalShown);
      modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
    };
  }, []);

  // ✅ Show all notifications (no filtering)
  const filteredNotifications = notifications;

  // Format time relative
  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Handle accept friend request
  const handleAccept = async (notification: INotification) => {
    if (!notification.requestId) return;
    
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      await respondMutation.mutateAsync({
        requestId: notification.requestId,
        action: 'ACCEPT'
      });

      // Remove this notification after success
      removeNotification(notification.id);

      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Đã kết bạn!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            Bạn và <strong>${notification.senderDisplayName}</strong> đã trở thành bạn bè! 🎉
          </p>
        </div>`,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInRight'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutRight'
        },
        customClass: {
          popup: 'colored-toast'
        }
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
      refreshNotifications();
    } catch (error: any) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Có lỗi xảy ra!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            ${error?.response?.data?.message || 'Không thể chấp nhận lời mời kết bạn'}
          </p>
        </div>`,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInRight'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutRight'
        },
        customClass: {
          popup: 'colored-toast'
        }
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  // Handle reject friend request
  const handleReject = async (notification: INotification) => {
    if (!notification.requestId) return;
    
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      await respondMutation.mutateAsync({
        requestId: notification.requestId,
        action: 'REJECT'
      });

      // Remove this notification after success
      removeNotification(notification.id);

      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Đã từ chối lời mời',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            Lời mời kết bạn đã được từ chối
          </p>
        </div>`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInRight'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutRight'
        },
        customClass: {
          popup: 'colored-toast'
        }
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
      refreshNotifications();
    } catch (error: any) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Có lỗi xảy ra!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            ${error?.response?.data?.message || 'Không thể từ chối lời mời kết bạn'}
          </p>
        </div>`,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInRight'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutRight'
        },
        customClass: {
          popup: 'colored-toast'
        }
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (notification: INotification) => {
    if (notification.isSeen) return;
    markAsRead(notification.id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
    MySwal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Đã đánh dấu tất cả đã đọc',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // Render avatar
  const renderAvatar = (notification: INotification) => {
    const name = notification.senderDisplayName || notification.senderName || 'U';
    const avatarUrl = notification.senderAvatarUrl;
    
    if (isValidUrl(avatarUrl) && avatarUrl) {
      return (
        <div className="notification-avatar">
          <ImageWithBasePath
            src={avatarUrl}
            className="rounded-circle"
            alt={name}
            width={48}
            height={48}
          />
          {getNotificationBadge(notification.type)}
        </div>
      );
    }
    
    return (
      <div className="notification-avatar">
        <div
          className="avatar-placeholder"
          style={{ backgroundColor: getAvatarColor(name) }}
        >
          {getInitial(name)}
        </div>
        {getNotificationBadge(notification.type)}
      </div>
    );
  };

  // Get notification badge icon
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return (
          <span className="notification-badge badge-primary">
            <i className="ti ti-user-plus"></i>
          </span>
        );
      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <span className="notification-badge badge-success">
            <i className="ti ti-check"></i>
          </span>
        );
      case 'FRIEND_REQUEST_REJECTED':
        return (
          <span className="notification-badge badge-danger">
            <i className="ti ti-x"></i>
          </span>
        );
      case 'NEW_MESSAGE':
        return (
          <span className="notification-badge badge-info">
            <i className="ti ti-message"></i>
          </span>
        );
      default:
        return (
          <span className="notification-badge badge-secondary">
            <i className="ti ti-bell"></i>
          </span>
        );
    }
  };

  // Render notification content
  const renderNotificationContent = (notification: INotification) => {
    const isProcessing = processingIds.has(notification.id);
    
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return (
          <div className={`notification-card ${!notification.isSeen ? 'unread' : ''}`}>
            {renderAvatar(notification)}
            
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-text">
                  <strong>{notification.senderDisplayName || 'Người dùng'}</strong>
                  <span className="notification-action-text"> đã gửi cho bạn lời mời kết bạn</span>
                </div>
                <span className="notification-time">{formatTime(notification.createdAt)}</span>
              </div>
              
              {notification.message && (
                <p className="notification-message">"{notification.message}"</p>
              )}
              
              <div className="notification-actions">
                <button
                  className="btn-accept"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(notification);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="ti ti-check me-1"></i>
                  )}
                  Xác nhận
                </button>
                <button
                  className="btn-reject"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(notification);
                  }}
                  disabled={isProcessing}
                >
                  <i className="ti ti-x me-1"></i>
                  Xóa
                </button>
              </div>
            </div>
            
            {notification.isSeen ? null : <span className="unread-dot"></span>}
          </div>
        );

      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <div 
            className={`notification-card clickable ${notification.isSeen ? '' : 'unread'}`}
            onClick={() => handleMarkAsRead(notification)}
            onKeyDown={(e) => e.key === 'Enter' && handleMarkAsRead(notification)}
            role="button"
            tabIndex={0}
          >
            {renderAvatar(notification)}
            
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-text">
                  <strong>{notification.senderDisplayName || 'Người dùng'}</strong>
                  <span className="notification-action-text"> đã chấp nhận lời mời kết bạn của bạn</span>
                </div>
                <span className="notification-time">{formatTime(notification.createdAt)}</span>
              </div>
              
              <p className="notification-subtitle success">Các bạn đã là bạn bè!</p>
            </div>
            
            {notification.isSeen ? null : <span className="unread-dot"></span>}
          </div>
        );

      case 'FRIEND_REQUEST_REJECTED':
        return (
          <div 
            className={`notification-card clickable ${notification.isSeen ? '' : 'unread'}`}
            onClick={() => handleMarkAsRead(notification)}
            onKeyDown={(e) => e.key === 'Enter' && handleMarkAsRead(notification)}
            role="button"
            tabIndex={0}
          >
            {renderAvatar(notification)}
            
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-text">
                  <strong>{notification.senderDisplayName || 'Người dùng'}</strong>
                  <span className="notification-action-text"> đã từ chối lời mời kết bạn của bạn</span>
                </div>
                <span className="notification-time">{formatTime(notification.createdAt)}</span>
              </div>
            </div>
            
            {notification.isSeen ? null : <span className="unread-dot"></span>}
          </div>
        );

      default:
        return (
          <div 
            className={`notification-card clickable ${notification.isSeen ? '' : 'unread'}`}
            onClick={() => handleMarkAsRead(notification)}
            onKeyDown={(e) => e.key === 'Enter' && handleMarkAsRead(notification)}
            role="button"
            tabIndex={0}
          >
            {renderAvatar(notification)}
            
            <div className="notification-content">
              <div className="notification-header">
                <div className="notification-text">
                  {notification.title || notification.content}
                </div>
                <span className="notification-time">{formatTime(notification.createdAt)}</span>
              </div>
              
              {notification.content && notification.title && (
                <p className="notification-subtitle">{notification.content}</p>
              )}
            </div>
            
            {notification.isSeen ? null : <span className="unread-dot"></span>}
          </div>
        );
    }
  };

  return (
    <>
      {/* Notifications Modal */}
      <div className="modal fade" id="notifications-modal">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable notifications-modal">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header notifications-header">
              <div className="header-left">
                <i className="ti ti-bell header-icon"></i>
                <h4 className="modal-title">Thông Báo</h4>
                {unreadCount > 0 && (
                  <span className="badge-count">{unreadCount}</span>
                )}
              </div>
              <div className="header-actions">
                {unreadCount > 0 && (
                  <button
                    className="btn-mark-all"
                    onClick={handleMarkAllAsRead}
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <i className="ti ti-checks"></i>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-close-modal"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body notifications-body">
              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    autoHide: 'scroll',
                    autoHideDelay: 800,
                  },
                }}
                style={{ maxHeight: '60vh' }}
              >
                {filteredNotifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="ti ti-bell-off"></i>
                    </div>
                    <h5>Không có thông báo</h5>
                    <p>
                      Không có thông báo nào để hiển thị.
                    </p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {filteredNotifications.map((notification) => (
                      <div key={notification.id} className="notification-item-wrapper">
                        {renderNotificationContent(notification)}
                      </div>
                    ))}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>

            {/* Footer */}
            <div className="modal-footer notifications-footer">
              <span className="notification-count">
                {notifications.length} thông báo
              </span>
              <Link
                to="#"
                className="btn-close-footer"
                data-bs-dismiss="modal"
              >
                Đóng
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* /Notifications Modal */}
    </>
  );
};

export default Notifications;
