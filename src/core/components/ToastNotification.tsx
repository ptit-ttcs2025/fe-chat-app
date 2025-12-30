import React, { useState, useEffect, useCallback } from 'react';
import { isValidUrl, getAvatarColor, getInitial } from '@/lib/avatarHelper';
import ImageWithBasePath from '../common/imageWithBasePath';
import type { INotification } from '@/apis/notification/notification.type';

interface ToastNotificationProps {
  notification: INotification;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onDismiss: (notificationId: string) => void;
  autoHideDuration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onAccept,
  onReject,
  onDismiss,
  autoHideDuration = 8000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(autoHideDuration);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(enterTimeout);
  }, []);

  useEffect(() => {
    if (isPaused || isLeaving) return;
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 100) {
          handleDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, isLeaving]);

  const handleDismiss = useCallback(() => {
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  }, [isLeaving, notification.id, onDismiss]);

  const handleAcceptClick = () => {
    if (onAccept && notification.requestId) {
      onAccept(notification.requestId);
      handleDismiss();
    }
  };

  const handleRejectClick = () => {
    if (onReject && notification.requestId) {
      onReject(notification.requestId);
      handleDismiss();
    }
  };

  // Get notification type config
  const getTypeConfig = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return {
          icon: 'ti-user-plus',
          gradient: 'linear-gradient(135deg, #6338F6 0%, #8B5CF6 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Lời mời kết bạn mới',
        };
      case 'FRIEND_REQUEST_ACCEPTED':
        return {
          icon: 'ti-user-check',
          gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Đã chấp nhận lời mời!',
        };
      case 'FRIEND_REQUEST_REJECTED':
        return {
          icon: 'ti-user-x',
          gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Lời mời bị từ chối',
        };
      case 'NEW_MESSAGE':
        return {
          icon: 'ti-message',
          gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Tin nhắn mới',
        };
      case 'NEW_REPORT':
        return {
          icon: 'ti-flag',
          gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Báo cáo mới',
        };
      default:
        return {
          icon: 'ti-bell',
          gradient: 'linear-gradient(135deg, #6338F6 0%, #8B5CF6 100%)',
          iconBg: 'rgba(255, 255, 255, 0.2)',
          title: 'Thông báo',
        };
    }
  };

  const config = getTypeConfig();
  const progress = (remainingTime / autoHideDuration) * 100;
  
  // Get avatar info
  const getAvatarInfo = () => {
    const name = notification.senderDisplayName || notification.senderName || 'User';
    const avatarUrl = notification.senderAvatarUrl;
    return { name, avatarUrl };
  };

  const { name, avatarUrl } = getAvatarInfo();

  return (
    <div
      className={`toast-notification-modern ${isVisible ? 'show' : ''} ${isLeaving ? 'hide' : ''}`}
      style={{ background: config.gradient }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Close button */}
      <button
        className="toast-close"
        onClick={handleDismiss}
        aria-label="Đóng"
      >
        <i className="ti ti-x"></i>
      </button>

      {/* Main content */}
      <div className="toast-main">
        {/* Avatar */}
        <div className="toast-avatar-wrapper">
          {isValidUrl(avatarUrl) && avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name}
              className="toast-avatar-img"
            />
          ) : (
            <div 
              className="toast-avatar-placeholder"
              style={{ backgroundColor: getAvatarColor(name) }}
            >
              {getInitial(name)}
            </div>
          )}
          <span className="toast-avatar-badge" style={{ background: config.iconBg }}>
            <i className={`ti ${config.icon}`}></i>
          </span>
        </div>

        {/* Content */}
        <div className="toast-content-wrapper">
          <div className="toast-title-row">
            <span className="toast-label">{config.title}</span>
          </div>
          
          <div className="toast-body-text">
            {notification.type === 'FRIEND_REQUEST' && (
              <>
                <strong>{notification.senderDisplayName || notification.senderName}</strong> muốn kết bạn với bạn
              </>
            )}
            {notification.type === 'FRIEND_REQUEST_ACCEPTED' && (
              <>
                <strong>{notification.senderDisplayName || notification.senderName}</strong> đã chấp nhận lời mời kết bạn!
              </>
            )}
            {notification.type === 'FRIEND_REQUEST_REJECTED' && (
              <>
                <strong>{notification.senderDisplayName || notification.senderName}</strong> đã từ chối lời mời
              </>
            )}
            {notification.type === 'NEW_REPORT' && (
              <>
                {notification.content}
              </>
            )}
            {!['FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED', 'NEW_REPORT'].includes(notification.type) && 
              notification.content
            }
          </div>

          {notification.message && notification.type === 'FRIEND_REQUEST' && (
            <div className="toast-message-quote">
              "{notification.message}"
            </div>
          )}

          {/* Actions for friend request */}
          {notification.type === 'FRIEND_REQUEST' && (
            <div className="toast-actions">
              <button className="toast-btn accept" onClick={handleAcceptClick}>
                <i className="ti ti-check"></i>
                Xác nhận
              </button>
              <button className="toast-btn reject" onClick={handleRejectClick}>
                <i className="ti ti-x"></i>
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="toast-progress-track">
        <div 
          className="toast-progress-bar"
          style={{ 
            width: `${progress}%`,
            transition: isPaused ? 'none' : 'width 0.1s linear'
          }}
        ></div>
      </div>
    </div>
  );
};

export default ToastNotification;
