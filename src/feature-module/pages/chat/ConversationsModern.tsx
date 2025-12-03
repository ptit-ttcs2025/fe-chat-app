/**
 * ConversationsModern - Sidebar danh sách cuộc trò chuyện hiện đại
 * Tích hợp API với UI/UX cải tiến
 */

import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Tooltip } from "antd";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";

// Components
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

// Hooks & APIs
import { useChatConversations } from "@/hooks/useChatConversations";
import type { IConversation } from "@/apis/chat/chat.type";

interface RootState {
  auth: {
    user: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    } | null;
  };
}

interface ConversationsModernProps {
  onConversationSelect: (conversation: IConversation) => void;
  selectedConversationId: string | null;
}

const ConversationsModern: React.FC<ConversationsModernProps> = ({
  onConversationSelect,
  selectedConversationId,
}) => {
  // ==================== Redux State ====================
  const user = useSelector((state: RootState) => state.auth.user);

  // ==================== Local State ====================
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PRIVATE" | "GROUP">(
    "ALL"
  );
  const [showArchived, setShowArchived] = useState(false);

  // ==================== Custom Hooks - API Integration ====================
  const {
    conversations,
    isLoading,
    refetchConversations,
    toggleMute,
    togglePin,
    deleteConversation,
  } = useChatConversations({
    pageSize: 50,
    autoRefresh: true,
  });

  // ==================== Computed Values ====================
  const filteredConversations = useMemo(() => {
    let result = conversations || [];

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(
        (conv) =>
          conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== "ALL") {
      result = result.filter((conv) => conv.type === filterType);
    }

    // Filter archived
    if (!showArchived) {
      result = result.filter((conv) => !conv.archived);
    }

    // Sort: Pinned first, then by last message time
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return timeB - timeA;
    });

    return result;
  }, [conversations, searchQuery, filterType, showArchived]);

  // ==================== Handlers ====================
  const handleConversationClick = useCallback(
    (conversation: IConversation) => {
      onConversationSelect(conversation);
    },
    [onConversationSelect]
  );

  const handleTogglePin = useCallback(
    (e: React.MouseEvent, conversationId: string, currentlyPinned: boolean) => {
      e.stopPropagation();
      togglePin(conversationId, !currentlyPinned);
    },
    [togglePin]
  );

  const handleToggleMute = useCallback(
    (e: React.MouseEvent, conversationId: string, currentlyMuted: boolean) => {
      e.stopPropagation();
      toggleMute(conversationId, !currentlyMuted);
    },
    [toggleMute]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, conversationId: string) => {
      e.stopPropagation();
      if (window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) {
        deleteConversation(conversationId);
      }
    },
    [deleteConversation]
  );

  // ==================== Render Helpers ====================
  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Vừa xong";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ`;
    } else if (diffInHours < 48) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const getConversationName = (conversation: IConversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "GROUP") return "Nhóm chat";
    return "Cuộc trò chuyện";
  };

  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl || "assets/img/profiles/avatar-default.jpg";
  };

  const getLastMessagePreview = (conversation: IConversation) => {
    if (!conversation.lastMessage) return "Chưa có tin nhắn";

    const { content, type, senderName, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === user?.id;
    const prefix = isOwnMessage ? "Bạn: " : `${senderName}: `;

    if (type === "TEXT") {
      return `${prefix}${content}`;
    } else if (type === "IMAGE") {
      return `${prefix}📷 Hình ảnh`;
    } else if (type === "FILE") {
      return `${prefix}📎 File`;
    } else if (type === "AUDIO") {
      return `${prefix}🎵 Âm thanh`;
    } else {
      return `${prefix}Tin nhắn`;
    }
  };

  // ==================== Render ====================
  return (
    <div className="sidebar-group conversations-sidebar-modern">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            <i className="ti ti-message-circle me-2 gradient-text" />
            Tin nhắn
          </h5>
          <div className="d-flex gap-2">
            <Tooltip title="Tạo nhóm" placement="bottom">
              <Link to="#" className="btn btn-sm btn-primary">
                <i className="ti ti-plus" />
              </Link>
            </Tooltip>
            <Tooltip title="Làm mới" placement="bottom">
              <Link
                to="#"
                className="btn btn-sm btn-outline-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  refetchConversations();
                }}
              >
                <i className="ti ti-refresh" />
              </Link>
            </Tooltip>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrap mt-3">
          <form>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm cuộc trò chuyện... 🔍"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs mt-3">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <button
                className={`nav-link ${filterType === "ALL" ? "active" : ""}`}
                onClick={() => setFilterType("ALL")}
              >
                Tất cả
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  filterType === "PRIVATE" ? "active" : ""
                }`}
                onClick={() => setFilterType("PRIVATE")}
              >
                Riêng tư
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${filterType === "GROUP" ? "active" : ""}`}
                onClick={() => setFilterType("GROUP")}
              >
                Nhóm
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Conversations List */}
      <OverlayScrollbarsComponent
        options={{
          scrollbars: {
            autoHide: "scroll",
            autoHideDelay: 1000,
          },
        }}
        style={{ maxHeight: "calc(100vh - 220px)" }}
      >
        <div className="sidebar-body">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted mt-2 small">
                Đang tải cuộc trò chuyện...
              </p>
            </div>
          )}

          {/* Conversations List */}
          {!isLoading && filteredConversations.length > 0 && (
            <ul className="chat-user-list">
              {filteredConversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={`conversation-item ${
                    conversation.id === selectedConversationId ? "active" : ""
                  } ${conversation.pinned ? "pinned" : ""}`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <Link to="#" onClick={(e) => e.preventDefault()}>
                    <div className="d-flex align-items-center">
                      {/* Avatar */}
                      <div className="flex-shrink-0 avatar avatar-lg me-2 position-relative">
                        <ImageWithBasePath
                          src={getConversationAvatar(conversation)}
                          className="rounded-circle"
                          alt={getConversationName(conversation)}
                        />
                        {conversation.isOnline && (
                          <span className="status online online-pulse" />
                        )}
                        {conversation.type === "GROUP" && (
                          <span className="badge bg-primary position-absolute bottom-0 end-0">
                            <i className="ti ti-users" />
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="text-truncate mb-1">
                            {conversation.pinned && (
                              <i className="ti ti-pin-filled me-1 text-primary" />
                            )}
                            {conversation.muted && (
                              <i className="ti ti-volume-off me-1 text-muted" />
                            )}
                            {getConversationName(conversation)}
                          </h6>
                          <span className="text-muted small">
                            {formatLastMessageTime(
                              conversation.lastMessage?.createdAt
                            )}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <p className="text-truncate text-muted small mb-0">
                            {getLastMessagePreview(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="badge bg-primary rounded-pill unread-badge">
                              {conversation.unreadCount > 99
                                ? "99+"
                                : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions (show on hover) */}
                      <div className="conversation-actions">
                        <Tooltip title={conversation.pinned ? "Bỏ ghim" : "Ghim"}>
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={(e) =>
                              handleTogglePin(
                                e,
                                conversation.id,
                                conversation.pinned
                              )
                            }
                          >
                            <i
                              className={`ti ti-pin${
                                conversation.pinned ? "-filled" : ""
                              }`}
                            />
                          </button>
                        </Tooltip>
                        
                        <Tooltip
                          title={
                            conversation.muted ? "Bật thông báo" : "Tắt thông báo"
                          }
                        >
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={(e) =>
                              handleToggleMute(
                                e,
                                conversation.id,
                                conversation.muted
                              )
                            }
                          >
                            <i
                              className={`ti ti-volume${
                                conversation.muted ? "" : "-off"
                              }`}
                            />
                          </button>
                        </Tooltip>

                        <Tooltip title="Xóa">
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={(e) => handleDelete(e, conversation.id)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Empty State */}
          {!isLoading && filteredConversations.length === 0 && (
            <div className="text-center py-5">
              <i
                className="ti ti-message-off gradient-text"
                style={{ fontSize: "64px" }}
              />
              <h5 className="mt-3">
                {searchQuery
                  ? "Không tìm thấy cuộc trò chuyện"
                  : "Chưa có cuộc trò chuyện"}
              </h5>
              <p className="text-muted">
                {searchQuery
                  ? "Thử tìm kiếm với từ khóa khác"
                  : "Bắt đầu trò chuyện mới ngay! 💬"}
              </p>
            </div>
          )}
        </div>
      </OverlayScrollbarsComponent>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between">
          <Link
            to="#"
            className="btn btn-sm btn-outline-secondary"
            onClick={(e) => {
              e.preventDefault();
              setShowArchived(!showArchived);
            }}
          >
            <i className="ti ti-archive me-1" />
            {showArchived ? "Ẩn" : "Xem"} Lưu trữ
          </Link>

          <span className="text-muted small">
            {filteredConversations.length} cuộc trò chuyện
          </span>
        </div>
      </div>

      {/* Modern Styles */}
      <style>{`
        .conversations-sidebar-modern {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 15px;
          padding: 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .conversations-sidebar-modern .sidebar-header {
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 15px;
        }

        .conversations-sidebar-modern .filter-tabs .nav-pills .nav-link {
          border-radius: 20px;
          font-size: 0.875rem;
          padding: 6px 16px;
          transition: all 0.3s;
        }

        .conversations-sidebar-modern .filter-tabs .nav-pills .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .conversations-sidebar-modern .conversation-item {
          background: white;
          border-radius: 12px;
          margin-bottom: 8px;
          padding: 12px;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .conversations-sidebar-modern .conversation-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .conversations-sidebar-modern .conversation-item.active::before,
        .conversations-sidebar-modern .conversation-item:hover::before {
          opacity: 1;
        }

        .conversations-sidebar-modern .conversation-item.active {
          background: linear-gradient(135deg, #f0f3ff 0%, #faf0ff 100%);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .conversations-sidebar-modern .conversation-item.pinned {
          border-left: 3px solid #667eea;
        }

        .conversations-sidebar-modern .conversation-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .conversations-sidebar-modern .conversation-actions {
          display: none;
          gap: 5px;
        }

        .conversations-sidebar-modern .conversation-item:hover .conversation-actions {
          display: flex;
        }

        .conversations-sidebar-modern .unread-badge {
          animation: bounceIn 0.5s ease-out;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        .conversations-sidebar-modern .sidebar-footer {
          background: white;
          border-radius: 12px;
          padding: 12px;
          margin-top: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .online-pulse {
          animation: pulse 2s infinite;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default ConversationsModern;

