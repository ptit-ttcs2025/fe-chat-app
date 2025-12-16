import { useState } from 'react'
import { Link } from 'react-router-dom'

const MessageDisapper = () => {
  const [selectedDuration, setSelectedDuration] = useState<string>('off')

  const handleSave = () => {
    // Logic để lưu cài đặt
    console.log('Disappearing messages duration:', selectedDuration)
    // Close modal
    const modal = document.getElementById('msg-disapper')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
  }

  return (
    <>
      {/* Disappearing Messages */}
      <div className="modal fade" id="msg-disapper">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Tin nhắn tự xóa</h4>
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
                      Để tăng tính riêng tư và tiết kiệm dung lượng, tất cả tin nhắn mới sẽ tự động xóa khỏi cuộc trò chuyện này cho mọi người sau khoảng thời gian đã chọn, trừ khi được lưu giữ. Bất kỳ ai trong nhóm đều có thể thay đổi cài đặt này.
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="disappear"
                      id="disappear1"
                      value="24h"
                      checked={selectedDuration === '24h'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="disappear1">
                      24 giờ
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="disappear"
                      id="disappear2"
                      value="7d"
                      checked={selectedDuration === '7d'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="disappear2">
                      7 ngày
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="disappear"
                      id="disappear3"
                      value="90d"
                      checked={selectedDuration === '90d'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="disappear3">
                      90 ngày
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="disappear"
                      id="disappear4"
                      value="off"
                      checked={selectedDuration === 'off'}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="disappear4">
                      Tắt
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
      {/* /Disappearing Messages */}
    </>
  )
}

export default MessageDisapper
