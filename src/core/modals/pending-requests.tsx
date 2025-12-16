import { useState } from 'react'
import ImageFallback from '@/components/ImageFallback'
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

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(mockPendingRequests)
  const [searchQuery, setSearchQuery] = useState('')

  const handleApprove = (requestId: string) => {
    // Logic để phê duyệt
    console.log('Approving request:', requestId)
    setPendingRequests(prev => prev.filter(req => req.id !== requestId))
    // Show success message
  }

  const handleReject = (requestId: string) => {
    // Logic để từ chối
    console.log('Rejecting request:', requestId)
    setPendingRequests(prev => prev.filter(req => req.id !== requestId))
    // Show success message
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

  // Filter requests based on search
  const filteredRequests = searchQuery
    ? pendingRequests.filter(req =>
        req.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pendingRequests

  return (
    <>
      {/* Pending Requests Modal */}
      <div className="modal fade" id="pending-requests">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <div className="d-flex align-items-center justify-content-between w-100">
                <div>
                  <h4 className="modal-title fw-semibold mb-0">Yêu cầu tham gia nhóm</h4>
                  {pendingRequests.length > 0 && (
                    <p className="text-muted small mb-0 mt-1">
                      {pendingRequests.length} yêu cầu đang chờ phê duyệt
                    </p>
                  )}
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
              {pendingRequests.length > 0 ? (
                <>
                  {/* Header Actions */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="search-wrap contact-search flex-grow-1 me-3">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tìm kiếm yêu cầu..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="input-group-text">
                          <i className="ti ti-search" />
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApproveAll}
                    >
                      <i className="ti ti-check me-1" />
                      Phê duyệt tất cả
                    </button>
                  </div>

                  {/* Requests List */}
                  <div className="contact-scroll contact-select" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <i className="ti ti-search fs-48 text-muted" />
                        </div>
                        <p className="text-muted mb-0">Không tìm thấy yêu cầu nào</p>
                      </div>
                    ) : (
                      filteredRequests.map((request) => (
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
                                  <div className="alert alert-light border p-3 mb-3 small">
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
                                    className="btn btn-success flex-fill"
                                    onClick={() => handleApprove(request.id)}
                                  >
                                    <i className="ti ti-check me-1" />
                                    Phê duyệt
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger flex-fill"
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
                      ))
                    )}
                  </div>
                </>
              ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="ti ti-user-check fs-64 text-muted" />
                    </div>
                    <h5 className="fw-semibold mb-2">Không có yêu cầu nào</h5>
                    <p className="text-muted mb-0">
                      Tất cả yêu cầu tham gia nhóm đã được xử lý
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      {/* /Pending Requests */}
    </>
  )
}

export default PendingRequests

