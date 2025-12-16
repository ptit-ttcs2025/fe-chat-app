import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockGroupInfo } from '@/mockData/groupChatData'

const GroupSettings = () => {
  const [sendMessages, setSendMessages] = useState<'all' | 'admins'>('all')
  const [approveParticipants, setApproveParticipants] = useState<'on' | 'off'>('off')

  const handleSaveSendMessages = () => {
    // Logic để lưu cài đặt
    console.log('Send messages setting:', sendMessages)
  }

  return (
    <>
      {/* Group Settings */}
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="group-settings"
      >
        <div className="offcanvas-header border-bottom">
          <h4 className="offcanvas-title fw-semibold">Cài đặt nhóm</h4>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="offcanvas-body">
          <div className="chat-contact-info">
            <div className="profile-content">
              <div className="content-wrapper other-info">
                <div className="card">
                  <div className="card-body list-group profile-item">
                    {/* Edit Group Settings */}
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#edit-group"
                    >
                      <div className="profile-info">
                        <h6 className="fs-16 fw-semibold">Chỉnh sửa cài đặt nhóm</h6>
                        <p className="text-muted mb-0 small">Tất cả thành viên</p>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>

                    {/* Send Messages Setting */}
                    <div className="accordion accordion-flush chat-accordion list-group-item">
                      <div className="accordion-item w-100">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button py-0 collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#send-privacy"
                            aria-expanded="false"
                            aria-controls="send-privacy"
                          >
                            <i className="ti ti-send me-2 text-primary" />
                            Gửi tin nhắn
                          </Link>
                        </h2>
                        <p className="fs-16 p-0 mb-0 text-muted small">
                          {sendMessages === 'all' ? 'Tất cả thành viên' : 'Chỉ quản trị viên'}
                        </p>
                        <div
                          id="send-privacy"
                          className="accordion-collapse collapse"
                          data-bs-parent="#send-settings"
                        >
                          <div className="accordion-body p-0 pt-3">
                            <div className="form-check mb-3">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="sendMessages"
                                id="participant"
                                checked={sendMessages === 'all'}
                                onChange={() => setSendMessages('all')}
                              />
                              <label className="form-check-label" htmlFor="participant">
                                Tất cả thành viên
                              </label>
                            </div>
                            <div className="form-check mb-3">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="sendMessages"
                                id="admin"
                                checked={sendMessages === 'admins'}
                                onChange={() => setSendMessages('admins')}
                              />
                              <label className="form-check-label" htmlFor="admin">
                                Chỉ quản trị viên
                              </label>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-primary w-100"
                              onClick={handleSaveSendMessages}
                            >
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approve New Participants */}
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="profile-info flex-grow-1">
                          <h6 className="fs-16 fw-semibold mb-1">Phê duyệt thành viên mới</h6>
                          <p className="text-muted mb-0 small">
                            {approveParticipants === 'on' ? 'Bật' : 'Tắt'}
                          </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {approveParticipants === 'on' && (
                            <span className="badge bg-primary">3</span>
                          )}
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target={approveParticipants === 'on' ? '#pending-requests' : '#approve-participants'}
                            className="link-icon"
                          >
                            <i className="ti ti-chevron-right" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Edit Group Admins */}
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#edit-admin"
                    >
                      <div className="profile-info">
                        <h6 className="fs-16 fw-semibold">Quản lý quản trị viên</h6>
                        <p className="text-muted mb-0 small">
                          {mockGroupInfo.members.filter(m => m.role === 'admin').length} quản trị viên
                        </p>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Group Settings */}
    </>
  )
}

export default GroupSettings
