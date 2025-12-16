import { Link } from "react-router-dom";
import ImageWithBasePath from "../common/imageWithBasePath";

const AddGroup = () => {
  return (
    <>
      {/* Add Group */}
      <div className="modal fade" id="add-group">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Thêm thành viên</h4>
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
                      placeholder="Tìm kiếm liên hệ..."
                    />
                    <Link to="#" className="input-group-text">
                      <i className="ti ti-search" />
                    </Link>
                  </div>
                </div>
                <h6 className="mb-3 fw-semibold fs-16">Danh bạ</h6>
                <div className="contact-scroll contact-select mb-3">
                  <div className="contact-user d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-lg">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-01.jpg"
                          className="rounded-circle"
                          alt="image"
                        />
                      </div>
                      <div className="ms-2">
                        <h6>Aaryian Jose</h6>
                        <p>App Developer</p>
                      </div>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="contact"
                      />
                    </div>
                  </div>
                  <div className="contact-user d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-lg">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-02.png"
                          className="rounded-circle"
                          alt="image"
                        />
                      </div>
                      <div className="ms-2">
                        <h6>Sarika Jain</h6>
                        <p>UI/UX Designer</p>
                      </div>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="contact"
                      />
                    </div>
                  </div>
                  <div className="contact-user d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-lg">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-03.jpg"
                          className="rounded-circle"
                          alt="image"
                        />
                      </div>
                      <div className="ms-2">
                        <h6>Clyde Smith</h6>
                        <p>Web Developer</p>
                      </div>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="contact"
                      />
                    </div>
                  </div>
                  <div className="contact-user d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-lg">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-04.jpg"
                          className="rounded-circle"
                          alt="image"
                        />
                      </div>
                      <div className="ms-2">
                        <h6>Carla Jenkins</h6>
                        <p>Business Analyst</p>
                      </div>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="contact"
                      />
                    </div>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      data-bs-toggle="modal"
                      data-bs-target="#new-group"
                      onClick={() => {
                        const addGroupModal = document.getElementById('add-group')
                        const newGroupModal = document.getElementById('new-group')
                        if (addGroupModal && newGroupModal) {
                          const bsModal1 = (window as any).bootstrap?.Modal?.getInstance(addGroupModal)
                          const bsModal2 = (window as any).bootstrap?.Modal?.getInstance(newGroupModal)
                          bsModal1?.hide()
                          setTimeout(() => {
                            bsModal2?.show()
                          }, 300)
                        }
                      }}
                    >
                      <i className="ti ti-arrow-left me-1" />
                      Quay lại
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      data-bs-dismiss="modal"
                      className="btn btn-primary w-100"
                    >
                      Tạo nhóm
                      <i className="ti ti-check ms-1" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add group */}
    </>
  );
};

export default AddGroup;
