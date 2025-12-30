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
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';

// Import SCSS
import './friend-requests.scss';

const FriendRequests = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const MySwal = withReactContent(Swal);
  const queryClient = useQueryClient();

  // Cleanup modal
  useModalCleanup('friend-requests');

  // Fetch data
  const { data: receivedRequests, isLoading: loadingReceived } = useGetReceivedRequests();
  const { data: sentRequests, isLoading: loadingSent } = useGetSentRequests();
  
  // Respond mutation
  const respondMutation = useRespondFriendRequest();

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
      queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });

      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Đã kết bạn!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            Bạn và <strong>${senderName}</strong> đã trở thành bạn bè! 🎉
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
    }
  };

  // Handle reject request
  const handleReject = async (requestId: string, senderName: string) => {
    const result = await MySwal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Xác nhận từ chối',
      html: `<div style="text-align: left;">
        <p style="margin: 0; font-size: 14px;">
          Bạn có chắc muốn từ chối lời mời từ <strong>${senderName}</strong>?
        </p>
      </div>`,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
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

    if (!result.isConfirmed) return;

    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'REJECT'
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });

      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Đã từ chối',
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
    }
  };

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;
  const isLoading = activeTab === 'received' ? loadingReceived : loadingSent;

  return (
    <>
      {/* Friend Requests Modal */}
      <div className="modal fade" id="friend-requests">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable friend-requests-modal">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header friend-requests-header">
              <div className="header-left">
                <i className="ti ti-user-check header-icon"></i>
                <h4 className="modal-title">Lời Mời Kết Bạn</h4>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Tabs */}
            <div className="friend-requests-tabs">
              <button
                className={`tab-item ${activeTab === 'received' ? 'active' : ''}`}
                onClick={() => setActiveTab('received')}
              >
                <i className="ti ti-inbox"></i>
                Đã Nhận
                {receivedRequests && receivedRequests.length > 0 && (
                  <span className="tab-badge">{receivedRequests.length}</span>
                )}
              </button>
              <button
                className={`tab-item ${activeTab === 'sent' ? 'active' : ''}`}
                onClick={() => setActiveTab('sent')}
              >
                <i className="ti ti-send"></i>
                Đã Gửi
                {sentRequests && sentRequests.length > 0 && (
                  <span className="tab-badge">{sentRequests.length}</span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="modal-body friend-requests-body">

              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    autoHide: 'scroll',
                    autoHideDelay: 800,
                  },
                }}
                style={{ maxHeight: '55vh' }}
              >
                {isLoading && (
                  <div className="loading-state">
                    <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p>Đang tải lời mời...</p>
                  </div>
                )}

                {!isLoading && (!currentRequests || currentRequests.length === 0) && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="ti ti-inbox-off"></i>
                    </div>
                    <h5>Không có lời mời nào</h5>
                    <p>
                      {activeTab === 'received' 
                        ? 'Chưa có lời mời kết bạn mới' 
                        : 'Bạn chưa gửi lời mời nào'}
                    </p>
                  </div>
                )}

                {!isLoading && currentRequests && currentRequests.length > 0 && (
                  <div className="requests-list">
                    {currentRequests.map((request, index) => {
                      // Lấy thông tin người dùng tương ứng
                      const displayName = activeTab === 'received' ? request.senderDisplayName : request.receiverDisplayName;
                      const avatarUrl = activeTab === 'received' ? request.senderAvatarUrl : request.receiverAvatarUrl;
                      
                      return (
                        <div
                          key={request.id}
                          className="request-card"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Avatar */}
                          <div className="request-avatar">
                            {isValidUrl(avatarUrl) && avatarUrl ? (
                              <ImageWithBasePath
                                src={avatarUrl}
                                alt={displayName}
                              />
                            ) : (
                              <div
                                className="avatar-placeholder"
                                style={{ backgroundColor: getAvatarColor(displayName || 'User') }}
                              >
                                {getInitial(displayName)}
                              </div>
                            )}
                          </div>

                          {/* Request Info */}
                          <div className="request-info">
                            <div className="request-header">
                              <h6 className="request-name">{displayName || 'Unknown User'}</h6>
                              <p className="request-time">
                                <i className="ti ti-clock"></i>
                                {formatDate(request.createdAt)}
                              </p>
                            </div>

                            {request.message && (
                              <div className="request-message">
                                <i className="ti ti-message-circle"></i>
                                <span>"{request.message}"</span>
                              </div>
                            )}

                            {/* Action Buttons - Only for received requests */}
                            {activeTab === 'received' && (
                              <div className="request-actions">
                                <button
                                  type="button"
                                  className="btn-accept-request"
                                  onClick={() => handleAccept(request.id, displayName || 'người dùng')}
                                  disabled={respondMutation.isPending}
                                >
                                  <i className="ti ti-check"></i>
                                  Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject-request"
                                  onClick={() => handleReject(request.id, displayName || 'người dùng')}
                                  disabled={respondMutation.isPending}
                                >
                                  <i className="ti ti-x"></i>
                                  Từ chối
                                </button>
                              </div>
                            )}

                            {/* Status for sent requests */}
                            {activeTab === 'sent' && (
                              <div className="request-status">
                                <span className="status-badge">
                                  <i className="ti ti-clock"></i>
                                  Đang chờ phản hồi
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </OverlayScrollbarsComponent>
            </div>

            {/* Footer */}
            <div className="modal-footer friend-requests-footer">
              <Link
                to="#"
                className="btn-close-footer"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                Đóng
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* /Friend Requests Modal */}
    </>
  );
};

export default FriendRequests;

