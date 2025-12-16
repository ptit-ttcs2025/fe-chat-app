import ImageWithBasePath from '../common/imageWithBasePath'
import { mockUsers } from '@/mockData/usersData'

const ViewStatus = () => {
  // Lấy 8-10 người đầu tiên làm danh sách người đã xem status
  const viewedByUsers = mockUsers.slice(0, 10);

  return (
    <>
        {/* view-status */}
        <div className="modal fade" id="view-status">
            <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                <h4 className="modal-title">Đã xem trạng thái</h4>
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
                <form >
                    <div className="contact-scroll contact-select">
                    {viewedByUsers.map((user) => (
                      <div key={user.id} className="contact-user d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-lg">
                            <ImageWithBasePath
                              src={user.avatar}
                              className="rounded-circle"
                              alt={user.name}
                            />
                          </div>
                          <div className="ms-2">
                            <h6>{user.name}</h6>
                            {user.job && <p>{user.job}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                </form>
                </div>
            </div>
            </div>
        </div>
        {/* /view-status */}
    </>

  )
}

export default ViewStatus