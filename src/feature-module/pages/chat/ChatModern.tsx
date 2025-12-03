/**
 * ChatModern - Phiên bản chat hiện đại tích hợp API
 * Modern, Gen-Z friendly với animations và effects đẹp mắt
 * Giữ nguyên theme nhưng nâng cấp UX
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Tooltip } from "antd";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Components & Modals
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import ContactInfo from "../../../core/modals/contact-info-off-canva";
import ContactFavourite from "../../../core/modals/contact-favourite-canva";
import ForwardMessage from "../../../core/modals/forward-message";
import MessageDelete from "../../../core/modals/message-delete";
import { all_routes } from "../../router/all_routes";

// Hooks & APIs
import { useChatMessages, useTypingUsers } from "@/hooks/useChatMessages";
import { useTypingStatus, useChatActions } from "@/hooks/useWebSocketChat";
import { useChatConversations } from "@/hooks/useChatConversations";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";

// CSS cho animations
const modernStyles = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
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

  @keyframes typing {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .chat-modern .chats {
    animation: slideInLeft 0.3s ease-out;
  }

  .chat-modern .chats-right {
    animation: slideInRight 0.3s ease-out;
  }

  .chat-modern .message-sending {
    opacity: 0.6;
    transition: opacity 0.3s;
  }

  .chat-modern .typing-dot {
    animation: typing 1.4s infinite;
  }

  .chat-modern .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .chat-modern .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  .chat-modern .message-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .chat-modern .chats:hover .message-actions {
    opacity: 1;
  }

  .chat-modern .quick-emoji {
    display: inline-block;
    transition: transform 0.2s;
    cursor: pointer;
  }

  .chat-modern .quick-emoji:hover {
    transform: scale(1.3);
  }

  .chat-modern .unread-badge {
    animation: bounceIn 0.5s ease-out;
  }

  .chat-modern .online-pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .chat-modern .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chat-modern .message-time-badge {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.05);
  }

  .chat-modern .typing-indicator-modern {
    padding: 8px 15px;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    animation: slideInLeft 0.3s ease-out;
  }
`;

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

interface ChatModernProps {
  selectedConversation?: IConversation | null;
}

const ChatModern: React.FC<ChatModernProps> = ({ selectedConversation: propsSelectedConversation = null }) => {
  // ==================== Redux State ====================
  const user = useSelector((state: RootState) => state.auth.user);

  // ==================== Local State ====================
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(propsSelectedConversation);
  const [inputMessage, setInputMessage] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showEmoji, setShowEmoji] = useState<Record<string, boolean>>({});
  const [open1, setOpen1] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // ==================== Refs ====================
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ==================== Custom Hooks - API Integration ====================
  
  // Conversations management
  const {
    conversations: apiConversations,
    isLoading: isLoadingConvs,
  } = useChatConversations({
    pageSize: 20,
    autoRefresh: true,
  });

  // Messages management với WebSocket
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage: sendMessageHook,
    deleteMessage,
    togglePin,
    scrollToBottom,
    messagesEndRef,
  } = useChatMessages({
    conversationId: selectedConversation?.id || null,
    pageSize: 50,
    autoMarkAsRead: true,
    currentUserId: user?.id,
  });

  // Typing users management
  const { typingUsers, handleTypingStatus } = useTypingUsers(user?.id || "");

  // WebSocket subscriptions
  useTypingStatus(
    selectedConversation?.id || null,
    handleTypingStatus,
    !!selectedConversation
  );

  // Chat actions (WebSocket)
  const { sendTypingStatus } = useChatActions();

  // ==================== Effects ====================

  // Sync selected conversation from props
  useEffect(() => {
    if (propsSelectedConversation !== undefined) {
      setSelectedConversation(propsSelectedConversation);
    }
  }, [propsSelectedConversation]);

  // Sync conversations from API
  useEffect(() => {
    if (apiConversations && apiConversations.length > 0) {
      setConversations(apiConversations);
      
      // Auto select first conversation if none selected and no props
      if (!selectedConversation && !propsSelectedConversation && apiConversations.length > 0) {
        setSelectedConversation(apiConversations[0]);
      }
    }
  }, [apiConversations, selectedConversation, propsSelectedConversation]);

  // Mobile responsive handlers
  useEffect(() => {
    const handleChatUserClick = () => {
      if (window.innerWidth <= 992) {
        const showChat = document.querySelector(".chat-messages");
        if (showChat) {
          showChat.classList.add("show");
        }
      }
    };

    const handleChatClose = () => {
      if (window.innerWidth <= 992) {
        const hideChat = document.querySelector(".chat-messages");
        if (hideChat) {
          hideChat.classList.remove("show");
        }
      }
    };

    document.querySelectorAll(".chat-user-list").forEach((element) => {
      element.addEventListener("click", handleChatUserClick);
    });

    document.querySelectorAll(".chat-close").forEach((element) => {
      element.addEventListener("click", handleChatClose);
    });

    return () => {
      document.querySelectorAll(".chat-user-list").forEach((element) => {
        element.removeEventListener("click", handleChatUserClick);
      });
      document.querySelectorAll(".chat-close").forEach((element) => {
        element.removeEventListener("click", handleChatClose);
      });
    };
  }, []);

  // Auto scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation?.id]);

  // ==================== Handlers ====================

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const toggleEmoji = useCallback((messageId: string) => {
    setShowEmoji((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const handleConversationSelect = useCallback((conversation: IConversation) => {
    setSelectedConversation(conversation);
    setSearchKeyword("");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputMessage(value);

      // Send typing indicator
      if (selectedConversation && value.length > 0) {
        sendTypingStatus(
          selectedConversation.id,
          true,
          user?.fullName || "User"
        );
      }
    },
    [selectedConversation, sendTypingStatus, user]
  );

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!inputMessage.trim() || !selectedConversation || isSending) return;

      try {
        await sendMessageHook(inputMessage.trim(), "TEXT");
        setInputMessage("");

        // Stop typing indicator
        sendTypingStatus(
          selectedConversation.id,
          false,
          user?.fullName || "User"
        );

        // Focus input
        inputRef.current?.focus();
      } catch (error: any) {
        console.error("❌ Error sending message:", error);
      }
    },
    [inputMessage, selectedConversation, isSending, sendMessageHook, sendTypingStatus, user]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (window.confirm("Bạn có chắc muốn xóa tin nhắn này?")) {
        deleteMessage(messageId);
      }
    },
    [deleteMessage]
  );

  const handleTogglePin = useCallback(
    (messageId: string, currentlyPinned: boolean) => {
      togglePin(messageId, !currentlyPinned);
    },
    [togglePin]
  );

  // ==================== Render Helpers ====================

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(timestamp);
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
    return conversation.name || "Cuộc trò chuyện";
  };

  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl || "assets/img/profiles/avatar-default.jpg";
  };

  const renderMessage = (message: IMessage) => {
    const isOwnMessage = message.senderId === user?.id;

    return (
      <div
        key={message.id}
        className={`chats ${isOwnMessage ? "chats-right" : ""}`}
      >
        {!isOwnMessage && (
          <div className="chat-avatar">
            <ImageWithBasePath
              src={
                message.senderAvatarUrl ||
                "assets/img/profiles/avatar-default.jpg"
              }
              className="rounded-circle"
              alt={message.senderName}
            />
          </div>
        )}

        <div className="chat-content">
          <div className="chat-profile-name">
            <h6>
              {message.senderName}
              <i className="ti ti-circle-filled fs-7 mx-2" />
              <span className="chat-time message-time-badge">
                {formatTime(message.createdAt)}
              </span>
              {isOwnMessage && message.readCount > 0 && (
                <span className="msg-read success ms-1">
                  <i className="ti ti-checks" />
                </span>
              )}
              {message.pinned && (
                <span className="badge bg-gradient-primary ms-2">
                  <i className="ti ti-pin" /> Đã ghim
                </span>
              )}
            </h6>
          </div>

          <div className="chat-info">
            <div className="message-content">
              {message.content}

              {/* Message actions - hidden by default, show on hover */}
              <div className="emoj-group message-actions">
                <ul>
                  {/* Quick reactions */}
                  <li className="quick-emoji" title="Love">
                    ❤️
                  </li>
                  <li className="quick-emoji" title="Like">
                    👍
                  </li>
                  <li className="quick-emoji" title="Haha">
                    😂
                  </li>
                  
                  <li>
                    <Link
                      to="#"
                      onClick={() =>
                        handleTogglePin(message.id, message.pinned)
                      }
                      title={message.pinned ? "Bỏ ghim" : "Ghim"}
                    >
                      <i
                        className={`ti ti-pin${
                          message.pinned ? "-filled" : ""
                        }`}
                      />
                    </Link>
                  </li>
                  
                  {isOwnMessage && (
                    <li>
                      <Link
                        to="#"
                        onClick={() => handleDeleteMessage(message.id)}
                        title="Xóa"
                      >
                        <i className="ti ti-trash" />
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Read receipts */}
            {isOwnMessage && message.readCount > 0 && (
              <div className="chat-actions">
                <small className="text-muted">
                  Đã xem bởi {message.readCount} người
                </small>
              </div>
            )}
          </div>
        </div>

        {isOwnMessage && (
          <div className="chat-avatar">
            <ImageWithBasePath
              src={
                user?.avatarUrl || "assets/img/profiles/avatar-default.jpg"
              }
              className="rounded-circle"
              alt="You"
            />
          </div>
        )}
      </div>
    );
  };

  // ==================== Render ====================

  if (!user) {
    return (
      <div className="content main_content">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100vh" }}
        >
          <div className="text-center">
            <i
              className="ti ti-user-off gradient-text"
              style={{ fontSize: "64px" }}
            />
            <h4 className="mt-3">Bạn chưa đăng nhập</h4>
            <p className="text-muted">
              Vui lòng đăng nhập để sử dụng chat
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modern Styles */}
      <style>{modernStyles}</style>

      {/* Chat */}
      <div className={`chat chat-messages show chat-modern`} id="middle">
        <div>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="user-details">
              <div className="d-xl-none">
                <Link className="text-muted chat-close me-2" to="#">
                  <i className="fas fa-arrow-left" />
                </Link>
              </div>
              
              {selectedConversation ? (
                <>
                  <div className="avatar avatar-lg online flex-shrink-0">
                    <ImageWithBasePath
                      src={getConversationAvatar(selectedConversation)}
                      className="rounded-circle"
                      alt={getConversationName(selectedConversation)}
                    />
                    <span className="online-pulse" />
                  </div>
                  <div className="ms-2 overflow-hidden">
                    <h6 className="gradient-text">
                      {getConversationName(selectedConversation)}
                    </h6>
                    <span className="last-seen">
                      {typingUsers.length > 0 ? (
                        <span className="typing-indicator-modern">
                          <span className="typing-dot">●</span>
                          <span className="typing-dot">●</span>
                          <span className="typing-dot">●</span>
                          <span className="ms-1">
                            {typingUsers[0]} đang nhập
                          </span>
                        </span>
                      ) : (
                        "Online"
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="avatar avatar-lg flex-shrink-0">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-default.jpg"
                      className="rounded-circle"
                      alt="Select chat"
                    />
                  </div>
                  <div className="ms-2 overflow-hidden">
                    <h6>Chọn một cuộc trò chuyện</h6>
                    <span className="last-seen">Bắt đầu nhắn tin</span>
                  </div>
                </>
              )}
            </div>

            <div className="chat-options">
              <ul>
                <li>
                  <Tooltip title="Tìm kiếm" placement="bottom">
                    <Link
                      to="#"
                      className="btn chat-search-btn"
                      onClick={toggleSearch}
                    >
                      <i className="ti ti-search" />
                    </Link>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip title="Video Call" placement="bottom">
                    <Link
                      to="#"
                      className="btn"
                      data-bs-toggle="modal"
                      data-bs-target="#video-call"
                    >
                      <i className="ti ti-video" />
                    </Link>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip title="Voice Call" placement="bottom">
                    <Link
                      to="#"
                      className="btn"
                      data-bs-toggle="modal"
                      data-bs-target="#voice_call"
                    >
                      <i className="ti ti-phone" />
                    </Link>
                  </Tooltip>
                </li>
                <li>
                  <Tooltip title="Thông tin" placement="bottom">
                    <Link
                      to="#"
                      className="btn"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#contact-profile"
                    >
                      <i className="ti ti-info-circle" />
                    </Link>
                  </Tooltip>
                </li>
                <li>
                  <Link
                    className="btn no-bg"
                    to="#"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to={all_routes.dashboard} className="dropdown-item">
                        <i className="ti ti-x me-2" />
                        Đóng Chat
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item"
                        data-bs-toggle="modal"
                        data-bs-target="#mute-notification"
                      >
                        <i className="ti ti-volume-off me-2" />
                        Tắt thông báo
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Chat Search */}
            <div
              className={`chat-search search-wrap contact-search ${
                showSearch ? "visible-chat" : ""
              }`}
            >
              <form>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm tin nhắn..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <span className="input-group-text">
                    <i className="ti ti-search" />
                  </span>
                </div>
              </form>
            </div>
            {/* /Chat Search */}
          </div>

          {/* Chat Body */}
          <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: "scroll",
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: "88vh" }}
          >
            <div className="chat-body chat-page-group" ref={messagesContainerRef}>
              <div className="messages">
                {/* Loading State */}
                {isLoadingMessages && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted mt-2">Đang tải tin nhắn...</p>
                  </div>
                )}

                {/* Messages */}
                {!isLoadingMessages && messages.length > 0 && messages.map(renderMessage)}

                {/* Empty State */}
                {!isLoadingMessages && messages.length === 0 && selectedConversation && (
                  <div className="text-center py-5">
                    <i
                      className="ti ti-message-off gradient-text"
                      style={{ fontSize: "64px" }}
                    />
                    <h5 className="mt-3">Chưa có tin nhắn nào</h5>
                    <p className="text-muted">
                      Hãy bắt đầu cuộc trò chuyện! 💬
                    </p>
                  </div>
                )}

                {/* No conversation selected */}
                {!selectedConversation && (
                  <div className="text-center py-5">
                    <i
                      className="ti ti-message-circle gradient-text"
                      style={{ fontSize: "64px" }}
                    />
                    <h5 className="mt-3">Chọn một cuộc trò chuyện</h5>
                    <p className="text-muted">
                      Chọn một cuộc trò chuyện từ sidebar để bắt đầu
                    </p>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </OverlayScrollbarsComponent>

          {/* Chat Footer */}
          <div className="chat-footer">
            <form onSubmit={handleSendMessage}>
              <div className="smile-foot">
                <div className="chat-action-btns">
                  <div className="chat-action-col">
                    <Tooltip title="Emoji" placement="top">
                      <Link className="action-circle" to="#">
                        <i className="ti ti-mood-smile" />
                      </Link>
                    </Tooltip>
                  </div>
                  <div className="chat-action-col">
                    <Tooltip title="Đính kèm" placement="top">
                      <Link className="action-circle" to="#">
                        <i className="ti ti-paperclip" />
                      </Link>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <input
                ref={inputRef}
                type="text"
                className="form-control chat_form"
                placeholder="Nhập tin nhắn... 💬"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={isSending || !selectedConversation}
              />

              <div className="form-buttons">
                <button
                  type="submit"
                  className="btn send-btn"
                  disabled={
                    !inputMessage.trim() || isSending || !selectedConversation
                  }
                  title={isSending ? "Đang gửi..." : "Gửi"}
                >
                  {isSending ? (
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Đang gửi...</span>
                    </div>
                  ) : (
                    <i className="ti ti-send" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Chat */}

      {/* Modals */}
      <ContactInfo />
      <ContactFavourite />
      <ForwardMessage />
      <MessageDelete />

      {/* Lightbox */}
      <Lightbox
        open={open1}
        close={() => setOpen1(false)}
        slides={[
          { src: "assets/img/gallery/gallery-01.jpg" },
          { src: "assets/img/gallery/gallery-02.jpg" },
        ]}
      />
    </>
  );
};

export default ChatModern;

