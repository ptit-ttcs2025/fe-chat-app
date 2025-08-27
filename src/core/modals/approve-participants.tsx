
import { Link } from 'react-router-dom'

const ApproveParticipants = () => {
  return (
    <>
  {/* Edit Group Settings */}
  <div className="modal fade" id="approve-participants">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Edit Group Settings</h4>
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
            <div className="block-wrap mb-3">
              <p className="text-gray-9">
                When turned on, admins must approve anyone who wants to join
                this group.
              </p>
            </div>
            <div className="mb-3">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="mute"
                  id="approve1"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="approve1">
                  Off
                </label>
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="mute"
                  id="approve2"
                />
                <label className="form-check-label" htmlFor="approve2">
                  On
                </label>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <Link
                  to="#"
                  className="btn btn-outline-primary w-100"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  Cancel
                </Link>
              </div>
              <div className="col-6">
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary w-100">
                  Save
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

export default ApproveParticipants