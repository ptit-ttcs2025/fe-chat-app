import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSearchUsers, useAddFriend } from '@/apis/friend/friend.api';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import ImageWithBasePath from '../common/imageWithBasePath';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useModalCleanup } from '@/hooks/useModalCleanup';

const AddContact = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const MySwal = withReactContent(Swal);
  
  // Use modal cleanup hook để tránh vấn đề backdrop khi navigate
  useModalCleanup('add-contact');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users query
  const { data: searchResults, isLoading, error } = useSearchUsers(
    debouncedQuery,
    debouncedQuery.length > 0
  );

  // Add friend mutation
  const addFriendMutation = useAddFriend();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle add friend with confirmation
  const handleAddFriend = async (userId: string, fullName: string) => {
    // Check if already sent request
    if (sentRequests.has(userId)) {
      MySwal.fire({
        icon: 'info',
        title: 'Thông báo',
        text: 'Bạn đã gửi lời mời kết bạn cho người dùng này rồi!',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Show confirmation dialog
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

      // Add to sent requests
      setSentRequests(prev => new Set(prev).add(userId));

      // Show success alert
      MySwal.fire({
        icon: 'success',
        title: 'Thành công!',
        html: `Đã gửi lời mời kết bạn đến <strong>${fullName}</strong>`,
        confirmButtonText: 'Tuyệt vời!',
        confirmButtonColor: '#28a745',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Gửi lời mời kết bạn thất bại!';
      
      // Show error alert
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: errorMessage,
        confirmButtonText: 'Thử lại',
        confirmButtonColor: '#dc3545',
        footer: '<p>Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</p>'
      });
    }
  };

  // Generate avatar color from name
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

  // Truncate bio to 100 characters
  const truncateBio = (bio?: string) => {
    if (!bio || bio.length <= 100) return bio || 'Không có';
    return bio.substring(0, 100) + '...';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get gender label
  const getGenderLabel = (gender?: 'MALE' | 'FEMALE' | 'OTHER') => {
    if (!gender) return 'Không rõ';
    switch (gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      case 'OTHER': return 'Khác';
      default: return 'Không rõ';
    }
  };

  return (
    <>
      {/* Add Contact */}
      <div className="modal fade" id="add-contact">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Thêm Bạn Bè</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSearchQuery('');
                }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body" style={{ minHeight: '500px' }}>
              {/* Search Bar */}
              <div className="mb-4">
                <label className="form-label fw-medium">
                  <i className="ti ti-search me-2 text-primary"></i>
                  Tìm kiếm người dùng
                </label>
                <div className="input-icon position-relative">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Nhập tên người dùng để tìm kiếm..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                  />
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                </div>
                {searchQuery && (
                  <small className="text-muted mt-1 d-block">
                    <i className="ti ti-info-circle me-1"></i>
                    Đang tìm kiếm: <strong>{searchQuery}</strong>
                    {searchResults && searchResults.length > 0 && (
                      <span className="badge bg-primary ms-2">{searchResults.length} kết quả</span>
                    )}
                  </small>
                )}
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="search-results-container" style={{ maxHeight: '400px' }}>
                  <OverlayScrollbarsComponent
                    options={{
                      scrollbars: {
                        autoHide: 'scroll',
                        autoHideDelay: 1000,
                      },
                    }}
                    style={{ maxHeight: '400px' }}
                  >
                    {isLoading && (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                          <span className="visually-hidden">Đang tải...</span>
                        </div>
                        <p className="text-muted">Đang tìm kiếm người dùng...</p>
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="ti ti-alert-circle fs-24 me-3"></i>
                        <div>
                          <strong>Có lỗi xảy ra!</strong>
                          <p className="mb-0">Không thể tìm kiếm người dùng. Vui lòng thử lại sau.</p>
                        </div>
                      </div>
                    )}

                    {!isLoading && !error && searchResults && searchResults.length === 0 && (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <i className="ti ti-user-search" style={{ fontSize: '80px', color: '#dee2e6' }}></i>
                        </div>
                        <h5 className="text-muted mb-2">Không tìm thấy người dùng nào</h5>
                        <p className="text-muted small">Thử tìm kiếm với từ khóa khác</p>
                      </div>
                    )}

                    {!isLoading && !error && searchResults && searchResults.length > 0 && (
                      <div className="list-group">
                        {searchResults.map((user, index) => (
                          <div
                            key={user.id}
                            className="list-group-item list-group-item-action p-3 border rounded mb-3 shadow-sm hover-lift"
                            style={{ 
                              animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div className="d-flex align-items-start">
                              {/* Avatar */}
                              <div className="flex-shrink-0 me-3">
                                {isValidUrl(user.avatarUrl) && user.avatarUrl ? (
                                  <div style={{ width: '60px', height: '60px' }}>
                                    <ImageWithBasePath
                                      src={user.avatarUrl}
                                      className="rounded-circle"
                                      alt={user.fullName}
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
                                      backgroundColor: getAvatarColor(user.fullName),
                                      fontSize: '24px'
                                    }}
                                  >
                                    {user.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-1">{user.fullName}</h6>
                                    <p className="mb-1 text-muted small">@{user.username}</p>
                                    <p className="mb-0 text-muted small">
                                      <i className="ti ti-mail me-1"></i>
                                      {user.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="row g-2 mt-2">
                                  {user.gender && (
                                    <div className="col-6">
                                      <small className="text-muted d-block">Giới tính:</small>
                                      <small className="fw-medium">{getGenderLabel(user.gender)}</small>
                                    </div>
                                  )}
                                  {user.dob && (
                                    <div className={user.gender ? "col-6" : "col-12"}>
                                      <small className="text-muted d-block">Ngày sinh:</small>
                                      <small className="fw-medium">{formatDate(user.dob)}</small>
                                    </div>
                                  )}
                                  {user.bio && (
                                    <div className="col-12">
                                      <small className="text-muted d-block">Tiểu sử:</small>
                                      <small className="fw-medium">{truncateBio(user.bio)}</small>
                                    </div>
                                  )}
                                </div>

                                {/* Action Button */}
                                <div className="mt-3 d-flex gap-2">
                                  {sentRequests.has(user.id) ? (
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      disabled
                                    >
                                      <i className="ti ti-check me-2"></i>
                                      Đã gửi lời mời
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleAddFriend(user.id, user.fullName)}
                                      disabled={addFriendMutation.isPending}
                                    >
                                      {addFriendMutation.isPending ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                          Đang gửi...
                                        </>
                                      ) : (
                                        <>
                                          <i className="ti ti-user-plus me-2"></i>
                                          Thêm bạn bè
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </OverlayScrollbarsComponent>
                </div>
              )}

              {/* Empty State */}
              {!searchQuery && (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="ti ti-users" style={{ fontSize: '100px', color: '#e3e6f0' }}></i>
                  </div>
                  <h4 className="text-muted mb-3">Tìm kiếm bạn bè mới</h4>
                  <p className="text-muted mb-4">
                    Nhập tên người dùng vào ô tìm kiếm ở trên để bắt đầu
                  </p>
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    <div className="text-center">
                      <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                           style={{ width: '60px', height: '60px' }}>
                        <i className="ti ti-search text-primary fs-24"></i>
                      </div>
                      <p className="small mb-0">Tìm kiếm</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                           style={{ width: '60px', height: '60px' }}>
                        <i className="ti ti-user-check text-success fs-24"></i>
                      </div>
                      <p className="small mb-0">Chọn người dùng</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                           style={{ width: '60px', height: '60px' }}>
                        <i className="ti ti-send text-info fs-24"></i>
                      </div>
                      <p className="small mb-0">Gửi lời mời</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-4">
                <Link
                  to="#"
                  className="btn btn-outline-primary w-100"
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
      </div>
      {/* /Add Contact */}
    </>
  );
}

export default AddContact;

// Add custom CSS styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hover-lift {
    transition: all 0.3s ease !important;
  }

  .hover-lift:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
  }

  /* SweetAlert2 custom styles */
  .swal2-popup {
    border-radius: 15px !important;
  }

  .swal2-title {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
  }

  .swal2-icon {
    margin: 1.5rem auto !important;
  }
`;

if (!document.head.querySelector('style[data-add-contact-styles]')) {
  style.setAttribute('data-add-contact-styles', 'true');
  document.head.appendChild(style);
}