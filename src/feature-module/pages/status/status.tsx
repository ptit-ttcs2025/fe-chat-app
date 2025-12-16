import { useState } from 'react'
import UploadFile from '../../../core/modals/upload-file-image'
import NewStatus from '../../../core/modals/new-status'
import { Link, useNavigate } from 'react-router-dom'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { mockStatusUsers, myStatus } from '@/mockData/statusData'
import { all_routes } from '../../router/all_routes'
import { useGetProfile } from '@/apis/user/user.api'
import '../../../assets/css/status-enhancements.css'

const Status = () => {
  const navigate = useNavigate()
  const [selectedStatusUser, setSelectedStatusUser] = useState<string | null>(null)
  const { data: userProfile } = useGetProfile()

  const handleStatusClick = (userId: string) => {
    setSelectedStatusUser(userId)
    navigate(all_routes.userStatus)
  }

  // Lấy avatar từ API, fallback về mock data nếu chưa có
  const myAvatar = userProfile?.avatarUrl || myStatus.avatar

  return (
    <>
      {/* Status List */}
      <div className="chat chat-messages show">
        <div className="user-status-group">
          <div className="status-list">
            {/* My Status */}
            <div className="status-item mb-3">
              <Link 
                to={all_routes.myStatus}
                className="d-flex align-items-center status-user-list"
              >
                <div className="avatar-wrapper status-my-status me-3">
                  <div className="avatar avatar-lg position-relative">
                    <ImageWithBasePath
                      src={myAvatar}
                      className="rounded-circle"
                      alt="Trạng thái của tôi"
                    />
                    <span className="status-add-icon position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                      <i className="ti ti-plus fs-12" />
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">Trạng thái của tôi</h6>
                  <p className="text-muted mb-0 small">Nhấn để thêm trạng thái mới</p>
                </div>
              </Link>
            </div>

            {/* Recent Updates */}
            <div className="mb-3">
              <h6 className="text-muted text-uppercase small mb-2">Cập nhật gần đây</h6>
              {mockStatusUsers.slice(0, 5).map((statusUser, index) => (
                <div key={statusUser.id} className="status-item mb-2" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Link
                    to={all_routes.userStatus}
                    onClick={() => handleStatusClick(statusUser.id)}
                    className="d-flex align-items-center status-user-list"
                  >
                    <div className="avatar-wrapper me-3">
                      <div className="avatar avatar-lg position-relative">
                        <ImageWithBasePath
                          src={statusUser.avatar}
                          className="rounded-circle"
                          alt={statusUser.name}
                        />
                        <span className="status-indicator position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{statusUser.name}</h6>
                      <p className="text-muted mb-0 small">{statusUser.lastStatusTime}</p>
                    </div>
                    <div className="status-count">
                      <span className="badge bg-primary rounded-pill badge-new">{statusUser.statuses.length}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Viewed Updates */}
            {mockStatusUsers.length > 5 && (
              <div className="mb-3">
                <h6 className="text-muted text-uppercase small mb-2">Đã xem</h6>
                {mockStatusUsers.slice(5).map((statusUser) => (
                  <div key={statusUser.id} className="status-item mb-2">
                    <Link
                      to={all_routes.userStatus}
                      onClick={() => handleStatusClick(statusUser.id)}
                      className="d-flex align-items-center status-user-list"
                    >
                      <div className="avatar-wrapper status-viewed me-3">
                        <div className="avatar avatar-lg position-relative">
                          <ImageWithBasePath
                            src={statusUser.avatar}
                            className="rounded-circle"
                            alt={statusUser.name}
                          />
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-0 text-muted">{statusUser.name}</h6>
                        <p className="text-muted mb-0 small">{statusUser.lastStatusTime}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadFile/>
      <NewStatus/>
    </>
  )
}

export default Status