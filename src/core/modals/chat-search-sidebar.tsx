/**
 * Chat Search Sidebar Component
 * Hiển thị search results trong sidebar bên phải
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Avatar from "@/feature-module/pages/chat/components/Avatar";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";

interface ChatSearchSidebarProps {
  selectedConversation: IConversation | null;
  messages: IMessage[];
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  onMessageClick: (messageId: string) => void;
  currentUserId?: string;
}

const ChatSearchSidebar = ({
  selectedConversation,
  messages,
  searchKeyword,
  onSearchChange,
  onMessageClick,
  currentUserId,
}: ChatSearchSidebarProps) => {
  const [filteredResults, setFilteredResults] = useState<IMessage[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter messages based on search keyword
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredResults([]);
      return;
    }

    const keyword = searchKeyword.toLowerCase().trim();
    const filtered = messages.filter(
      (msg) =>
        msg.content?.toLowerCase().includes(keyword) ||
        msg.senderName?.toLowerCase().includes(keyword)
    );
    
    // Sort by createdAt descending (newest first)
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setFilteredResults(sorted);
  }, [messages, searchKeyword]);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Handle message click
  const handleMessageClick = (messageId: string) => {
    onMessageClick(messageId);
    // Close sidebar after clicking
    const offcanvasElement = document.getElementById("chat-search-sidebar");
    if (offcanvasElement) {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(
        offcanvasElement
      );
      bsOffcanvas?.hide();
    }
  };

  // Focus search input when sidebar opens
  useEffect(() => {
    const offcanvasElement = document.getElementById("chat-search-sidebar");
    if (offcanvasElement) {
      const handleShown = () => {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 300);
      };
      offcanvasElement.addEventListener("shown.bs.offcanvas", handleShown);
      return () => {
        offcanvasElement.removeEventListener("shown.bs.offcanvas", handleShown);
      };
    }
  }, []);

  return (
    <>
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="chat-search-sidebar"
        aria-labelledby="chatSearchLabel"
      >
        <div className="offcanvas-header">
          <h4 className="offcanvas-title" id="chatSearchLabel">
            Tìm kiếm trong trò chuyện
          </h4>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="offcanvas-body">
          <div className="chat-search-sidebar">
            {/* Search Input */}
            <div className="mb-4">
              <div className="input-group">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchKeyword}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onSearchChange("")}
                    title="Xóa"
                  >
                    <i className="ti ti-x" />
                  </button>
                )}
                <span className="input-group-text">
                  <i className="ti ti-search" />
                </span>
              </div>
            </div>

            {/* Results Count */}
            {searchKeyword.trim() && (
              <div className="mb-3">
                <p className="text-muted small mb-0">
                  {filteredResults.length > 0
                    ? `${filteredResults.length} kết quả`
                    : "Không tìm thấy kết quả"}
                </p>
              </div>
            )}

            {/* Search Results */}
            {searchKeyword.trim() ? (
              filteredResults.length > 0 ? (
                <div className="search-results">
                  {filteredResults.map((message) => {
                    const isOwnMessage = message.senderId === currentUserId;
                    
                    return (
                      <div
                        key={message.id}
                        className="search-result-item"
                        onClick={() => handleMessageClick(message.id)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          marginBottom: "8px",
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                          e.currentTarget.style.borderColor = "#667eea";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <Avatar
                              src={message.senderAvatarUrl}
                              name={message.senderName}
                              size={36}
                            />
                          </div>

                          {/* Message Content */}
                          <div className="flex-grow-1 min-w-0">
                            {/* Sender Name and Time */}
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#374151",
                                }}
                              >
                                {message.senderName}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  whiteSpace: "nowrap",
                                  marginLeft: "8px",
                                }}
                              >
                                {formatRelativeTime(message.createdAt)}
                              </span>
                            </div>

                            {/* Message Text */}
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                lineHeight: 1.5,
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {message.type === "IMAGE" && (
                                <span style={{ color: "#667eea" }}>
                                  📷 Hình ảnh
                                </span>
                              )}
                              {message.type === "FILE" && (
                                <span style={{ color: "#667eea" }}>
                                  📎 {message.attachment?.fileName || "File đính kèm"}
                                </span>
                              )}
                              {message.content && (
                                <span>{message.content}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i
                    className="ti ti-search-off"
                    style={{ fontSize: "48px", color: "#dee2e6" }}
                  />
                  <p className="text-muted mt-3">Không tìm thấy kết quả</p>
                  <p className="text-muted small">
                    Thử tìm kiếm với từ khóa khác
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-5">
                <i
                  className="ti ti-search"
                  style={{ fontSize: "48px", color: "#dee2e6" }}
                />
                <p className="text-muted mt-3">
                  Nhập từ khóa để tìm kiếm tin nhắn
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSearchSidebar;

