import  { useEffect, useState } from "react";
import ImageWithBasePath from "../imageWithBasePath";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { all_routes } from "../../../feature-module/router/all_routes";
import { Tooltip } from "antd";
import { setDark } from "../../data/redux/commonSlice";
import { useLogout } from '../../../hooks/useLogout';
import { useTotalUnreadCount } from '@/hooks/useUnreadMessages';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

const Sidebar = () => {
  const routes = all_routes;
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode"));
  const { handleLogout } = useLogout();
  const { data: totalUnreadCount } = useTotalUnreadCount();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  // Smart Toggle Handler: Expand sidebar if collapsed when clicking an icon
  const handleIconClick = () => {
    if (isCollapsed) {
      toggleCollapse();
    }
  };

  useEffect(() => {
    const currentDarkMode = localStorage.getItem("darkMode");
    setDarkMode(currentDarkMode);

    if (currentDarkMode === "enabled") {
      dispatch(setDark(true));
    } else {
      dispatch(setDark(false));
    }
  }, [dispatch]);

  return (
    <>
      {/* Left Sidebar Menu */}
      <div className="sidebar-menu">
        <div className="logo">
          <Link to={routes.index} className="logo-normal">
            <ImageWithBasePath src="assets/img/logo.svg" alt="Logo" />
          </Link>
        </div>
        
        {/* No separate Expand Button - clicking any icon expands the sidebar */}
        
        <div className="menu-wrap">
          <div className="main-menu">
            <ul className="nav">
              <Tooltip title="Chat" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to={routes.index}
                    className={
                      location.pathname.includes(routes.index) ||
                      location.pathname.includes(routes.chat)
                        ? "active"
                        : ""
                    }
                    data-bs-toggle="tab"
                    data-bs-target="#chat-menu"
                    onClick={handleIconClick}
                  >
                    <span className="position-relative d-inline-flex align-items-center justify-content-center">
                      <i className="ti ti-message-2-heart" />
                      {totalUnreadCount > 0 && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                          style={{
                            background:
                              "linear-gradient(135deg, #6338F6 0%, #764ba2 100%)",
                            fontSize: "10px",
                            minWidth: "18px",
                          }}
                        >
                          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Contacts" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    data-bs-toggle="tab"
                    data-bs-target="#contact-menu"
                    onClick={handleIconClick}
                  >
                    <i className="ti ti-user-shield" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Group" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    className={
                      location.pathname.includes(routes.groupChat)
                        ? "active"
                        : ""
                    }
                    data-bs-toggle="tab"
                    data-bs-target="#group-menu"
                    onClick={handleIconClick}
                  >
                    <i className="ti ti-users-group" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Calls" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    className={
                      location.pathname.includes(routes.allCalls)
                        ? "active"
                        : ""
                    }
                    data-bs-toggle="tab"
                    data-bs-target="#call-menu"
                    onClick={handleIconClick}
                  >
                    <i className="ti ti-phone" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Status" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    className={
                      location.pathname.includes(routes.status) || location.pathname.includes(routes.myStatus) || location.pathname.includes(routes.userStatus)
                        ? "active"
                        : ""
                    }
                    data-bs-toggle="tab"
                    data-bs-target="#status-menu"
                    onClick={handleIconClick}
                  >
                    <i className="ti ti-chart-donut-2" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Settings" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    data-bs-toggle="tab"
                    data-bs-target="#setting-menu"
                    onClick={handleIconClick}
                  >
                    <i className="ti ti-settings" />
                  </Link>
                </li>
              </Tooltip>
            </ul>
          </div>
          {/* Profile & Logout Section - Compact Icon Style */}
          <div className="profile-menu d-flex flex-column align-items-center gap-3 pb-4 w-100 mt-auto">
            
            {/* Profile Avatar */}
            <Tooltip title="Hồ sơ" placement="right" color={"#6338F6"}>
              <div className="profile-img">
                <Link to={routes.profileSettings} className="profile-img-link d-block" onClick={handleIconClick}>
                  <ImageWithBasePath
                    src="assets/img/profiles/avatar-05.jpg"
                    alt="image"
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid transparent' }}
                  />
                </Link>
              </div>
            </Tooltip>
            
            {/* Logout Button */}
            <Tooltip title="Đăng xuất" placement="right" color={"#ff4d4f"}>
              <button 
                className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  color: '#9ca3af',
                  transition: 'all 0.2s',
                  border: 'none',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff4d4f';
                  e.currentTarget.style.background = '#ff4d4f15';
                  e.currentTarget.style.borderRadius = '8px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="ti ti-logout-2" style={{ fontSize: '22px' }} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {/* /Left Sidebar Menu */}
    </>
  );
};

export default Sidebar;
