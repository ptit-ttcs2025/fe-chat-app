import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSearchUsers, useAddFriend, useRespondFriendRequest } from '@/apis/friend/friend.api';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import ImageWithBasePath from '../common/imageWithBasePath';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useModalCleanup } from '@/hooks/useModalCleanup';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import { useQueryClient } from '@tanstack/react-query';

// Import SCSS
import './add-contact.scss';

const AddContact = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const MySwal = withReactContent(Swal);
  const queryClient = useQueryClient();
  
  // Use modal cleanup hook để tránh vấn đề backdrop khi navigate
  useModalCleanup('add-contact');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users query (API /friends/search-users)
  const { data: searchResultsData, isLoading, error } = useSearchUsers(
    debouncedQuery,
    debouncedQuery.length > 0
  );
  const searchResults = searchResultsData?.results || [];

  // Add friend mutation
  const addFriendMutation = useAddFriend();
  // Respond friend request mutation (accept / reject lời mời pending)
  const respondFriendRequestMutation = useRespondFriendRequest();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle add friend with confirmation
  const handleAddFriend = async (userId: string, fullName: string) => {
    // Show confirmation dialog (giữ nguyên modal confirm)
    const result = await MySwal.fire({
      title: 'Xác nhận gửi lời mời',
      html: `Bạn có chắc chắn muốn gửi lời mời kết bạn đến <strong>${fullName}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="ti ti-user-plus me-2"></i>Gửi lời mời',
      cancelButtonText: '<i class="ti ti-x me-2"></i>Hủy',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await addFriendMutation.mutateAsync({
        receiverId: userId,
        message: 'Xin chào! Kết bạn với mình nhé!'
      });

      // Invalidate queries để cập nhật UI
      queryClient.invalidateQueries({ queryKey: ['friendRequests', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
      
      // Backend sẽ tự động gửi WebSocket notification đến người nhận
      // NotificationContext sẽ tự động xử lý khi nhận được notification

      // Show success toast notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Thành công!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            Đã gửi lời mời kết bạn đến <strong>${fullName}</strong> 📨
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
      const errorMessage = error?.response?.data?.message || 'Gửi lời mời kết bạn thất bại!';
      
      // Show error toast notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Có lỗi xảy ra!',
        html: `<div style="text-align: left;">
          <p style="margin: 0; font-size: 14px;">
            ${errorMessage}
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

  // Render action button theo friendshipStatus
  const renderActionButtons = (user: any) => {
    const status = user.friendshipStatus as 'NONE' | 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED';

    switch (status) {
      case 'FRIEND':
        return (
          <button type="button" className="btn-friend" disabled>
            <i className="ti ti-user-check"></i>
            Đã là bạn bè
          </button>
        );
      case 'PENDING_SENT':
        return (
          <button type="button" className="btn-pending" disabled>
            <i className="ti ti-clock"></i>
            Đã gửi lời mời
          </button>
        );
      case 'PENDING_RECEIVED':
        return (
          <>
            <button
              type="button"
              className="btn-accept"
              disabled={respondFriendRequestMutation.isPending}
              onClick={() =>
                respondFriendRequestMutation.mutate(
                  { requestId: user.pendingRequestId, action: 'ACCEPT' },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['friends'] });
                      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
                      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
                      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
                    },
                  }
                )
              }
            >
              <i className="ti ti-check"></i>
              Chấp nhận
            </button>
            <button
              type="button"
              className="btn-reject"
              disabled={respondFriendRequestMutation.isPending}
              onClick={() =>
                respondFriendRequestMutation.mutate(
                  { requestId: user.pendingRequestId, action: 'REJECT' },
                  {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
                      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });
                      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
                    },
                  }
                )
              }
            >
              <i className="ti ti-x"></i>
              Từ chối
            </button>
          </>
        );
      case 'NONE':
      default:
        return (
          <button
            type="button"
            className="btn-add-friend"
            onClick={() => handleAddFriend(user.id, user.fullName)}
            disabled={addFriendMutation.isPending}
          >
            {addFriendMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Đang gửi...
              </>
            ) : (
              <>
                <i className="ti ti-user-plus"></i>
                Thêm bạn bè
              </>
            )}
          </button>
        );
    }
  };

  return (
    <>
      {/* Add Contact */}
      <div className="modal fade" id="add-contact">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable add-contact-modal">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header add-contact-header">
              <div className="header-left">
                <i className="ti ti-user-plus header-icon"></i>
                <h4 className="modal-title">Thêm Bạn Bè</h4>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSearchQuery('');
                }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body add-contact-body">
              {/* Search Section */}
              <div className="search-section">
                <label className="search-label">
                  <i className="ti ti-search"></i>
                  Tìm kiếm người dùng
                </label>
                <div className="search-input-wrapper">
                  <i className="ti ti-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Nhập tên người dùng để tìm kiếm..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                  />
                </div>
                {searchQuery && (
                  <div className="search-info">
                    <i className="ti ti-info-circle"></i>
                    <span>Đang tìm kiếm: <strong>{searchQuery}</strong></span>
                    {searchResultsData && (
                      <span className="result-badge">
                        {searchResultsData.meta?.totalElements ?? searchResults.length} kết quả
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchQuery && (
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
                      <p>Đang tìm kiếm người dùng...</p>
                    </div>
                  )}

                  {error && (
                    <div className="error-alert">
                      <i className="ti ti-alert-circle"></i>
                      <div className="error-content">
                        <strong>Có lỗi xảy ra!</strong>
                        <p>Không thể tìm kiếm người dùng. Vui lòng thử lại sau.</p>
                      </div>
                    </div>
                  )}

                  {!isLoading && !error && searchResults && searchResults.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="ti ti-user-search"></i>
                      </div>
                      <h4>Không tìm thấy người dùng nào</h4>
                      <p>Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  )}

                  {!isLoading && !error && searchResults && searchResults.length > 0 && (
                    <div className="users-list">
                      {searchResults.map((user, index) => (
                        <div
                          key={user.id}
                          className="user-card"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Avatar */}
                          <div className="user-avatar">
                            {isValidUrl(user.avatarUrl) && user.avatarUrl ? (
                              <ImageWithBasePath
                                src={user.avatarUrl}
                                alt={user.fullName}
                              />
                            ) : (
                              <div
                                className="avatar-placeholder"
                                style={{ backgroundColor: getAvatarColor(user.fullName) }}
                              >
                                {getInitial(user.fullName)}
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="user-info">
                            <div className="user-header">
                              <div>
                                <h6 className="user-name">{user.fullName}</h6>
                                <p className="user-email">
                                  <i className="ti ti-mail"></i>
                                  {user.email}
                                </p>
                                {user.bio && (
                                  <p className="user-bio">{user.bio}</p>
                                )}
                              </div>
                              {user.status === 'ONLINE' && (
                                <span className="user-status-badge">
                                  <i className="ti ti-point-filled"></i>
                                  Online
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="user-actions">
                              {renderActionButtons(user)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </OverlayScrollbarsComponent>
              )}

              {/* Empty State */}
              {!searchQuery && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="ti ti-users"></i>
                  </div>
                  <h4>Tìm kiếm bạn bè mới</h4>
                  <p>Nhập tên người dùng vào ô tìm kiếm ở trên để bắt đầu</p>
                  <div className="empty-steps">
                    <div className="step-item">
                      <div className="step-icon">
                        <i className="ti ti-search"></i>
                      </div>
                      <p>Tìm kiếm</p>
                    </div>
                    <div className="step-item">
                      <div className="step-icon success">
                        <i className="ti ti-user-check"></i>
                      </div>
                      <p>Chọn người dùng</p>
                    </div>
                    <div className="step-item">
                      <div className="step-icon info">
                        <i className="ti ti-send"></i>
                      </div>
                      <p>Gửi lời mời</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer add-contact-footer">
              <Link
                to="#"
                className="btn-close-footer"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSearchQuery('');
                }}
              >
                Đóng
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Contact */}
    </>
  );
}

export default AddContact;