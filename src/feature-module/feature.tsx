import { Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";
import Sidebar from "../core/common/sidebar/sidebar";
import ChatSidebar from "../core/common/sidebar/chatSidebar";
import CommonModals from "../core/modals/common-modals";
import { useModalAutoCleanup, useModalNavigationCleanup } from "@/hooks/useModalAutoCleanup";
import { SelectedFriendProvider } from "@/contexts/SelectedFriendContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useUnreadWebSocketSync } from "@/hooks/useUnreadWebSocketSync";
import type { RootState } from "@/store/store";
import { selectCurrentUser } from "@/slices/auth/reducer";
import { userRoutes } from "./router/router.link";

const Feature = () => {
  const themeDark = useSelector((state: RootState) => state.common?.darkMode);
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  
  // Kiểm tra role của user
  const userRole = (user as any)?.role || 'USER';
  const isAdmin = userRole === 'ROLE_ADMIN';
  
  // Kiểm tra xem route hiện tại có phải là user route không
  const isUserRoute = userRoutes.some(route => {
    // Handle exact match
    if (route.path === location.pathname) return true;
    // Handle routes with params (e.g., /chat/:id)
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(location.pathname);
  });
  
  // Kiểm tra xem route có phải là admin route không
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Nếu là admin route hoặc user là admin, không render user layout
  // Admin routes được handle bởi AdminFeature component riêng
  // Return <Outlet /> để cho phép React Router tiếp tục match routes khác (như AdminFeature)
  // Nhưng chỉ khi route thực sự là user route mới render user layout
  if (isAdminRoute || isAdmin || !isUserRoute) {
    return <Outlet />;
  }

  // Cleanup modal khi route thay đổi và khi dùng browser back/forward
  useModalAutoCleanup();
  useModalNavigationCleanup();
  // Đồng bộ tin nhắn chưa đọc với WebSocket chỉ cho user routes
  useUnreadWebSocketSync();
  
  return (
    <SelectedFriendProvider>
      <SidebarProvider>
        <div className={themeDark?'darkmode':''}>
          <div className="main-wrapper" style={{ visibility: "visible" }}>
            <div className="content main_content">
              <Sidebar/>
              <ChatSidebar/>
              <Outlet />
            </div>
            <CommonModals/>
          </div>
        </div>
      </SidebarProvider>
    </SelectedFriendProvider>
  );
};

export default Feature;
