import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageFallback from '@/components/ImageFallback'
import { mockGroupInfo } from '@/mockData/groupChatData'

const EditAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(
    new Set(mockGroupInfo.members.filter(m => m.role === 'admin').map(m => m.id))
  )

  const handleToggleAdmin = (memberId: string) => {
    const newSelected = new Set(selectedAdmins)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedAdmins(newSelected)
  }

  const handleSave = () => {
    // Logic để lưu danh sách admin
    console.log('Selected admins:', Array.from(selectedAdmins))
    // Close modal
    const modal = document.getElementById('edit-admin')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
  }

  // Filter members based on search
  const filteredMembers = searchQuery
    ? mockGroupInfo.members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockGroupInfo.members

  return (
    <>
      {/* Edit Group Admins */}
      <div className="modal fade" id="edit-admin">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Quản lý quản trị viên</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="search-wrap contact-search mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm thành viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="input-group-text">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </div>
                <h6 className="mb-3 fw-semibold fs-16">Thành viên ({filteredMembers.length})</h6>
                <div className="contact-scroll contact-select mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">Không tìm thấy thành viên nào</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div key={member.id} className="contact-user d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center flex-grow-1">
                          <div className="avatar avatar-lg">
                            <ImageFallback
                              src={member.avatar}
                              alt={member.name}
                              type="avatar"
                              name={member.name}
                              className="rounded-circle"
                            />
                          </div>
                          <div className="ms-2">
                            <h6 className="mb-0">{member.name}</h6>
                            {member.role === 'admin' && (
                              <span className="badge bg-primary-transparent small">Quản trị viên</span>
                            )}
                          </div>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="admin"
                            checked={selectedAdmins.has(member.id)}
                            onChange={() => handleToggleAdmin(member.id)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="alert alert-info d-flex align-items-start mb-3">
                  <i className="ti ti-info-circle me-2 mt-1" />
                  <p className="mb-0 small">
                    Quản trị viên có thể quản lý thành viên, chỉnh sửa thông tin nhóm và các cài đặt quan trọng khác.
                  </p>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      data-bs-dismiss="modal"
                      aria-label="close"
                    >
                      Hủy
                    </button>
                  </div>
                  <div className="col-6">
                    <button 
                      type="button" 
                      data-bs-dismiss="modal" 
                      className="btn btn-primary w-100"
                      onClick={handleSave}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Group Admins */}
    </>
  )
}

export default EditAdmin
