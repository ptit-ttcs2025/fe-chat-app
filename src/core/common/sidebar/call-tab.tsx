import  { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../imageWithBasePath'
import { all_routes } from '../../../feature-module/router/all_routes'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { mockCalls, getCallTypeIcon } from '@/mockData/callsData';

export const CallTab = () => {
    const routes = all_routes
    const [activeTab,setActiveTab] = useState('Tất cả cuộc gọi')
    
    // Filter calls based on active tab
    const getFilteredCalls = () => {
      switch(activeTab) {
        case 'Cuộc gọi thoại':
          return mockCalls.filter(call => call.type.includes('audio'))
        case 'Cuộc gọi video':
          return mockCalls.filter(call => call.type.includes('video'))
        default:
          return mockCalls
      }
    }
    
    const filteredCalls = getFilteredCalls().slice(0, 8) // Show first 8 calls
    
    // Helper to get icon class based on call type and direction
    const getCallIcon = (call: typeof mockCalls[0]) => {
      if (call.type.includes('video')) {
        return call.isIncoming ? 'ti ti-video' : 'ti ti-video-outgoing'
      } else {
        return call.isIncoming ? 'ti ti-phone-incoming' : 'ti ti-phone-outgoing'
      }
    }
    
    // Helper to get icon color
    const getCallIconColor = (call: typeof mockCalls[0]) => {
      if (call.type.includes('missed')) return 'text-danger'
      if (call.type.includes('ended') || call.type === 'completed') return 'text-success'
      return call.isIncoming ? 'text-success' : 'text-purple'
    }
    
  return (
    <>
        <div className="sidebar-content active slimscroll">
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
                <h4 className="mb-3">Cuộc gọi</h4>
                <div className="d-flex align-items-center mb-3">
                  <Link
                    to="#"
                    className="call-icon d-flex justify-content-center align-items-center text-white bg-primary rounded-circle me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#new-call"
                  >
                    <i className="ti ti-phone-plus fs-16" />
                  </Link>
                  <div className="dropdown">
                    <Link
                      to="#"
                      data-bs-toggle="dropdown"
                      className="fs-16 text-default"
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <ul className="dropdown-menu p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item d-flex align-items-center"
                          data-bs-toggle="modal"
                          data-bs-target="#clear-call"
                        >
                          <span>
                            <i className="ti ti-phone-x" />
                          </span>
                          Xóa lịch sử cuộc gọi
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Chat Search */}
              <div className="search-wrap">
                <form >
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm"
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
              {/* Left Chat Title */}
              <div className="d-flex  align-items-center mb-3">
                <h5 className="chat-title2 me-2">{activeTab}</h5>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="text-default fs-16"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ti ti-chevron-down" />
                  </Link>
                  <ul
                    className=" dropdown-menu dropdown-menu-end p-3"
                    id="innerTab"
                    role="tablist"
                  >
                    <li role="presentation">
                      <Link
                        className="dropdown-item active"
                        id="all-calls-tab"
                        data-bs-toggle="tab"
                        to="#all-calls"
                        role="tab"
                        aria-controls="all-calls"
                        aria-selected="true"
                        onClick={()=>setActiveTab('Tất cả cuộc gọi')}
                      >
                        Tất cả cuộc gọi
                      </Link>
                    </li>
                    <li role="presentation">
                      <Link
                        className="dropdown-item"
                        id="audio-calls-tab"
                        data-bs-toggle="tab"
                        to="#audio-calls"
                        role="tab"
                        aria-controls="audio-calls"
                        aria-selected="false"
                        onClick={()=>setActiveTab('Cuộc gọi thoại')}
                      >
                        Cuộc gọi thoại
                      </Link>
                    </li>
                    <li role="presentation">
                      <Link
                        className="dropdown-item"
                        id="video-calls-tab"
                        data-bs-toggle="tab"
                        to="#video-calls"
                        role="tab"
                        aria-controls="video-calls"
                        aria-selected="false"
                        onClick={()=>setActiveTab('Cuộc gọi video')}
                      >
                        Cuộc gọi video
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              {/* /Left Chat Title */}
              <div className="tab-content" id="innerTabContent">
                <div
                  className="tab-pane fade show active"
                  id="all-calls"
                  role="tabpanel"
                  aria-labelledby="all-calls-tab"
                >
                  <div className="chat-users-wrap">
                    {filteredCalls.map((call) => (
                      <div key={call.id} className="chat-list">
                        <Link to={routes.allCalls} className="chat-user-list">
                          <div className="avatar avatar-lg online me-2">
                            <ImageWithBasePath
                              src={call.callerAvatar}
                              className="rounded-circle"
                              alt={call.callerName}
                            />
                          </div>
                          <div className="chat-user-info">
                            <div className="chat-user-msg">
                              <h6>{call.callerName}</h6>
                              <p>
                                <i className={`${getCallIcon(call)} ${getCallIconColor(call)} me-2`} />
                                {call.timestamp}
                              </p>
                            </div>
                            <div className="chat-user-time">
                              <span className="time">{call.duration || ''}</span>
                              <div>
                                <i className={`${getCallTypeIcon(call.type)} text-pink`} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="audio-calls"
                  role="tabpanel"
                  aria-labelledby="audio-calls-tab"
                >
                  <div className="chat-users-wrap">
                    {getFilteredCalls().filter(call => call.type.includes('audio')).slice(0, 8).map((call) => (
                      <div key={call.id} className="chat-list">
                        <Link to={routes.allCalls} className="chat-user-list">
                          <div className="avatar avatar-lg online me-2">
                            <ImageWithBasePath
                              src={call.callerAvatar}
                              className="rounded-circle"
                              alt={call.callerName}
                            />
                          </div>
                          <div className="chat-user-info">
                            <div className="chat-user-msg">
                              <h6>{call.callerName}</h6>
                              <p>
                                <i className={`${getCallIcon(call)} ${getCallIconColor(call)} me-2`} />
                                {call.timestamp}
                              </p>
                            </div>
                            <div className="chat-user-time">
                              <span className="time">{call.duration || ''}</span>
                              <div>
                                <i className={`${getCallTypeIcon(call.type)} text-pink`} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="video-calls"
                  role="tabpanel"
                  aria-labelledby="video-calls-tab"
                >
                  <div className="chat-users-wrap">
                    {getFilteredCalls().filter(call => call.type.includes('video')).slice(0, 8).map((call) => (
                      <div key={call.id} className="chat-list">
                        <Link to={routes.allCalls} className="chat-user-list">
                          <div className="avatar avatar-lg online me-2">
                            <ImageWithBasePath
                              src={call.callerAvatar}
                              className="rounded-circle"
                              alt={call.callerName}
                            />
                          </div>
                          <div className="chat-user-info">
                            <div className="chat-user-msg">
                              <h6>{call.callerName}</h6>
                              <p>
                                <i className={`${getCallIcon(call)} ${getCallIconColor(call)} me-2`} />
                                {call.timestamp}
                              </p>
                            </div>
                            <div className="chat-user-time">
                              <span className="time">{call.duration || ''}</span>
                              <div>
                                <i className={`${getCallTypeIcon(call.type)} text-pink`} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </OverlayScrollbarsComponent>
        </div>
    </>
  )
}
