
import ImageWithBasePath from '../imageWithBasePath'
import { Link } from 'react-router-dom'
import { all_routes } from '../../../feature-module/router/all_routes'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { myStatus, mockStatusUsers } from '@/mockData/statusData';

const StatusTab = () => {
    const routes = all_routes;
  return (
    <div id="status" className="sidebar-content active slimscroll">
      <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'scroll', // or 'leave', 'move', etc.
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: '100vh' }}
          >
      <div className="slimscroll">
      <div className="chat-search-header">
        <div className="header-title d-flex align-items-center justify-content-between">
          <h4 className="mb-3">Trạng thái</h4>
          <div className="d-flex align-items-center mb-3">
            <Link
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#new-status"
              className="add-icon text-white bg-primary fs-16 d-flex justify-content-center align-items-center"
            >
              <i className="ti ti-plus" />
            </Link>
          </div>
        </div>
        {/* Chat Search */}
        <div className="search-wrap">
          <form action="#">
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
      <div className="sidebar-body chat-body" id="chatsidebar">
        <div className="status-list">
          {/* Left Chat Title */}
          <div className="d-flex  mb-3">
            <h5>Trạng thái của tôi</h5>
          </div>
          {/* /Left Chat Title */}
          <div className="chat-users-wrap">
            <div className="position-relative">
              <Link to={routes.myStatus} className="chat-user-list mb-0">
                <div className="avatar avatar-lg idle me-2">
                  <ImageWithBasePath
                    src={myStatus.avatar}
                    className="rounded-circle"
                    alt={myStatus.name}
                  />
                </div>
                <div className="chat-user-info">
                  <div className="chat-user-msg">
                    <h6>{myStatus.name}</h6>
                    <p>{myStatus.lastStatusTime}</p>
                  </div>
                </div>
              </Link>
              <div className="chats-dropdown">
                <Link className="#" to="#" data-bs-toggle="dropdown">
                  <i className="ti ti-dots-vertical" />
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link className="dropdown-item" to="#">
                      <i className="ti ti-share-3 me-2" />
                      Chia sẻ trạng thái
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="#">
                      <i className="ti ti-arrow-forward-up-double me-2" />
                      Chuyển tiếp
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
        </div>
        <div className="status-list">
          {/* Left Chat Title */}
          <div className="d-flex  mb-3">
            <h5>Cập nhật gần đây</h5>
          </div>
          {/* /Left Chat Title */}
          <div className="chat-users-wrap">
            {mockStatusUsers.slice(0, 2).map((statusUser) => (
              <div key={statusUser.id} className="position-relative">
                <Link to={routes.userStatus} className={`chat-user-list ${statusUser === mockStatusUsers[1] ? 'mb-0' : ''}`}>
                  <div className="avatar avatar-lg online me-2">
                    <ImageWithBasePath
                      src={statusUser.avatar}
                      className="rounded-circle"
                      alt={statusUser.name}
                    />
                  </div>
                  <div className="chat-user-info">
                    <div className="chat-user-msg">
                      <h6>{statusUser.name}</h6>
                      <p>{statusUser.lastStatusTime}</p>
                    </div>
                  </div>
                </Link>
                <div className="chats-dropdown">
                  <Link className="#" to="#" data-bs-toggle="dropdown">
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link className="dropdown-item" to="#">
                        <i className="ti ti-volume-off me-2" />
                        Tắt tiếng
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="status-list">
          {/* Left Chat Title */}
          <div className="d-flex  mb-3">
            <h5>Đã xem</h5>
          </div>
          {/* /Left Chat Title */}
          <div className="chat-users-wrap">
            {mockStatusUsers.slice(2).map((statusUser, index, array) => (
              <div key={statusUser.id} className="position-relative">
                <Link to={routes.userStatus} className={`chat-user-list ${index === array.length - 1 ? 'mb-0' : ''}`}>
                  <div className={`avatar avatar-lg ${index === 2 ? 'offline' : 'online'} me-2`}>
                    <ImageWithBasePath
                      src={statusUser.avatar}
                      className="rounded-circle"
                      alt={statusUser.name}
                    />
                  </div>
                  <div className="chat-user-info">
                    <div className="chat-user-msg">
                      <h6>{statusUser.name}</h6>
                      <p>{statusUser.lastStatusTime}</p>
                    </div>
                  </div>
                </Link>
                <div className="chats-dropdown">
                  <Link className="#" to="#" data-bs-toggle="dropdown">
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link className="dropdown-item" to="#">
                        <i className="ti ti-volume-off me-2" />
                        Tắt tiếng
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      </OverlayScrollbarsComponent>
    </div>

  )
}

export default StatusTab