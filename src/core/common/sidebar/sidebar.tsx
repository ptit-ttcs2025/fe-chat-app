import { useEffect, useState } from "react";
import ImageWithBasePath from "../imageWithBasePath";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { all_routes } from "../../../feature-module/router/all_routes";
import { Tooltip } from "antd";
import { setDark } from "../../data/redux/commonSlice";
import { useLogout } from "../../../hooks/useLogout";
import { useTotalUnreadCount } from "@/hooks/useUnreadMessages";

const Sidebar = () => {
  const routes = all_routes;
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode"));
  const { handleLogout } = useLogout();
  const { data: totalUnreadCount } = useTotalUnreadCount();
  const LayoutDark = () => {
    if (darkMode === "enabled") {
      localStorage.setItem("darkMode", "enabled");
      dispatch(setDark(true));
      setDarkMode("enabled");
    } else {
      localStorage.setItem("darkMode", "disabled");
      dispatch(setDark(false));
      setDarkMode("disabled");
    }
  };
  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode"));
    LayoutDark();
  }, [darkMode]);

  return (
    <>
      {/* Left Sidebar Menu */}
      <div className="sidebar-menu">
        <div className="logo">
          <Link to={routes.index} className="logo-normal">
            <ImageWithBasePath src="assets/img/logo.svg" alt="Logo" />
          </Link>
        </div>
        <div className="menu-wrap">
          <div className="main-menu">
            <ul className="nav">
              <Tooltip title="Tin nhắn" placement="right" color={"#6338F6 "}>
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
              <Tooltip title="Danh bạ" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    data-bs-toggle="tab"
                    data-bs-target="#contact-menu"
                  >
                    <i className="ti ti-user-shield" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Cộng đồng" placement="right" color={"#6338F6 "}>
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
                  >
                    <i className="ti ti-users-group" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Trạng thái" placement="right" color={"#6338F6 "}>
                <li>
                  {/* {location.pathname.includes(routes.status) || location.pathname.includes(routes.myStatus) || location.pathname.includes(routes.userStatus) ? (
                    <Link
                    to={routes.status}
                    data-bs-toggle="tab"
                    data-bs-target="#status-menu"
                    className={
                      location.pathname.includes(routes.status) || location.pathname.includes(routes.myStatus) || location.pathname.includes(routes.userStatus)
                        ? "active"
                        : ""
                    }
                  >
                    <i className="ti ti-circle-dot" />
                  </Link>
                    
                  ) : (
                    <Link
                      to={routes.status}
                      className={
                        location.pathname.includes(routes.status)
                          ? "active"
                          : ""
                      }
                    >
                      <i className="ti ti-circle-dot" />
                    </Link>
                  )} */}
                  <Link
                    onClick={() => navigate(routes.status)}
                    to={routes.status}
                    data-bs-toggle="tab"
                    data-bs-target="#status-menu"
                    className={
                      location.pathname.includes(routes.status) ||
                      location.pathname.includes(routes.myStatus) ||
                      location.pathname.includes(routes.userStatus)
                        ? "active"
                        : ""
                    }
                  >
                    <i className="ti ti-circle-dot" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Hồ sơ" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    data-bs-toggle="tab"
                    data-bs-target="#profile-menu"
                  >
                    <i className="ti ti-user-circle" />
                  </Link>
                </li>
              </Tooltip>
              <Tooltip title="Cài đặt" placement="right" color={"#6338F6 "}>
                <li>
                  <Link
                    to="#"
                    data-bs-toggle="tab"
                    data-bs-target="#setting-menu"
                  >
                    <i className="ti ti-settings" />
                  </Link>
                </li>
              </Tooltip>
            </ul>
          </div>
          <div className="profile-menu">
            <ul>
              <li>
                <Link
                  to="#"
                  id="dark-mode-toggle"
                  className={`dark-mode-toggle ${
                    darkMode === "disabled" ? "active" : ""
                  }`}
                  onClick={() => setDarkMode("enabled")}
                >
                  <i className="ti ti-moon" />
                </Link>
                <Link
                  to="#"
                  id="light-mode-toggle"
                  className={`dark-mode-toggle ${
                    darkMode === "enabled" ? "active" : ""
                  }`}
                  onClick={() => setDarkMode("disabled")}
                >
                  <i className="ti ti-sun" />
                </Link>
              </li>
              <li>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="avatar avatar-md"
                    data-bs-toggle="dropdown"
                  >
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-16.jpg"
                      alt="img"
                      className="rounded-circle"
                    />
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end p-3">
                    <Link
                      to="#"
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <i className="ti ti-logout-2 me-2" />
                      Logout
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* /Left Sidebar Menu */}
    </>
  );
};

export default Sidebar;
