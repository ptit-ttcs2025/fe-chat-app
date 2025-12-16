import  { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import {Tooltip} from "antd";
import BlockUser from '../../../core/modals/block-user';
import ClearCalls from '../../../core/modals/clear-calls';
import NewCall from '../../../core/modals/new-call';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { mockCalls, getCallTypeLabel, getCallTypeIcon, getCallTypeBgClass } from '@/mockData/callsData';
const AllCalls = () => {
    const [showCall,setShowCall] = useState(false)
    const [showSearch, setShowSearch] = useState(false);

    const toggleSearch = () => {
      setShowSearch(!showSearch);
    };
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
          <div className="avatar avatar-lg online">
            <ImageWithBasePath
              src={mockCalls[0]?.callerAvatar || "assets/img/profiles/avatar-06.jpg"}
              className="rounded-circle"
              alt={mockCalls[0]?.callerName || "Người gọi"}
            />
          </div>
          <div className="ms-2">
            <h6>{mockCalls[0]?.callerName || "Người gọi"}</h6>
            <span className="last-seen">Trực tuyến</span>
          </div>
        </div>
        <div className="chat-options">
        <ul>
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
                  <Tooltip title="Video Call" placement="bottom">
                    <Link
                      to="#"
                      className="btn"
                      data-bs-toggle="modal"
                      data-bs-target="#video-call"
                    >
                      <i className="ti ti-video" />
                    </Link>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip title="Voice Call" placement="bottom">
                    <Link
                      to="#"
                      className="btn"
                      data-bs-toggle="modal"
                      data-bs-target="#voice_call"
                    >
                      <i className="ti ti-phone" />
                    </Link>
                  </Tooltip>
                </li>

                <li>
                  <Link className="btn no-bg" to="#" data-bs-toggle="dropdown">
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item">
                        <i className="ti ti-copy me-2"></i>Copy Number
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item"
                        data-bs-toggle="modal"
                        data-bs-target="#block-user"
                      >
                        <i className="ti ti-ban me-2"></i>Block
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
        </div>
        {/* Chat Search */}
        <div className="chat-search search-wrap contact-search">
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
          {mockCalls.map((call) => {
            const isIncomingCall = call.type === 'incoming' || call.type === 'progress';
            const isSpecialType = ['incoming', 'progress', 'completed', 'rejected'].includes(call.type);
            
            if (isSpecialType && call.isIncoming) {
              // Render incoming call types
              return (
                <div key={call.id} className="chats incoming d-flex">
                  <div className="chat-content flex-fill">
                    <div className="chat-info">
                      <div className="message-content">
                        <div className="file-attach">
                          <div className="d-flex align-items-center">
                            <span className={`file-icon ${getCallTypeBgClass(call.type)} ${call.type === 'incoming' ? 'incoming-phone' : ''} ${call.type === 'completed' ? 'bg-white' : 'text-white'}`}>
                              <i className={getCallTypeIcon(call.type)} />
                            </span>
                            <div className="ms-2 overflow-hidden me-2">
                              <h6 className="mb-1 text-truncate">{getCallTypeLabel(call.type)}</h6>
                              <span className="text-gray-5 fs-16">
                                {call.type === 'incoming' ? 'Chưa trả lời' : 
                                 call.type === 'progress' ? 'Bạn đã trả lời' :
                                 call.type === 'completed' ? call.duration || '' :
                                 call.type === 'rejected' ? 'Bạn đã từ chối' : ''}
                              </span>
                            </div>
                            {call.type === 'incoming' && (
                              <div className="overlay">
                                <Link
                                  to="#"
                                  onClick={() => setShowCall(true)}
                                  className="badge badge-success me-2"
                                >
                                  Chấp nhận
                                </Link>
                                <Link to="#" className="badge badge-danger">
                                  Từ chối
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Render normal call items (missed, ended)
            return (
              <div key={call.id} className={call.isIncoming ? 'chats' : 'chats chats-right'}>
                {call.isIncoming && (
                  <div className="chat-avatar">
                    <ImageWithBasePath
                      src={call.callerAvatar}
                      className="rounded-circle"
                      alt={call.callerName}
                    />
                  </div>
                )}
                <div className="chat-content">
                  <div className="chat-profile-name" style={{ textAlign: call.isIncoming ? 'left' : 'right' }}>
                    <h6>
                      {call.isIncoming ? call.callerName : 'Bạn'}
                      <i className="ti ti-circle-filled fs-7 mx-2" />
                      <span className="chat-time">{call.timestamp}</span>
                      <span className="msg-read success" />
                    </h6>
                  </div>
                  <div className="chat-info">
                    <div className="message-content">
                      <div className="file-attach">
                        {call.isIncoming ? (
                          <div className="d-flex align-items-center">
                            <span className={`file-icon ${getCallTypeBgClass(call.type)} text-white`}>
                              <i className={getCallTypeIcon(call.type)} />
                            </span>
                            <div className="ms-2 overflow-hidden">
                              <h6 className="mb-1 text-truncate">
                                {getCallTypeLabel(call.type)}
                              </h6>
                              {call.duration && <p>{call.duration}</p>}
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={`file-icon ${getCallTypeBgClass(call.type)} text-white`}>
                              <i className={getCallTypeIcon(call.type)} />
                            </span>
                            <div className="ms-2 overflow-hidden">
                              <h6 className="mb-1">{getCallTypeLabel(call.type)}</h6>
                              {call.duration && <p>{call.duration}</p>}
                            </div>
                          </>
                        )}
                      </div>
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
                {!call.isIncoming && (
                  <div className="chat-avatar">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-17.jpg"
                      className="rounded-circle dreams_chat"
                      alt="Bạn"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </OverlayScrollbarsComponent>
    </div>
    <div className="chat-footer position-relative">
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
          </div>
          <div className="form-btn">
            <button className="btn btn-primary" type="submit">
              <i className="ti ti-send" />
            </button>
          </div>
        </div>
      </form>
      <div className={`card call-details-popup position-absolute ${showCall?'show':''}`}>
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <h4 className="me-2">Chi tiết cuộc gọi</h4>
              <span className="badge border border-primary  text-primary badge-sm me-2">
                <i className="ti ti-point-filled" />
                10:23
              </span>
            </div>
            <Link
              to="#"
              className="float-end user-add bg-primary rounded d-flex justify-content-center align-items-center text-white"
              data-bs-toggle="modal"
              data-bs-target="#video_group"
            >
              <i className="ti ti-user-plus" />
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="avatar avatar-lg me-2">
              <ImageWithBasePath
                src="assets/img/profiles/avatar-17.jpg"
                className="rounded-circle"
                alt="Bạn"
              />
            </div>
            <div className="chat-user-info">
              <div className="chat-user-msg">
                <h6>Bạn</h6>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <div className="avatar avatar-lg me-2">
              <ImageWithBasePath
                src={mockCalls[0]?.callerAvatar || "assets/img/profiles/avatar-06.jpg"}
                className="rounded-circle"
                alt={mockCalls[0]?.callerName || "Người gọi"}
              />
            </div>
            <div className="chat-user-info">
              <div className="chat-user-msg">
                <h6>{mockCalls[0]?.callerName || "Người gọi"}</h6>
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer border-0 pt-0">
          <div className="call-controll-block d-flex align-items-center justify-content-center">
            <Link
              to="#"
              className="call-controll mute-bt d-flex align-items-center justify-content-center"
            >
              <i className="ti ti-microphone" />
            </Link>
            <Link
              to="#"
              className="call-controll d-flex align-items-center justify-content-center"
            >
              <i className="ti ti-volume" />
            </Link>
            <Link
              to="#"
              onClick={()=>setShowCall(false)}
              className="call-controll call-decline d-flex align-items-center justify-content-center"
            >
              <i className="ti ti-phone" />
            </Link>
            <Link
              to="#"
              onClick={()=>setShowCall(false)}
              data-bs-toggle="modal"
              data-bs-target="#voice_attend"
              className="call-controll d-flex align-items-center justify-content-center"
            >
              <i className="ti ti-maximize" />
            </Link>
            <Link
              to="#"
              className="call-controll d-flex align-items-center justify-content-center"
            >
              <i className="ti ti-dots" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BlockUser/>
  <NewCall/>
  <ClearCalls/>
  {/* /Chat */}
</>
  )
}

export default AllCalls
