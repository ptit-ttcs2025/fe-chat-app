import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { all_routes } from "../../../feature-module/router/all_routes";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { useChatConversations } from "@/hooks/useChatConversations";
import ImageFallback from "@/components/ImageFallback";
import type { IConversation } from "@/apis/chat/chat.type";
import { setSelectedConversation } from "@/core/data/redux/commonSlice";

const GroupTab = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch only GROUP conversations
  const { conversations, isLoading } = useChatConversations({
    pageSize: 50,
    autoRefresh: true,
    type: "GROUP", // Only fetch group conversations
  });

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle conversation click
  const handleConversationClick = (conversation: IConversation, e: React.MouseEvent) => {
    e.preventDefault();

    console.log('🏢 [GroupTab] Selecting GROUP conversation:', {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      groupId: conversation.groupId,
      hasGroupId: !!conversation.groupId,
    });

    // Dispatch Redux action to set selected conversation
    dispatch(setSelectedConversation(conversation.id));
    // Navigate to unified chat page (not group-chat)
    navigate(routes.chat);
  };

  // Format time
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "Hôm qua";
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  // Get avatar display
  const getAvatarDisplay = (conversation: IConversation) => {
    if (conversation.avatarUrl) {
      return (
        <ImageFallback
          src={conversation.avatarUrl}
          alt={conversation.name || "Group"}
          type="group-avatar"
          className="rounded-circle"
        />
      );
    }

    // Generate initials from group name
    const initials = conversation.name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'G';

    return (
      <span className="avatar-title fs-14 fw-medium">{initials}</span>
    );
  };

  // Get last message preview
  const getLastMessagePreview = (conversation: IConversation) => {
    const lastMsg = conversation.lastMessage;

    if (!lastMsg) {
      return <p className="text-muted">Chưa có tin nhắn</p>;
    }

    // Handle different message types
    switch (lastMsg.type) {
      case 'IMAGE':
        return (
          <p>
            <i className="ti ti-photo me-2" />
            Ảnh
          </p>
        );
      case 'FILE':
        return (
          <p>
            <i className="ti ti-file me-2" />
            File
          </p>
        );
      case 'VOICE':
        return (
          <p>
            <i className="ti ti-microphone me-2" />
            Tin nhắn thoại
          </p>
        );
      default:
        return <p>{lastMsg.content}</p>;
    }
  };

  return (
    <>
      {/* Chats sidebar */}
      <div className="sidebar-content active slimscroll">
      <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'scroll',
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: '100vh' }}
          >
        <div className="slimscroll">
          <div className="chat-search-header">
            <div className="header-title d-flex align-items-center justify-content-between">
              <h4 className="mb-3">Nhóm</h4>
              <div className="d-flex align-items-center mb-3">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#new-group"
                  className="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16 me-2"
                >
                  <i className="ti ti-plus" />
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
                        className="dropdown-item"
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#invite"
                      >
                        <i className="ti ti-send me-2" />
                        Mời người khác
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Chat Search */}
            <div className="search-wrap">
              <form>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm liên hệ hoặc tin nhắn"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="input-group-text">
                    <i className="ti ti-search" />
                  </span>
                </div>
              </form>
            </div>
            {/* /Chat Search */}
          </div>
          <div className="sidebar-body chat-body">
            {/* Left Chat Title */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Tất cả nhóm</h5>
            </div>
            {/* /Left Chat Title */}
            <div className="chat-users-wrap">
              <div className="chat-list">
                {filteredConversations.length === 0 && !isLoading && (
                  <p className="text-muted text-center py-3">Không tìm thấy nhóm nào</p>
                )}
                {filteredConversations.map((conversation) => (
                  <div key={conversation.id} className="position-relative">
                    <Link
                      to={routes.chat}
                      className="chat-user-list"
                      onClick={(e) => handleConversationClick(conversation, e)}
                    >
                      <div className="avatar avatar-lg online me-2">
                        {getAvatarDisplay(conversation)}
                      </div>
                      <div className="chat-user-info">
                        <div className="chat-user-msg">
                          <h6>{conversation.name}</h6>
                          {getLastMessagePreview(conversation)}
                        </div>
                        <div className="chat-user-time">
                          <span className="time">{formatTime(conversation.updatedAt)}</span>
                          <div className="chat-pin">
                            {conversation.pinned && (
                              <i className="ti ti-pin me-2" />
                            )}
                            {conversation.unreadCount > 0 && (
                              <span className="count-message fs-12 fw-semibold">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="chat-dropdown">
                      <Link className="#" to="#" data-bs-toggle="dropdown">
                        <i className="ti ti-dots-vertical" />
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-box-align-right me-2" />
                            Lưu trữ nhóm
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-volume-off me-2" />
                            Tắt thông báo
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-logout-2 me-2" />
                            Rời khỏi nhóm
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-pinned me-2" />
                            Ghim nhóm
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-square-check me-2" />
                            Đánh dấu chưa đọc
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div> {/* <-- Add this closing div for 'slimscroll' */}
        </OverlayScrollbarsComponent>
      </div>
      {/* / Chats sidebar */}
    </>
  );
};

export default GroupTab;
