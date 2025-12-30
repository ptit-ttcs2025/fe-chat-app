import  { useEffect, useState } from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import { useDispatch, useSelector } from 'react-redux'
import { setMiniSidebar, setMobileSidebar } from '../../../core/data/redux/commonSlice'
import { selectCurrentUser } from '@/slices/auth/reducer'
import { useGetNotifications, useGetUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/apis/notification/notification.api'
import type { INotification } from '@/apis/notification/notification.type'
import { useQueryClient } from '@tanstack/react-query'
import { isValidUrl, getAvatarColor, getInitial } from '@/lib/avatarHelper'

// Format time for notification
const formatNotificationTime = (timestamp: string): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

// Avatar Component với fallback giống contact-tab
interface AvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  size?: number;
}

const Avatar = ({ src, name = "User", className = "", size = 40 }: AvatarProps) => {
  const avatarName = name || "User";
  const initial = getInitial(avatarName);
  const bgColor = getAvatarColor(avatarName);

  if (isValidUrl(src) && src) {
    return (
      <ImageWithBasePath
        src={src}
        className={`rounded-circle ${className}`}
        alt={avatarName}
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
      />
    );
  }

  // Fallback: Avatar với chữ cái đầu
  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        fontSize: `${Math.floor(size * 0.4)}px`
      }}
    >
      {initial}
    </div>
  );
};

const AdminHeader = () => {
  const routes = all_routes
  const [themeSetting , setThemeSetting] = useState(false)
  const [layoutBs, setLayoutBs]= useState(localStorage.getItem("layoutThemeColors") || "light");
  const dispatch = useDispatch();
  const mobileSidebar = useSelector((state: any) => state.common.mobileSidebar);
  const miniSidebar = useSelector((state: any) => state.common.miniSidebar);
  const currentUser = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();

  // Notification hooks
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotifications(0, 10);
  const { data: unreadCount = 0 } = useGetUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };
  const toggleMiniSidebar = () => {
    dispatch(setMiniSidebar(!miniSidebar));
  };
    const LayoutDark = () => {
        localStorage.setItem("layoutThemeColors", "dark");
        setThemeSetting(true);
        setLayoutBs("dark");
        document.documentElement.setAttribute("data-bs-theme","dark");
      };
      const LayoutLight = () => {
        localStorage.setItem("layoutThemeColors", "light");
        // setLayoutTheme("light");
        setLayoutBs("light");

        setThemeSetting(false)
        
        document.documentElement.setAttribute("data-bs-theme", "light");
      };

      useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", layoutBs); 
        layoutBs === "dark" ? setThemeSetting(true) : setThemeSetting(false)
      },[layoutBs,themeSetting])
  return (
    <>
  {/* Header */}
  <div className="header">
    {/* Logo */}
    <div className="header-left active">
      <Link to={routes.dashboard} className="logo logo-normal">
        <ImageWithBasePath src="assets/admin/img/full-logo.svg" alt="Logo" />
      </Link>
      <Link to={routes.dashboard} className="logo-small">
        <ImageWithBasePath src="assets/admin/img/logo-small.svg" alt="Logo" />
      </Link>
    </div>
    {/* /Logo */}
    <Link id="mobile_btn" className="mobile_btn" to="#sidebar" onClick={toggleMobileSidebar}>
      <span className="bar-icon">
        <span />
        <span />
        <span />
      </span>
    </Link>
    <div className="header-user">
      <div className="nav user-menu">
        {/* Search - Giữ lại bố cục cũ nhưng ẩn search input */}
        <div className="nav-item nav-search-inputs me-auto">
          <div className="top-nav-search">
            <Link to="#" className="responsive-search">
              <i className="fa fa-search" />
            </Link>
            <div className="d-flex align-items-center">
              <Link id="toggle_btn" to="#" onClick={toggleMiniSidebar} className="me-2">
                <i className="ti ti-menu-2" />
              </Link>
            </div>
          </div>
        </div>
        {/* /Search */}
        <div className="d-flex align-items-center">
          <div className="provider-head-links ">
            <div className="dark-mode">
              <Link
                to="#"
                id="dark-mode-toggle"
                className={`dark-mode-toggle header-icon ${themeSetting ? "" : "activate"}`}
                onClick={LayoutDark}
                
              >
                <i className="fa-regular fa-moon" />
              </Link>
              <Link
                to="#"
                id="light-mode-toggle"
                className={`dark-mode-toggle header-icon ${themeSetting ? "activate" : ""}`}
                onClick={LayoutLight }
              >
                <i className="ti ti-sun-filled" />
              </Link>
            </div>
          </div>
          <div className="dropdown">
            <Link
              to="#"
              className="header-icon flag-icon"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <ImageWithBasePath
                src="assets/admin/img/flag/flag-01.png"
                alt="Language"
                className="img-fluid rounded-pill"
              />
            </Link>
            <div className="dropdown-menu dropdown-menu-right p-3">
              <Link
                to="#"
                className="dropdown-item active d-flex align-items-center"
              >
                <ImageWithBasePath
                  className="me-2 rounded-pill"
                  src="assets/admin/img/flag/flag-01.png"
                  alt="Img"
                  height={22}
                  width={22}
                />{" "}
                English
              </Link>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
              >
                <ImageWithBasePath
                  className="me-2 rounded-pill"
                  src="assets/admin/img/flag/flag-02.png"
                  alt="Img"
                  height={22}
                  width={22}
                />{" "}
                French
              </Link>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
              >
                <ImageWithBasePath
                  className="me-2 rounded-pill"
                  src="assets/admin/img/flag/flag-03.png"
                  alt="Img"
                  height={22}
                  width={22}
                />{" "}
                Spanish
              </Link>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
              >
                <ImageWithBasePath
                  className="me-2 rounded-pill"
                  src="assets/admin/img/flag/flag-04.png"
                  alt="Img"
                  height={22}
                  width={22}
                />{" "}
                German
              </Link>
            </div>
          </div>
          <div className="provider-head-links">
            <Link
              to="#"
              className={`d-flex align-items-center justify-content-center dropdown-toggle header-icon ${unreadCount > 0 ? 'active-dot' : ''}`}
              data-bs-toggle="dropdown"
            >
              <i className="feather icon-bell fs-16" />
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle" style={{ fontSize: '10px', padding: '2px 5px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="dropdown-menu dropdown-menu-end notification-dropdown p-4" style={{ minWidth: '350px', maxHeight: '500px', overflowY: 'auto' }}>
              <div className="d-flex dropdown-body align-items-center justify-content-between border-bottom p-0 pb-3 mb-3">
                <h6 className="notification-title">
                  Thông báo {unreadCount > 0 && <span className="fs-18 text-gray">({unreadCount})</span>}
                </h6>
                <div className="d-flex align-items-center">
                  {unreadCount > 0 && (
                    <Link 
                      to="#" 
                      className="text-primary fs-15 me-3 lh-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAllAsRead();
                      }}
                    >
                      Đánh dấu tất cả đã đọc
                    </Link>
                  )}
                </div>
              </div>
              <div className="noti-content">
                {notificationsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <p className="mb-0">Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column">
                    {notifications.map((notification: INotification) => (
                      <div 
                        key={notification.id} 
                        className={`border-bottom mb-3 pb-3 ${!notification.isSeen ? 'bg-light' : ''}`}
                        onClick={() => !notification.isSeen && handleMarkAsRead(notification.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex">
                          <span className="avatar avatar-lg me-2 flex-shrink-0">
                            <Avatar
                              src={notification.senderAvatarUrl}
                              name={notification.senderName || 'Hệ thống'}
                              size={40}
                            />
                          </span>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center">
                              <p className="mb-1 w-100">
                                <span className="text-dark fw-semibold">
                                  {notification.senderName || 'Hệ thống'}
                                </span>
                                {" "}
                                {notification.content}
                              </p>
                              {!notification.isSeen && (
                                <span className="d-flex justify-content-end">
                                  <i className="ti ti-point-filled text-primary" />
                                </span>
                              )}
                            </div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          <button
                            className="btn btn-sm btn-link text-danger p-0 ms-2"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            title="Xóa thông báo"
                          >
                            <i className="ti ti-x" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="dropdown">
            <Link to="#" data-bs-toggle="dropdown">
              <div className="booking-user d-flex align-items-center">
                <span className="user-img me-2">
                  <Avatar
                    src={currentUser?.avatarUrl}
                    name={currentUser?.fullName || 'Admin'}
                    size={40}
                  />
                </span>
                <div>
                  <h6 className="fs-14 fw-medium">{currentUser?.fullName || 'Administrator'}</h6>
                  <span className="text-primary fs-12">Quản trị viên</span>
                </div>
              </div>
            </Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link
                  className="dropdown-item d-flex align-items-center"
                  to={routes.login}
                >
                  <i className="ti ti-logout me-1" />
                  Đăng xuất
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    {/* Mobile Menu */}
    <div className="dropdown mobile-user-menu">
      <Link
        to="#"
        className="nav-link dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="fa fa-ellipsis-v" />
      </Link>
      <div className="dropdown-menu dropdown-menu-end">
        <Link className="dropdown-item" to={routes.profileSettings}>
          Cài đặt
        </Link>
        <Link className="dropdown-item" to={routes.login}>
          Đăng xuất
        </Link>
      </div>
    </div>
    {/* /Mobile Menu */}
  </div>
  {/* /Header */}
</>

  )
}

export default AdminHeader