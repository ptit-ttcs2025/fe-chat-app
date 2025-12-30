import { useState } from 'react'
import { Link } from 'react-router-dom'
import VideoModal from '../hooks/video-modal'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import ImageFallback from '@/components/ImageFallback'
import { mockGroupInfo } from '@/mockData/groupChatData'
import { mockUsers } from '@/mockData/usersData'
import { getPicsumAvatarUrl } from '@/lib/imageService'

// Mock data cho yêu cầu tham gia nhóm
interface PendingRequest {
  id: string
  userId: string
  name: string
  avatar: string
  requestedAt: Date
  message?: string
}

// Tạo mock pending requests
const mockPendingRequests: PendingRequest[] = [
  {
    id: 'req-1',
    userId: mockUsers[10]?.id || 'user-11',
    name: mockUsers[10]?.name || 'Phan Văn Minh',
    avatar: mockUsers[10]?.avatar || '',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 giờ trước
    message: 'Xin chào! Tôi muốn tham gia nhóm để học hỏi và đóng góp cho dự án.',
  },
  {
    id: 'req-2',
    userId: mockUsers[11]?.id || 'user-12',
    name: mockUsers[11]?.name || 'Võ Thị Nga',
    avatar: mockUsers[11]?.avatar || '',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 giờ trước
  },
  {
    id: 'req-3',
    userId: 'user-13',
    name: 'Lê Văn Hùng',
    avatar: getPicsumAvatarUrl('Lê Văn Hùng', 200),
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 ngày trước
    message: 'Tôi là developer với 5 năm kinh nghiệm, rất mong được tham gia nhóm.',
  },
]

const GroupInfo = () => {
  const [open1, setOpen1] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(mockPendingRequests)
  const [approveSetting, setApproveSetting] = useState<'on' | 'off'>('on') // Giả sử tính năng đang bật
  const videoUrl = 'https://www.youtube.com/embed/Mj9WJJNp5wA'
  
  const handleOpenModal = () => setShowModal(true)
  const handleCloseModal = () => setShowModal(false)

  const handleApprove = (requestId: string) => {
    // Logic để phê duyệt
    console.log('Approving request:', requestId)
    setPendingRequests(prev => prev.filter(req => req.id !== requestId))
  }

  const handleReject = (requestId: string) => {
    // Logic để từ chối
    console.log('Rejecting request:', requestId)
    setPendingRequests(prev => prev.filter(req => req.id !== requestId))
  }

  const handleApproveAll = () => {
    // Logic để phê duyệt tất cả
    console.log('Approving all requests')
    setPendingRequests([])
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} phút trước`
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`
    } else {
      return `${diffDays} ngày trước`
    }
  }

  // Lấy thông tin nhóm từ mock data
  const groupInfo = mockGroupInfo
  const groupDescription = 'Nơi trao đổi và cộng tác cho dự án Chat App. Cùng nhau xây dựng sản phẩm tuyệt vời!'
  const createdBy = groupInfo.members.find(m => m.role === 'admin')?.name || 'Nguyễn Văn An'
  const createdDate = new Date('2024-01-15')
  
  // Format ngày tạo nhóm
  const formatCreatedDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Filter members based on search
  const filteredMembers = searchQuery
    ? groupInfo.members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groupInfo.members

  // Get status text
  const getStatusText = (isOnline: boolean) => {
    return isOnline ? 'Trực tuyến' : 'Ngoại tuyến'
  }

  // Mock media data
  const groupPhotos = [
    { src: 'https://picsum.photos/id/1015/400/300', alt: 'Ảnh 1' },
    { src: 'https://picsum.photos/id/1016/400/300', alt: 'Ảnh 2' },
    { src: 'https://picsum.photos/id/1018/400/300', alt: 'Ảnh 3' },
    { src: 'https://picsum.photos/id/1020/400/300', alt: 'Ảnh 4' },
    { src: 'https://picsum.photos/id/1021/400/300', alt: 'Ảnh 5' },
  ]

  const groupVideos = [
    { thumbnail: 'https://picsum.photos/id/1022/400/300', url: videoUrl, title: 'Video giới thiệu dự án' },
  ]

  const groupLinks = [
    { url: 'https://github.com/project', icon: 'ti ti-brand-github', title: 'GitHub Repository' },
    { url: 'https://docs.project.com', icon: 'ti ti-file-text', title: 'Tài liệu dự án' },
  ]

  const groupDocuments = [
    { name: 'Tài liệu thiết kế.pdf', size: '2.5 MB', type: 'pdf' },
    { name: 'Yêu cầu dự án.docx', size: '1.8 MB', type: 'doc' },
    { name: 'API Documentation.zip', size: '5.2 MB', type: 'zip' },
  ]

  return (
    <>
      {/* Group Info */}
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="contact-profile"
      >
        <div className="offcanvas-header border-bottom">
          <h4 className="offcanvas-title fw-semibold">Thông tin nhóm</h4>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="offcanvas-body">
          <div className="chat-contact-info">
            <div className="profile-content">
              {/* Group Profile Header */}
              <div className="contact-profile-info">
                <div className="avatar avatar-xxl mb-2 position-relative">
                  <ImageFallback
                    src={groupInfo.avatar}
                    alt={groupInfo.name}
                    type="group-avatar"
                    name={groupInfo.name}
                    className="rounded-circle"
                  />
                  {groupInfo.onlineMembers > 0 && (
                    <span className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" style={{ width: '16px', height: '16px' }} />
                  )}
                </div>
                <h6 className="fw-semibold">{groupInfo.name}</h6>
                <p className="text-muted">
                  Nhóm · {groupInfo.totalMembers} thành viên
                  {/*{groupInfo.onlineMembers > 0 && (*/}
                  {/*  <span className="text-success ms-1">· {groupInfo.onlineMembers} trực tuyến</span>*/}
                  {/*)}*/}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="row gx-3 mb-4">
                <div className="col">
                  <Link
                    className="action-wrap"
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#group_voice"
                  >
                    <i className="ti ti-phone text-primary" />
                    <p className="mb-0 small">Gọi thoại</p>
                  </Link>
                </div>
                <div className="col">
                  <Link
                    className="action-wrap"
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#group_video"
                  >
                    <i className="ti ti-video text-primary" />
                    <p className="mb-0 small">Gọi video</p>
                  </Link>
                </div>
                <div className="col">
                  <Link className="action-wrap" to="#">
                    <i className="ti ti-brand-hipchat text-primary" />
                    <p className="mb-0 small">Trò chuyện</p>
                  </Link>
                </div>
                <div className="col">
                  <Link className="action-wrap" to="#">
                    <i className="ti ti-search text-primary" />
                    <p className="mb-0 small">Tìm kiếm</p>
                  </Link>
                </div>
              </div>

              {/* Profile Info */}
              <div className="content-wrapper">
                <h5 className="sub-title fw-semibold">Thông tin nhóm</h5>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex profile-info-content justify-content-between align-items-center border-bottom pb-3 mb-3">
                      <div className="flex-grow-1">
                        <h6 className="fs-14 fw-semibold mb-1">Mô tả nhóm</h6>
                        <p className="fs-16 mb-0">{groupDescription}</p>
                      </div>
                      <Link 
                        to="#" 
                        className="link-icon ms-2"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-group"
                      >
                        <i className="ti ti-edit-circle fs-18 text-primary" />
                      </Link>
                    </div>
                    <p className="fs-12 text-muted mb-0">
                      <i className="ti ti-calendar me-1" />
                      Nhóm được tạo bởi <strong>{createdBy}</strong>, vào {formatCreatedDate(createdDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Details */}
              <div className="content-wrapper">
                <h5 className="sub-title fw-semibold">Phương tiện</h5>
                <div className="file-item">
                  <div className="accordion accordion-flush chat-accordion" id="mediafile">
                    {/* Photos */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <Link
                          to="#"
                          className="accordion-button collapsed"
                          data-bs-toggle="collapse"
                          data-bs-target="#chatuser-collapse1"
                          aria-expanded="false"
                        >
                          <i className="ti ti-photo-shield me-2 text-primary" />
                          Hình ảnh ({groupPhotos.length})
                        </Link>
                      </h2>
                      <div
                        id="chatuser-collapse1"
                        className="accordion-collapse collapse"
                        data-bs-parent="#mediafile"
                      >
                        <div className="accordion-body">
                          <div className="chat-user-photo">
                            <div className="chat-img contact-gallery">
                              <Lightbox
                                open={open1}
                                close={() => setOpen1(false)}
                                slides={groupPhotos.map(p => ({ src: p.src }))}
                              />
                              {groupPhotos.slice(0, 5).map((photo, index) => (
                                <div key={index} className="img-wrap">
                                  <ImageFallback
                                    src={photo.src}
                                    alt={photo.alt}
                                    type="chat-image"
                                    className="w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                  />
                                  <div className="img-overlay">
                                    <Link
                                      onClick={() => setOpen1(true)}
                                      className="gallery-img"
                                      to="#"
                                    >
                                      <i className="ti ti-eye" />
                                    </Link>
                                    <Link to="#">
                                      <i className="ti ti-download" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {groupPhotos.length > 5 && (
                              <div className="text-center mt-3">
                                <Link
                                  className="view-all link-primary d-inline-flex align-items-center justify-content-center"
                                  to="#"
                                  onClick={() => setOpen1(true)}
                                >
                                  Xem tất cả ({groupPhotos.length} ảnh)
                                  <i className="ti ti-arrow-right ms-2" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Videos */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <Link
                          to="#"
                          className="accordion-button collapsed"
                          data-bs-toggle="collapse"
                          data-bs-target="#media-video"
                          aria-expanded="false"
                        >
                          <i className="ti ti-video me-2 text-primary" />
                          Video ({groupVideos.length})
                        </Link>
                      </h2>
                      <div
                        id="media-video"
                        className="accordion-collapse collapse"
                        data-bs-parent="#mediafile"
                      >
                        <div className="accordion-body">
                          <div className="chat-video">
                            {groupVideos.map((video, index) => (
                              <Link
                                key={index}
                                to="#"
                                className="fancybox video-img"
                                onClick={handleOpenModal}
                              >
                                <ImageFallback
                                  src={video.thumbnail}
                                  alt={video.title}
                                  type="chat-image"
                                  className="w-100"
                                />
                                <span>
                                  <i className="ti ti-player-play-filled" />
                                </span>
                              </Link>
                            ))}
                          </div>
                          <VideoModal show={showModal} handleClose={handleCloseModal} videoUrl={videoUrl} />
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <Link
                          to="#"
                          className="accordion-button collapsed"
                          data-bs-toggle="collapse"
                          data-bs-target="#media-links"
                          aria-expanded="false"
                        >
                          <i className="ti ti-link me-2 text-primary" />
                          Liên kết ({groupLinks.length})
                        </Link>
                      </h2>
                      <div
                        id="media-links"
                        className="accordion-collapse collapse"
                        data-bs-parent="#mediafile"
                      >
                        <div className="accordion-body">
                          {groupLinks.map((link, index) => (
                            <div key={index} className="link-item mb-2">
                              <span className="link-icon">
                                <i className={`${link.icon} fs-18 text-primary`} />
                              </span>
                              <div className="ms-2 flex-grow-1">
                                <h6 className="mb-0 small">{link.title}</h6>
                                <p className="mb-0 text-muted small text-truncate">{link.url}</p>
                              </div>
                              <Link to={link.url} target="_blank" className="ms-2">
                                <i className="ti ti-external-link text-primary" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="accordion-item">
                      <h2 className="accordion-header">
                        <Link
                          to="#"
                          className="accordion-button collapsed"
                          data-bs-toggle="collapse"
                          data-bs-target="#media-document"
                          aria-expanded="false"
                        >
                          <i className="ti ti-file me-2 text-primary" />
                          Tài liệu ({groupDocuments.length})
                        </Link>
                      </h2>
                      <div
                        id="media-document"
                        className="accordion-collapse collapse"
                        data-bs-parent="#mediafile"
                      >
                        <div className="accordion-body">
                          {groupDocuments.map((doc, index) => (
                            <div key={index} className="document-item mb-3">
                              <div className="d-flex align-items-center">
                                <span className="document-icon">
                                  <i className={`ti ti-file-${doc.type === 'pdf' ? 'text' : doc.type === 'zip' ? 'zip' : 'type'}`} />
                                </span>
                                <div className="ms-2 flex-grow-1">
                                  <h6 className="mb-0 small">{doc.name}</h6>
                                  <p className="mb-0 text-muted small">{doc.size}</p>
                                </div>
                              </div>
                              <Link to="#" className="download-icon ms-2">
                                <i className="ti ti-download text-primary" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings & Others */}
              <div className="content-wrapper other-info mb-0">
                <h5 className="sub-title fw-semibold">Cài đặt</h5>
                <div className="card">
                  <div className="card-body list-group profile-item">
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#contact-favourite"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-star me-2 text-warning" />
                          Yêu thích
                        </h6>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-warning count-message me-2">12</span>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#mute-notification"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-volume-off me-2 text-warning" />
                          Tắt thông báo
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#msg-disapper"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-clock-hour-4 me-2 text-info" />
                          Tin nhắn tự xóa
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <div className="accordion accordion-flush">
                      <div className="accordion-item border-bottom">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button px-0 collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#chatuser-encryption"
                            aria-expanded="false"
                          >
                            <i className="ti ti-shield me-2 text-purple" />
                            Mã hóa
                          </Link>
                        </h2>
                        <div
                          id="chatuser-encryption"
                          className="accordion-collapse collapse"
                        >
                          <div className="accordion-body p-0 pb-3">
                            <p className="mb-2 text-muted small">
                              Tin nhắn được mã hóa đầu cuối
                            </p>
                            <div className="text-center">
                              <Link
                                className="view-all link-primary d-inline-flex align-items-center justify-content-center"
                                to="#"
                              >
                                Tìm hiểu thêm
                                <i className="ti ti-arrow-right ms-2" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#group-settings"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-settings me-2 text-primary" />
                          Cài đặt nhóm
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pending Requests - Chỉ hiển thị khi tính năng đang bật và có yêu cầu */}
              {approveSetting === 'on' && pendingRequests.length > 0 && (
                <div className="content-wrapper other-info">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="sub-title fw-semibold mb-0">
                      Yêu cầu tham gia nhóm
                      <span className="badge bg-danger ms-2">{pendingRequests.length}</span>
                    </h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleApproveAll}
                    >
                      <i className="ti ti-check me-1" />
                      Phê duyệt tất cả
                    </button>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="card mb-3 border shadow-sm">
                          <div className="card-body">
                            <div className="d-flex align-items-start">
                              {/* Avatar */}
                              <div className="avatar avatar-lg me-3 flex-shrink-0">
                                <ImageFallback
                                  src={request.avatar}
                                  alt={request.name}
                                  type="avatar"
                                  name={request.name}
                                  className="rounded-circle"
                                />
                              </div>

                              {/* User Info */}
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <div>
                                    <h6 className="mb-0 fw-semibold">{request.name}</h6>
                                    <p className="text-muted small mb-0">
                                      <i className="ti ti-clock me-1" />
                                      {formatTimeAgo(request.requestedAt)}
                                    </p>
                                  </div>
                                </div>

                                {/* Message if available */}
                                {request.message && (
                                  <div className="alert alert-light border p-2 mb-2 small">
                                    <div className="d-flex align-items-start">
                                      <i className="ti ti-message-circle me-2 text-primary mt-1" />
                                      <p className="mb-0">{request.message}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success flex-fill"
                                    onClick={() => handleApprove(request.id)}
                                  >
                                    <i className="ti ti-check me-1" />
                                    Phê duyệt
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger flex-fill"
                                    onClick={() => handleReject(request.id)}
                                  >
                                    <i className="ti ti-x me-1" />
                                    Từ chối
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="content-wrapper other-info">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="sub-title fw-semibold mb-0">
                    {groupInfo.totalMembers} Thành viên
                  </h5>
                  <div className="input-group" style={{ maxWidth: '200px' }}>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="input-group-text">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted">Không tìm thấy thành viên nào</p>
                      </div>
                    ) : (
                      <>
                        {filteredMembers.map((member) => (
                          <div key={member.id} className="card mb-3">
                            <div className="card-body">
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center overflow-hidden flex-grow-1">
                                  <span className={`avatar avatar-lg flex-shrink-0 ${member.isOnline ? 'online' : ''}`}>
                                    <ImageFallback
                                      src={member.avatar}
                                      alt={member.name}
                                      type="avatar"
                                      name={member.name}
                                      className="rounded-circle"
                                    />
                                  </span>
                                  <div className="ms-2 overflow-hidden">
                                    <h6 className="text-truncate mb-1">{member.name}</h6>
                                    <p className="mb-0 text-muted small">{getStatusText(member.isOnline)}</p>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center">
                                  {member.role === 'admin' && (
                                    <span className="badge bg-primary-transparent me-2">
                                      Quản trị viên
                                    </span>
                                  )}
                                  <div className="dropdown">
                                    <Link to="#" data-bs-toggle="dropdown">
                                      <i className="ti ti-dots-vertical" />
                                    </Link>
                                    <ul className="dropdown-menu dropdown-menu-end p-3">
                                      <li>
                                        <Link className="dropdown-item" to="#">
                                          <i className="ti ti-user me-2" />
                                          Xem trang cá nhân
                                        </Link>
                                      </li>
                                      {member.role !== 'admin' && (
                                        <>
                                          <li>
                                            <Link className="dropdown-item" to="#">
                                              <i className="ti ti-user-plus me-2" />
                                              Thêm quyền quản trị
                                            </Link>
                                          </li>
                                          <li>
                                            <Link className="dropdown-item text-danger" to="#">
                                              <i className="ti ti-user-minus me-2" />
                                              Xóa khỏi nhóm
                                            </Link>
                                          </li>
                                        </>
                                      )}
                                      <li>
                                        <hr className="dropdown-divider" />
                                      </li>
                                      <li>
                                        <Link className="dropdown-item text-danger" to="#">
                                          <i className="ti ti-ban me-2" />
                                          Chặn người dùng
                                        </Link>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredMembers.length < groupInfo.totalMembers && (
                          <div className="text-center">
                            <Link
                              className="view-all link-primary d-inline-flex align-items-center justify-content-center"
                              to="#"
                            >
                              Xem tất cả ({groupInfo.totalMembers - filteredMembers.length} thành viên khác)
                              <i className="ti ti-arrow-right ms-2" />
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="content-wrapper other-info mb-0">
                <div className="card mb-0">
                  <div className="card-body list-group profile-item">
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#group-logout"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-logout-2 me-2 text-danger" />
                          Rời nhóm
                        </h6>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#report-group"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-flag me-2 text-danger" />
                          Báo cáo nhóm
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Group Info */}
    </>
  )
}

export default GroupInfo
