
import { Link } from 'react-router-dom'
import { all_routes } from '../../feature-module/router/all_routes'
import ImageWithBasePath from '../common/imageWithBasePath';
import { useSelectedFriend } from '@/contexts/SelectedFriendContext';
import { useGetFriendDetail } from '@/apis/friend/friend.api';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import { useModalCleanup } from '@/hooks/useModalCleanup';

const ContactDetails = () => {
    const routes = all_routes;
    const { selectedFriendId } = useSelectedFriend();
    
    // Cleanup modal on navigation
    useModalCleanup('contact-details');
    
    // Fetch friend detail
    const { data: friendDetail, isLoading } = useGetFriendDetail(
        selectedFriendId || '',
        !!selectedFriendId
    );

    // Format date
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get gender label
    const getGenderLabel = (gender?: 'MALE' | 'FEMALE' | 'OTHER' | null) => {
        if (!gender) return 'Không rõ';
        switch (gender) {
            case 'MALE': return 'Nam';
            case 'FEMALE': return 'Nữ';
            case 'OTHER': return 'Khác';
            default: return 'Không rõ';
        }
    };

    // Get status badge
    const getStatusBadge = (status?: 'ONLINE' | 'OFFLINE' | 'AWAY') => {
        switch (status) {
            case 'ONLINE':
                return <span className="badge bg-success">Online</span>;
            case 'AWAY':
                return <span className="badge bg-warning">Away</span>;
            case 'OFFLINE':
            default:
                return <span className="badge bg-secondary">Offline</span>;
        }
    };
  return (
    <>
      {/* Contact Detail */}
  <div className="modal fade" id="contact-details">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Chi tiết liên hệ</h4>
          <div className="d-flex align-items-center">
            <div className="dropdown me-2">
              <Link className="d-block" to="#" data-bs-toggle="dropdown">
                <i className="ti ti-dots-vertical" />
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <Link className="dropdown-item" to="#">
                    <i className="ti ti-share-3 me-2" />
                    Chia sẻ
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#edit-contact"
                  >
                    <i className="ti ti-edit me-2" />
                    Sửa
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#block-user"
                  >
                    <i className="ti ti-ban me-2" />
                    Chặn
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="#">
                    <i className="ti ti-trash me-2" />
                    Xóa
                  </Link>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted mt-2">Đang tải thông tin...</p>
            </div>
          )}

          {/* No Friend Selected */}
          {!isLoading && !friendDetail && (
            <div className="text-center py-5">
              <i className="ti ti-user-off" style={{ fontSize: '60px', color: '#dee2e6' }}></i>
              <p className="text-muted mt-2">Chưa chọn bạn bè nào</p>
            </div>
          )}

          {/* Friend Detail */}
          {!isLoading && friendDetail && (
            <>
              <div className="card bg-light shadow-none">
                <div className="card-body pb-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar avatar-lg">
                        {isValidUrl(friendDetail.avatarUrl) && friendDetail.avatarUrl ? (
                          <ImageWithBasePath
                            src={friendDetail.avatarUrl}
                            className="rounded-circle"
                            alt={friendDetail.fullName}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: getAvatarColor(friendDetail.fullName),
                              fontSize: '24px'
                            }}
                          >
                            {getInitial(friendDetail.fullName)}
                          </div>
                        )}
                      </span>
                      <div className="ms-2">
                        <h6>{friendDetail.fullName}</h6>
                        <p className="mb-0">{getStatusBadge(friendDetail.status)}</p>
                      </div>
                    </div>
                <div className="contact-actions d-flex align-items-center mb-3">
                  <Link to={routes.chat} className="me-2">
                    <i className="ti ti-message" />
                  </Link>
                  <Link
                    to="#"
                    className="me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#voice_call"
                  >
                    <i className="ti ti-phone" />
                  </Link>
                  <Link
                    to="#"
                    className="me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#video-call"
                  >
                    <i className="ti ti-video" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="card border mb-3">
            <div className="card-header border-bottom">
              <h6>Thông Tin Cá Nhân</h6>
            </div>
            <div className="card-body pb-1">
              <div className="mb-2">
                <div className="row align-items-center">
                  {friendDetail.lastActiveAt && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-clock-hour-4 me-1" />
                          Hoạt động lần cuối
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">
                          {new Date(friendDetail.lastActiveAt).toLocaleString('vi-VN')}
                        </h6>
                      </div>
                    </>
                  )}
                  
                  {friendDetail.dob && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-calendar-event me-1" />
                          Ngày sinh
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">{formatDate(friendDetail.dob)}</h6>
                      </div>
                    </>
                  )}

                  {friendDetail.gender && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-gender-bigender me-1" />
                          Giới tính
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">{getGenderLabel(friendDetail.gender)}</h6>
                      </div>
                    </>
                  )}

                  <div className="col-sm-6">
                    <p className="mb-2 d-flex align-items-center">
                      <i className="ti ti-mail me-1" />
                      Email
                    </p>
                  </div>
                  <div className="col-sm-6">
                    <h6 className="fw-medium fs-14 mb-2">
                      {friendDetail.email}
                    </h6>
                  </div>

                  {friendDetail.bio && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-info-circle me-1" />
                          Tiểu sử
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">
                          {friendDetail.bio}
                        </h6>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  {/* /Contact Detail */}
    </>
  )
}

export default ContactDetails