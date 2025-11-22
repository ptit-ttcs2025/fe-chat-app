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

  // Format time
  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return '📨';
      case 'FRIEND_REQUEST_ACCEPTED':
        return '✅';
      case 'FRIEND_REQUEST_REJECTED':
        return '🚫';
      case 'NEW_MESSAGE':
        return '💬';
      default:
        return '🔔';
    }
  };

  // Handle accept friend request
  const handleAccept = async (requestId: string, senderName: string) => {
    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'ACCEPT'
      });

      MySwal.fire({
        icon: 'success',
        title: 'Đã chấp nhận!',
        text: `Bạn và ${senderName} giờ là bạn bè!`,
        confirmButtonText: 'Tuyệt vời!',
        confirmButtonColor: '#28a745',
        timer: 3000,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
      refreshNotifications();
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || 'Không thể chấp nhận lời mời',
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Handle reject friend request
  const handleReject = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'REJECT'
      });

      MySwal.fire({
        icon: 'info',
        title: 'Đã từ chối',
        text: 'Đã từ chối lời mời kết bạn',
        confirmButtonText: 'OK',
        confirmButtonColor: '#6c757d',
        timer: 2000,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
      refreshNotifications();
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || 'Không thể từ chối lời mời',
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    const result = await MySwal.fire({
      title: 'Đánh dấu tất cả đã đọc?',
      text: 'Tất cả thông báo sẽ được đánh dấu là đã đọc',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      await markAllAsRead();
    }
  };

  // Render notification content based on type
  const renderNotificationContent = (notification: any) => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return (
          <div className="notification-item friend-request" data-id={notification.id}>
            <div className="d-flex align-items-start">
              {/* Avatar */}
              <div className="flex-shrink-0 me-3">
                {isValidUrl(notification.senderAvatarUrl) && notification.senderAvatarUrl ? (
                  <div style={{ width: '50px', height: '50px' }}>
                    <ImageWithBasePath
                      src={notification.senderAvatarUrl}
                      className="rounded-circle"
                      alt={notification.senderDisplayName}
                      width={50}
                      height={50}
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: getAvatarColor(notification.senderDisplayName || 'U'),
                      fontSize: '20px'
                    }}
                  >
                    {getInitial(notification.senderDisplayName || 'Unknown')}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">
                      <span className="me-2">{getNotificationIcon(notification.type)}</span>
                      Lời mời kết bạn
                    </h6>
                    <p className="mb-1">
                      <strong>{notification.senderDisplayName}</strong> muốn kết bạn với bạn
                    </p>
                    {notification.message && (
                      <p className="mb-2 text-muted small fst-italic">
                        "{notification.message}"
                      </p>
                    )}
                    <small className="text-muted">{formatTime(notification.createdAt)}</small>
                  </div>
                  {!notification.isSeen && (
                    <span className="badge bg-primary">Mới</span>
                  )}
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleAccept(notification.requestId!, notification.senderDisplayName!)}
                    disabled={respondMutation.isPending}
                  >
                    <i className="ti ti-check me-1"></i>
                    Chấp nhận
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleReject(notification.requestId!)}
                    disabled={respondMutation.isPending}
                  >
                    <i className="ti ti-x me-1"></i>
                    Từ chối
                  </button>
                  {!notification.isSeen && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <i className="ti ti-check me-1"></i>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <div className="notification-item friend-accepted" data-id={notification.id}>
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0 me-3">
                <div className="notification-icon bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                     style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">Lời mời được chấp nhận</h6>
                    <p className="mb-1">
                      <strong>{notification.acceptorDisplayName}</strong> đã chấp nhận lời mời kết bạn của bạn! 🎉
                    </p>
                    <small className="text-muted">{formatTime(notification.acceptedAt || notification.createdAt)}</small>
                  </div>
                  {!notification.isSeen && (
                    <span className="badge bg-primary">Mới</span>
                  )}
                </div>
                {!notification.isSeen && (
                  <button
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <i className="ti ti-check me-1"></i>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'FRIEND_REQUEST_REJECTED':
        return (
          <div className="notification-item friend-rejected" data-id={notification.id}>
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0 me-3">
                <div className="notification-icon bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                     style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">Lời mời bị từ chối</h6>
                    <p className="mb-1">
                      <strong>{notification.rejectorName}</strong> đã từ chối lời mời kết bạn
                    </p>
                    <small className="text-muted">{formatTime(notification.rejectedAt || notification.createdAt)}</small>
                  </div>
                  {!notification.isSeen && (
                    <span className="badge bg-primary">Mới</span>
                  )}
                </div>
                {!notification.isSeen && (
                  <button
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <i className="ti ti-check me-1"></i>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="notification-item" data-id={notification.id}>
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0 me-3">
                <div className="notification-icon bg-info text-white rounded-circle d-flex align-items-center justify-content-center"
                     style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{notification.title}</h6>
                    <p className="mb-1">{notification.content}</p>
                    <small className="text-muted">{formatTime(notification.createdAt)}</small>
                  </div>
                  {!notification.isSeen && (
                    <span className="badge bg-primary">Mới</span>
                  )}
                </div>
                {!notification.isSeen && (
                  <button
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <i className="ti ti-check me-1"></i>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Notifications Modal */}
      <div className="modal fade" id="notifications-modal">
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                <i className="ti ti-bell me-2"></i>
                Thông Báo
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount}</span>
                )}
              </h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body" style={{ minHeight: '400px', maxHeight: '600px' }}>
              {/* Actions */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <span className="text-muted">
                    {notifications.length} thông báo
                    {unreadCount > 0 && ` (${unreadCount} chưa đọc)`}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleMarkAllAsRead}
                  >
                    <i className="ti ti-checks me-1"></i>
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    autoHide: 'scroll',
                    autoHideDelay: 1000,
                  },
                }}
                style={{ maxHeight: '500px' }}
              >
                {notifications.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-bell-off" style={{ fontSize: '80px', color: '#dee2e6' }}></i>
                    <h5 className="text-muted mt-3 mb-2">Chưa có thông báo nào</h5>
                    <p className="text-muted small">Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`mb-3 p-3 border rounded ${!notification.isSeen ? 'bg-light' : ''}`}
                        style={{ 
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      >
                        {renderNotificationContent(notification)}
                      </div>
                    ))}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>
            <div className="modal-footer">
              <Link
                to="#"
                className="btn btn-outline-primary w-100"
                data-bs-dismiss="modal"
                aria-label="Close"
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

