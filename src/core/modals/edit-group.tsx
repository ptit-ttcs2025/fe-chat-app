import { useState } from 'react'
import { Link } from 'react-router-dom'

const EditGroup = () => {
  const [editPermission, setEditPermission] = useState<'all' | 'admins'>('all')

  const handleSave = () => {
    // Logic để lưu cài đặt
    console.log('Edit permission:', editPermission)
    // Close modal
    const modal = document.getElementById('edit-group')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
  }

  return (
    <>
      {/* Edit Group Settings */}
      <div className="modal fade" id="edit-group">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Chỉnh sửa cài đặt nhóm</h4>
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
                <div className="block-wrap mb-4">
                  <div className="alert alert-info d-flex align-items-start mb-0">
                    <i className="ti ti-info-circle me-2 mt-1" />
                    <p className="mb-0 small">
                      Chọn ai có thể thay đổi tên nhóm, biểu tượng và mô tả của nhóm này. Họ cũng có thể chỉnh sửa thời gian tin nhắn tự xóa và lưu giữ hoặc bỏ lưu giữ tin nhắn.
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="editPermission"
                      id="edit1"
                      value="all"
                      checked={editPermission === 'all'}
                      onChange={(e) => setEditPermission(e.target.value as 'all' | 'admins')}
                    />
                    <label className="form-check-label" htmlFor="edit1">
                      Tất cả thành viên
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="editPermission"
                      id="edit2"
                      value="admins"
                      checked={editPermission === 'admins'}
                      onChange={(e) => setEditPermission(e.target.value as 'all' | 'admins')}
                    />
                    <label className="form-check-label" htmlFor="edit2">
                      Chỉ quản trị viên
                    </label>
                  </div>
                </div>
                <div className="row g-3 mt-4">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      data-bs-dismiss="modal"
                      aria-label="Close"
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
      {/* /Edit Group Settings */}
    </>
  )
}

export default EditGroup
