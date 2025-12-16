import { useState } from 'react'
import { Link } from 'react-router-dom'

const MuteNotification = () => {
  const [selectedDuration, setSelectedDuration] = useState<string>('')

  const handleMute = () => {
    if (selectedDuration) {
      // Logic để mute notifications
      console.log('Mute for:', selectedDuration)
      // Close modal
      const modal = document.getElementById('mute-notification')
      if (modal) {
        const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
        bsModal?.hide()
      }
    }
  }

  return (
    <>
      {/* Mute Notifications */}
      <div className="modal fade" id="mute-notification">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Tắt thông báo</h4>
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
                <div className="mb-3">
                  <p className="text-muted small mb-3">
                    Chọn thời gian bạn muốn tắt thông báo cho nhóm này. Bạn vẫn sẽ nhận được tin nhắn nhưng không có thông báo.
                  </p>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute1"
                    value="30m"
                    checked={selectedDuration === '30m'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute1">
                    30 phút
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute2"
                    value="1h"
                    checked={selectedDuration === '1h'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute2">
                    1 giờ
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute3"
                    value="1d"
                    checked={selectedDuration === '1d'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute3">
                    1 ngày
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute4"
                    value="1w"
                    checked={selectedDuration === '1w'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute4">
                    1 tuần
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute5"
                    value="1M"
                    checked={selectedDuration === '1M'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute5">
                    1 tháng
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute6"
                    value="1y"
                    checked={selectedDuration === '1y'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute6">
                    1 năm
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="mute"
                    id="mute7"
                    value="always"
                    checked={selectedDuration === 'always'}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="mute7">
                    Luôn luôn
                  </label>
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
                      className="btn btn-primary w-100"
                      onClick={handleMute}
                      disabled={!selectedDuration}
                    >
                      Tắt thông báo
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Mute Notifications */}
    </>
  )
}

export default MuteNotification
