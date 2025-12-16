import  { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {Tooltip} from "antd";
import CommonGroupModal from "../../../core/modals/common-group-modal";
import { all_routes } from "../../router/all_routes";
import ForwardMessage from "../../../core/modals/forward-message";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { mockGroupInfo, mockGroupMessages } from '@/mockData/groupChatData';

const GroupChat = () => {
  const [open1, setOpen1] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showEmoji, setShowEmoji] = useState<Record<number, boolean>>({});
  const toggleEmoji = (groupId: number) => {
    setShowEmoji((prev) => ({
      ...prev,
      [groupId]: !prev[groupId], // Toggle the state for this specific group
    }));
  };
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };
  const routes = all_routes;
  useEffect(() => {
    document.querySelectorAll(".chat-user-list").forEach(function (element) {
      element.addEventListener("click", function () {
        if (window.innerWidth <= 992) {
          const showChat = document.querySelector(".chat-messages");
          if (showChat) {
            showChat.classList.add("show");
          }
        }
      });
    });
    document.querySelectorAll(".chat-close").forEach(function (element) {
      element.addEventListener("click", function () {
        if (window.innerWidth <= 992) {
          const hideChat = document.querySelector(".chat-messages");
          if (hideChat) {
            hideChat.classList.remove("show");
          }
        }
      });
    });
  }, []);
  return (
      <>
        {/* Chat */}
        <div className="chat chat-messages show" id="middle">
          <div>
            <div className="chat-header">
              <div className="user-details">
                <div className="d-xl-none">
                  <Link className="text-muted chat-close me-2" to="#">
                    <i className="fas fa-arrow-left" />
                  </Link>
                </div>
                <div className="avatar avatar-lg online flex-shrink-0">
                  <ImageWithBasePath
                    src={mockGroupInfo.avatar}
                    className="rounded-circle"
                    alt={mockGroupInfo.name}
                  />
                </div>
                <div className="ms-2 overflow-hidden">
                  <h6>{mockGroupInfo.name}</h6>
                  <p className="last-seen text-truncate">
                    {mockGroupInfo.totalMembers} thành viên, <span className="text-success">{mockGroupInfo.onlineMembers} trực tuyến</span>
                  </p>
                </div>
              </div>
              <div className="chat-options">
                <ul>
                  <li>
                    <div className="avatar-list-stacked avatar-group-md d-flex">
                      {mockGroupInfo.members.slice(0, 4).map((member) => (
                        <span key={member.id} className="avatar avatar-rounded">
                        <ImageWithBasePath
                            src={member.avatar}
                            alt={member.name}
                        />
                      </span>
                      ))}
                      {mockGroupInfo.totalMembers > 4 && (
                      <Link
                        className="avatar bg-primary avatar-rounded text-fixed-white"
                        to="#"
                      >
                          {mockGroupInfo.totalMembers - 4}+
                      </Link>
                      )}
                    </div>
                  </li>
                  <li>
                    <Tooltip title="Search" placement="bottom">
                      <Link
                        to="#"
                        className="btn chat-search-btn"
                        onClick={() => toggleSearch()}
                      >
                        <i className="ti ti-search" />
                      </Link>
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip title="Group Info" placement="bottom">
                      <Link
                        to="#"
                        className="btn position-relative"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#contact-profile"
                      >
                        <i className="ti ti-info-circle" />
                        {/* Badge đếm yêu cầu tham gia nhóm - chỉ hiển thị khi có yêu cầu và tính năng đang bật */}
                        {3 > 0 && (
                          <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{
                              fontSize: "10px",
                              minWidth: "18px",
                              height: "18px",
                              padding: "2px 6px",
                            }}
                          >
                            {3 > 99 ? "99+" : 3}
                          </span>
                        )}
                      </Link>
                    </Tooltip>
                  </li>
                  <li>
                    <Link
                      className="btn no-bg"
                      to="#"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to={routes.index} className="dropdown-item">
                          <i className="ti ti-x me-2" />
                          Đóng nhóm
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#mute-notification"
                        >
                          <i className="ti ti-volume-off me-2" />
                          Tắt thông báo
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#disappearing-messages"
                        >
                          <i className="ti ti-clock-hour-4 me-2" />
                          Tin nhắn tự xóa
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#clear-chat"
                        >
                          <i className="ti ti-clear-all me-2" />
                          Xóa tin nhắn
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#delete-chat"
                        >
                          <i className="ti ti-trash me-2" />
                          Xóa nhóm
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#report-user"
                        >
                          <i className="ti ti-thumb-down me-2" />
                          Báo cáo
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#block-user"
                        >
                          <i className="ti ti-ban me-2" />
                          Chặn
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              {/* Chat Search */}
              <div
                className={`chat-search search-wrap contact-search ${
                  showSearch ? "visible-chat" : ""
                }`}
              >
                <form>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm liên hệ"
                    />
                    <span className="input-group-text">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </form>
              </div>
              {/* /Chat Search */}
            </div>
            <OverlayScrollbarsComponent
              options={{
                scrollbars: {
                  autoHide: 'scroll',
                  autoHideDelay: 1000,
                },
              }}
              style={{ maxHeight: '88vh' }}
            >
              <div className="chat-body chat-page-group ">
                <div className="messages">
                  {mockGroupMessages.map((message, index) => (
                    <div key={message.id} className={message.isOwn ? 'chats chats-right' : 'chats'}>
                      {!message.isOwn && (
                    <div className="chat-avatar">
                      <ImageWithBasePath
                            src={message.senderAvatar}
                        className="rounded-circle"
                            alt={message.senderName}
                      />
                    </div>
                      )}
                    <div className="chat-content">
                        <div className="chat-profile-name" style={{ textAlign: message.isOwn ? 'right' : 'left' }}>
                        <h6>
                            {message.senderName}
                          <i className="ti ti-circle-filled fs-7 mx-2" />
                            <span className="chat-time">{message.timestamp}</span>
                            {message.isOwn && (
                          <span className="msg-read success">
                            <i className="ti ti-checks" />
                          </span>
                            )}
                        </h6>
                      </div>
                      <div className="chat-info">
                        <div className="message-content">
                            {message.type === 'text' && (
                              <>{message.content}</>
                            )}
                            {message.type === 'image' && (
                              <div className="chat-image">
                                        <ImageWithBasePath
                                  src={message.content}
                                  alt="Hình ảnh"
                                  className="img-fluid rounded"
                                  onClick={() => setOpen1(true)}
                                />
                                </div>
                            )}
                            {message.type === 'file' && (
                          <div className="file-attach">
                                <div className="d-flex align-items-center">
                                  <span className="file-icon bg-primary text-white">
                                    <i className="ti ti-file-text" />
                            </span>
                            <div className="ms-2 overflow-hidden">
                                    <h6 className="mb-1 text-truncate">{message.content}</h6>
                                    <p className="text-muted mb-0 small">Tài liệu</p>
                            </div>
                          </div>
                                </div>
                            )}
                            {message.type === 'voice' && (
                          <div className="file-attach">
                            <div className="d-flex align-items-center">
                                  <span className="file-icon bg-info text-white">
                                    <i className="ti ti-microphone" />
                              </span>
                              <div className="ms-2 overflow-hidden">
                                    <h6 className="mb-1 text-truncate">{message.content}</h6>
                                    <p className="text-muted mb-0 small">Tin nhắn thoại</p>
                              </div>
                            </div>
                          </div>
                            )}
                        </div>
                        <div className="chat-actions">
                          <Link className="#" to="#" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <Link className="dropdown-item" to="#">
                                <i className="ti ti-heart me-2" />
                                  Trả lời
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" to="#">
                                  <i className="ti ti-pinned me-2" />
                                  Chuyển tiếp
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" to="#">
                                  <i className="ti ti-file-export me-2" />
                                  Sao chép
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" to="#">
                                <i className="ti ti-trash me-2" />
                                  Xóa
                              </Link>
                            </li>
                          </ul>
                        </div>
                            </div>
                          </div>
                      {message.isOwn && (
                    <div className="chat-avatar">
                      <ImageWithBasePath
                            src={message.senderAvatar}
                        className="rounded-circle dreams_chat"
                            alt="Bạn"
                      />
                    </div>
                      )}
                  </div>
                  ))}
                </div>
              </div>
            </OverlayScrollbarsComponent>
          </div>
          <div className="chat-footer">
            <form className="footer-form">
              <div className="chat-footer-wrap">
                <div className="form-item">
                  <Link to="#" className="action-circle">
                    <i className="ti ti-microphone" />
                  </Link>
                </div>
                <div className="form-wrap">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tin nhắn của bạn"
                  />
                </div>
                <div className="form-item emoj-action-foot">
                  <Link to="#" className="action-circle">
                    <i className="ti ti-mood-smile" />
                  </Link>
                </div>
                <div className="form-item position-relative d-flex align-items-center justify-content-center ">
                  <Link to="#" className="action-circle file-action position-absolute">
                    <i className="ti ti-folder" />
                  </Link>
                  <input
                    type="file"
                    className="open-file position-relative"
                    name="files"
                    id="files"
                  />
                </div>
                <div className="form-item">
                  <Link to="#" data-bs-toggle="dropdown">
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end p-3">
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-file-text me-2" />
                      Tài liệu
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-camera-selfie me-2" />
                      Máy ảnh
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-photo-up me-2" />
                      Thư viện
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-music me-2" />
                      Âm thanh
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-map-pin-share me-2" />
                      Vị trí
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-user-check me-2" />
                      Liên hệ
                    </Link>
                  </div>
                </div>
                <div className="form-btn">
                  <button className="btn btn-primary" type="submit">
                    <i className="ti ti-send" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      <Lightbox
        open={open1}
        close={() => setOpen1(false)}
        slides={mockGroupMessages
          .filter(msg => msg.type === 'image')
          .map(msg => ({ src: msg.content }))}
      />
      <CommonGroupModal />
      <ForwardMessage />
    </>
  )
}

export default GroupChat;
