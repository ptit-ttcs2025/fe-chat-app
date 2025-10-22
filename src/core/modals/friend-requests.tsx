import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useGetReceivedRequests, useGetSentRequests, useRespondFriendRequest } from '@/apis/friend/friend.api';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import ImageWithBasePath from '../common/imageWithBasePath';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useModalCleanup } from '@/hooks/useModalCleanup';
import { useQueryClient } from '@tanstack/react-query';

const FriendRequests = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const MySwal = withReactContent(Swal);
  const queryClient = useQueryClient();

  // Cleanup modal
  useModalCleanup('friend-requests');

  // Fetch data
  const { data: receivedRequests, isLoading: loadingReceived, refetch: refetchReceived } = useGetReceivedRequests();
  const { data: sentRequests, isLoading: loadingSent } = useGetSentRequests();
  
  // Respond mutation
  const respondMutation = useRespondFriendRequest();

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Check if avatar URL is valid
  const isValidUrl = (url?: string | null) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Handle accept request
  const handleAccept = async (requestId: string, senderName: string) => {
    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'ACCEPT'
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });

      MySwal.fire({
        icon: 'success',
        title: 'Đã chấp nhận!',
        html: `Bạn và <strong>${senderName}</strong> giờ đã là bạn bè`,
        confirmButtonText: 'Tuyệt vời!',
        confirmButtonColor: '#28a745',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error?.response?.data?.message || 'Không thể chấp nhận lời mời!',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Handle reject request
  const handleReject = async (requestId: string, senderName: string) => {
    const result = await MySwal.fire({
      title: 'Xác nhận từ chối',
      html: `Bạn có chắc muốn từ chối lời mời kết bạn từ <strong>${senderName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'REJECT'
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });

      MySwal.fire({
        icon: 'success',
        title: 'Đã từ chối',
        text: 'Lời mời kết bạn đã được từ chối',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error?.response?.data?.message || 'Không thể từ chối lời mời!',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#dc3545',
      });
    }
  };

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;
  const isLoading = activeTab === 'received' ? loadingReceived : loadingSent;

  return (
    <>
      {/* Friend Requests Modal */}
      <div className="modal fade" id="friend-requests">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                <i className="ti ti-user-check me-2 text-primary"></i>
                Lời Mời Kết Bạn
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
            <div className="modal-body" style={{ minHeight: '400px' }}>
              {/* Tabs */}
              <div className="mb-4">
                <ul className="nav nav-pills nav-fill">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'received' ? 'active' : ''}`}
                      onClick={() => setActiveTab('received')}
                    >
                      <i className="ti ti-inbox me-2"></i>
                      Đã Nhận
                      {receivedRequests && receivedRequests.length > 0 && (
                        <span className="badge bg-danger ms-2">{receivedRequests.length}</span>
                      )}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'sent' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sent')}
                    >
                      <i className="ti ti-send me-2"></i>
                      Đã Gửi
                      {sentRequests && sentRequests.length > 0 && (
                        <span className="badge bg-info ms-2">{sentRequests.length}</span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Content */}
              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    autoHide: 'scroll',
                    autoHideDelay: 1000,
                  },
                }}
                style={{ maxHeight: '500px' }}
              >
                {isLoading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted">Đang tải lời mời...</p>
                  </div>
                )}

                {!isLoading && (!currentRequests || currentRequests.length === 0) && (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="ti ti-inbox-off" style={{ fontSize: '80px', color: '#dee2e6' }}></i>
                    </div>
                    <h5 className="text-muted mb-2">Không có lời mời nào</h5>
                    <p className="text-muted small">
                      {activeTab === 'received' 
                        ? 'Chưa có lời mời kết bạn mới' 
                        : 'Bạn chưa gửi lời mời nào'}
                    </p>
                  </div>
                )}

                {!isLoading && currentRequests && currentRequests.length > 0 && (
                  <div className="list-group">
                    {currentRequests.map((request, index) => {
                      const displayUser = activeTab === 'received' ? request.sender : request.receiver;
                      return (
                        <div
                          key={request.id}
                          className="list-group-item list-group-item-action p-3 border rounded mb-3 shadow-sm"
                          style={{ 
                            animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <div className="d-flex align-items-start">
                            {/* Avatar */}
                            <div className="flex-shrink-0 me-3">
                              {isValidUrl(displayUser?.avatarUrl) && displayUser?.avatarUrl ? (
                                <div style={{ width: '60px', height: '60px' }}>
                                  <ImageWithBasePath
                                    src={displayUser.avatarUrl}
                                    className="rounded-circle"
                                    alt={displayUser.displayName}
                                    width={60}
                                    height={60}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    backgroundColor: getAvatarColor(displayUser?.displayName || 'User'),
                                    fontSize: '24px'
                                  }}
                                >
                                  {displayUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">{displayUser?.displayName || 'Unknown User'}</h6>
                                  <p className="mb-0 text-muted small">
                                    <i className="ti ti-clock me-1"></i>
                                    {formatDate(request.createdAt)}
                                  </p>
                                </div>
                              </div>

                              {request.message && (
                                <div className="mb-2">
                                  <small className="text-muted fst-italic">
                                    <i className="ti ti-message-circle me-1"></i>
                                    "{request.message}"
                                  </small>
                                </div>
                              )}

                              {/* Action Buttons - Only for received requests */}
                              {activeTab === 'received' && (
                                <div className="mt-3 d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleAccept(request.id, displayUser?.displayName || 'người dùng')}
                                    disabled={respondMutation.isPending}
                                  >
                                    <i className="ti ti-check me-1"></i>
                                    Chấp nhận
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleReject(request.id, displayUser?.displayName || 'người dùng')}
                                    disabled={respondMutation.isPending}
                                  >
                                    <i className="ti ti-x me-1"></i>
                                    Từ chối
                                  </button>
                                </div>
                              )}

                              {/* Status for sent requests */}
                              {activeTab === 'sent' && (
                                <div className="mt-2">
                                  <span className="badge bg-warning text-dark">
                                    <i className="ti ti-clock me-1"></i>
                                    Đang chờ phản hồi
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>

              {/* Close Button */}
              <div className="mt-4">
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
      </div>
      {/* /Friend Requests Modal */}
    </>
  );
};

export default FriendRequests;

