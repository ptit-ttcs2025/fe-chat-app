import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockGroupInfo } from '@/mockData/groupChatData'

const ReportGroup = () => {
  const [blockAndClear, setBlockAndClear] = useState(false)

  const handleReport = () => {
    // Logic để báo cáo nhóm
    console.log('Reporting group:', mockGroupInfo.name)
    console.log('Block and clear:', blockAndClear)
    // Close modal
    const modal = document.getElementById('report-group')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
  }

  return (
    <>
      {/* Report Group */}
      <div className="modal fade" id="report-group">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Báo cáo nhóm</h4>
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
                <div className="block-wrap text-center mb-4">
                  <span className="user-icon mb-3 mx-auto bg-transparent-danger d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px' }}>
                    <i className="ti ti-flag text-danger fs-32" />
                  </span>
                  <div className="d-flex justify-content-center align-items-start mb-3">
                    <i className="ti ti-info-circle me-2 fs-16 text-primary mt-1" />
                    <p className="text-muted mb-0 text-start small">
                      Nếu bạn chặn nhóm này và xóa cuộc trò chuyện, tin nhắn sẽ chỉ bị xóa khỏi thiết bị này và các thiết bị của bạn trên các phiên bản mới hơn của DreamsChat.
                    </p>
                  </div>
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="blockAndClear"
                        id="blockAndClear"
                        checked={blockAndClear}
                        onChange={(e) => setBlockAndClear(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="blockAndClear">
                        Chặn nhóm và xóa cuộc trò chuyện
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row g-3">
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
                      className="btn btn-danger w-100"
                      onClick={handleReport}
                    >
                      Báo cáo
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Report Group */}
    </>
  )
}

export default ReportGroup
