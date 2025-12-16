import { useState } from 'react'
import { Link } from 'react-router-dom'

const ApproveParticipants = () => {
  const [approveSetting, setApproveSetting] = useState<'on' | 'off'>('off')

  const handleSave = () => {
    // Logic để lưu cài đặt
    console.log('Approve participants:', approveSetting)
    // Close modal
    const modal = document.getElementById('approve-participants')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
  }

  return (
    <>
      {/* Approve Participants Settings */}
      <div className="modal fade" id="approve-participants">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Phê duyệt thành viên mới</h4>
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
                      Khi bật tính năng này, quản trị viên phải phê duyệt bất kỳ ai muốn tham gia nhóm này. Điều này giúp kiểm soát tốt hơn việc tham gia nhóm. Các yêu cầu tham gia sẽ hiển thị trong phần Thông tin nhóm.
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="approve"
                      id="approve1"
                      value="off"
                      checked={approveSetting === 'off'}
                      onChange={(e) => setApproveSetting(e.target.value as 'on' | 'off')}
                    />
                    <label className="form-check-label" htmlFor="approve1">
                      Tắt
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="approve"
                      id="approve2"
                      value="on"
                      checked={approveSetting === 'on'}
                      onChange={(e) => setApproveSetting(e.target.value as 'on' | 'off')}
                    />
                    <label className="form-check-label" htmlFor="approve2">
                      Bật
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
      {/* /Approve Participants */}
    </>
  )
}

export default ApproveParticipants
