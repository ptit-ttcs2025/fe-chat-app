import { Link } from 'react-router-dom'

const GroupLogout = () => {
  const handleExitGroup = () => {
    // Logic để rời nhóm
    console.log('Exiting group...')
    // Close modal
    const modal = document.getElementById('group-logout')
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal)
      bsModal?.hide()
    }
    // Navigate hoặc refresh
  }

  return (
    <>
      {/* Exit Group */}
      <div className="modal fade" id="group-logout">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Rời nhóm</h4>
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
                    <i className="ti ti-logout-2 text-danger fs-32" />
                  </span>
                  <div className="d-flex justify-content-center align-items-start">
                    <i className="ti ti-info-circle me-2 fs-16 text-primary mt-1" />
                    <p className="text-muted mb-0 text-start">
                      Chỉ quản trị viên của nhóm sẽ được thông báo khi bạn rời nhóm. Bạn sẽ không thể xem tin nhắn hoặc thông tin nhóm sau khi rời.
                    </p>
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
                      onClick={handleExitGroup}
                    >
                      Rời nhóm
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Exit Group */}
    </>
  )
}

export default GroupLogout
