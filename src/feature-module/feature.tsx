
import { Outlet } from "react-router";
import {  useSelector } from "react-redux";
import Sidebar from "../core/common/sidebar/sidebar";
import ChatSidebar from "../core/common/sidebar/chatSidebar";
import CommonModals from "../core/modals/common-modals";
import { useModalAutoCleanup, useModalNavigationCleanup } from "@/hooks/useModalAutoCleanup";
import { SelectedFriendProvider } from "@/contexts/SelectedFriendContext";
import { useUnreadWebSocketSync } from "@/hooks/useUnreadWebSocketSync";

const Feature = () => {
  const themeDark = useSelector((state: any) => state?.darkMode);
  
  // Cleanup modal khi route thay đổi và khi dùng browser back/forward
  useModalAutoCleanup();
  useModalNavigationCleanup();
  // Đồng bộ tin nhắn chưa đọc với WebSocket
  useUnreadWebSocketSync();
  
  return (
    <SelectedFriendProvider>
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
    </SelectedFriendProvider>
  );
};

export default Feature;
