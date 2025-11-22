import React, { useState, useEffect } from 'react';
import { isValidUrl } from '@/lib/avatarHelper';
import ImageWithBasePath from '../common/imageWithBasePath';
import type { INotification } from '@/apis/notification/notification.type';

// Logo PTIT mặc định
const DEFAULT_LOGO = '/src/assets/img/profiles/Logo_PTIT_University.png';

interface ToastNotificationProps {
  notification: INotification;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onDismiss: (notificationId: string) => void;
  autoHideDuration?: number; // milliseconds
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onAccept,
  onReject,
  onDismiss,
  autoHideDuration = 10000, // 10 seconds default
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);

    // Auto hide after duration
    const hideTimeout = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(hideTimeout);
    };
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Wait for exit animation
  };

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

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return '👋';
      case 'FRIEND_REQUEST_ACCEPTED':
        return '✅';
      case 'FRIEND_REQUEST_REJECTED':
        return '❌';
      case 'NEW_MESSAGE':
        return '💬';
      default:
        return '🔔';
    }
  };

  // Get background color based on notification type - PTIT Theme
  const getBgColor = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return 'linear-gradient(135deg, #6338F6 0%, #734CF7 100%)'; // PTIT purple
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'; // Success green
      case 'FRIEND_REQUEST_REJECTED':
        return 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)'; // Danger red
      case 'NEW_MESSAGE':
        return 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)'; // Info blue
      default:
        return 'linear-gradient(135deg, #6338F6 0%, #734CF7 100%)'; // PTIT purple
    }
  };

  return (
    <div
      className={`toast-notification ${isVisible ? 'show' : ''} ${isLeaving ? 'hide' : ''}`}
      style={{
        background: getBgColor(),
      }}
    >
      {/* Close button */}
      <button
        className="toast-close-btn"
        onClick={handleDismiss}
        aria-label="Close"
      >
        <i className="ti ti-x"></i>
      </button>

      <div className="toast-content">
        {/* Avatar/Icon */}
        <div className="toast-avatar">
          {notification.type === 'FRIEND_REQUEST' ? (
            // Hiển thị avatar người gửi hoặc logo PTIT
            notification.senderAvatarUrl && isValidUrl(notification.senderAvatarUrl) ? (
              <ImageWithBasePath
                src={notification.senderAvatarUrl}
                alt={notification.senderDisplayName || 'User'}
                width={50}
                height={50}
              />
            ) : (
              // Logo PTIT mặc định với nền trắng
              <ImageWithBasePath
                src={DEFAULT_LOGO}
                alt="PTIT Logo"
                width={50}
                height={50}
              />
            )
          ) : notification.type === 'FRIEND_REQUEST_ACCEPTED' ? (
            // Avatar người chấp nhận hoặc logo PTIT
            notification.senderAvatarUrl && isValidUrl(notification.senderAvatarUrl) ? (
              <ImageWithBasePath
                src={notification.senderAvatarUrl}
                alt={notification.acceptorDisplayName || 'User'}
                width={50}
                height={50}
              />
            ) : (
              <ImageWithBasePath
                src={DEFAULT_LOGO}
                alt="PTIT Logo"
                width={50}
                height={50}
              />
            )
          ) : (
            // Icon cho các loại notification khác
            <div className="toast-icon">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="toast-body">
          <div className="toast-title">
            {notification.type === 'FRIEND_REQUEST' && 'Lời mời kết bạn mới'}
            {notification.type === 'FRIEND_REQUEST_ACCEPTED' && 'Lời mời được chấp nhận'}
            {notification.type === 'FRIEND_REQUEST_REJECTED' && 'Lời mời bị từ chối'}
            {!['FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED'].includes(notification.type) && notification.title}
          </div>
          
          <div className="toast-message">
            {notification.type === 'FRIEND_REQUEST' && (
              <>
                <strong>{notification.senderDisplayName}</strong> muốn kết bạn với bạn
                {notification.message && (
                  <div className="toast-submessage">"{notification.message}"</div>
                )}
              </>
            )}
            {notification.type === 'FRIEND_REQUEST_ACCEPTED' && (
              <>
                <strong>{notification.acceptorDisplayName}</strong> đã chấp nhận lời mời kết bạn! 🎉
              </>
            )}
            {notification.type === 'FRIEND_REQUEST_REJECTED' && (
              <>
                <strong>{notification.rejectorName}</strong> đã từ chối lời mời kết bạn
              </>
            )}
            {!['FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED'].includes(notification.type) && 
              notification.content
            }
          </div>

          {/* Actions for friend request */}
          {notification.type === 'FRIEND_REQUEST' && (
            <div className="toast-actions">
              <button
                className="toast-btn toast-btn-accept"
                onClick={handleAcceptClick}
              >
                <i className="ti ti-check me-1"></i>
                Chấp nhận
              </button>
              <button
                className="toast-btn toast-btn-reject"
                onClick={handleRejectClick}
              >
                <i className="ti ti-x me-1"></i>
                Từ chối
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div 
        className="toast-progress" 
        style={{ 
          animationDuration: `${autoHideDuration}ms` 
        }}
      ></div>
    </div>
  );
};

export default ToastNotification;

