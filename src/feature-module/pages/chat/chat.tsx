/**
 * Chat Component - Tích hợp API đầy đủ với theme gốc
 * Giữ nguyên giao diện nhưng thêm logic real-time và modern features
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Tooltip } from "antd";

// Theme Components
import ContactInfo from "../../../core/modals/contact-info-off-canva";
import { all_routes } from "../../router/all_routes";

// API & Hooks - Tích hợp real-time
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useWebSocketStatus, useChatActions } from "@/hooks/useWebSocketChat";
import websocketService from "@/core/services/websocket.service";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";

// Avatar Helper
import { isValidUrl, getInitial, getAvatarColor } from "@/lib/avatarHelper";

// Avatar Component với fallback
const Avatar = ({ src, name, className = "" }: { src?: string; name?: string; className?: string }) => {
  const [imgError, setImgError] = useState(false);
  const avatarName = name || "User";
  const initial = getInitial(avatarName);
  const bgColor = getAvatarColor(avatarName);
  const hasValidUrl = isValidUrl(src) && !imgError;

  if (hasValidUrl && src) {
    // Sử dụng img trực tiếp để có thể xử lý onError
    const fullSrc = src.startsWith('http') ? src : `${import.meta.env.VITE_IMG_PATH || ''}${src}`;
    return (
      <img
        src={fullSrc}
        className={className}
        alt={avatarName}
        onError={() => setImgError(true)}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  // Fallback: Avatar với chữ cái đầu
  return (
    <div
      className={`${className} d-inline-flex align-items-center justify-content-center`}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: bgColor,
        color: "#fff",
        fontWeight: "600",
        fontSize: "16px",
      }}
    >
      {initial}
    </div>
  );
};

// Redux State Interface
interface RootState {
  auth: {
    user: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    } | null;
    token: string | null;
  };
  common: {
    selectedConversationId: string | null;
  };
}

const Chat = () => {
  // ==================== Redux State ====================
  const user = useSelector((state: RootState) => state.auth?.user);
  const selectedConversationId = useSelector((state: RootState) => state.common?.selectedConversationId);
  
  // ==================== Local State (UI) ====================
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [filteredMessages, setFilteredMessages] = useState<IMessage[]>([]);
  
  // ==================== Refs ====================
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== API Hooks ====================
  
  // WebSocket connection
  const isWsConnected = useWebSocketStatus();
  
  // Conversations list
  const {
    conversations,
  } = useChatConversations({
    pageSize: 50,
    autoRefresh: true,
  });
  
  // Sync conversation from Redux
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === selectedConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [selectedConversationId, conversations]);
  
  // Messages cho conversation đã chọn
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage: sendMessageHook,
    deleteMessage,
    togglePin,
    scrollToBottom,
  } = useChatMessages({
    conversationId: selectedConversation?.id || null,
    pageSize: 50,
    autoMarkAsRead: true,
    currentUserId: user?.id,
  });
  
  // Chat actions (typing, etc)
  const { sendTypingStatus } = useChatActions();
  
  // Typing users state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // ==================== Effects ====================
  
  // Auto-select first conversation
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);
  
  // Subscribe to typing status
  useEffect(() => {
    if (selectedConversation?.id && isWsConnected) {
      const unsubscribe = websocketService.subscribeToTyping(
        selectedConversation.id,
        (status) => {
          if (status.userId !== user?.id) {
            setTypingUsers((prev) => {
              if (status.isTyping) {
                return [...prev.filter(u => u !== status.userName), status.userName];
              } else {
                return prev.filter(u => u !== status.userName);
              }
            });
            
            // Auto clear after 2s
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter(u => u !== status.userName));
            }, 2000);
          }
        }
      );
      
      return () => unsubscribe();
    }
  }, [selectedConversation?.id, isWsConnected, user?.id]);
  
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
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Delay để đảm bảo DOM đã render
      setTimeout(() => {
        scrollToBottom(true); // instant scroll
      }, 50);
      
      // Smooth scroll sau đó
      setTimeout(() => {
        scrollToBottom(false);
      }, 200);
    }
  }, [messages.length, scrollToBottom]);
  
  // Filter messages when search keyword changes
  // Hook đã xử lý sắp xếp theo thứ tự cũ → mới, không cần reverse
  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = messages.filter(msg => 
        msg.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchKeyword, messages]);
  
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
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Stop typing after 1s of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStatus(
            selectedConversation.id,
            false,
            user?.fullName || "User"
          );
        }, 1000);
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
        if (selectedConversation) {
          sendTypingStatus(
            selectedConversation.id,
            false,
            user?.fullName || "User"
          );
        }
        
        // Clear timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        
        // Auto scroll to bottom và focus input ngay lập tức
        requestAnimationFrame(() => {
          scrollToBottom(true); // instant scroll
          inputRef.current?.focus();
        });
        
        // Double check scroll sau 100ms
        setTimeout(() => {
          scrollToBottom(true);
          inputRef.current?.focus();
        }, 100);
        
        // Smooth scroll cuối cùng để mượt mà
        setTimeout(() => {
          scrollToBottom(false);
        }, 300);
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    },
    [inputMessage, selectedConversation, isSending, sendMessageHook, sendTypingStatus, user, scrollToBottom]
  );
  
  const handleKeyDown = useCallback(
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
      // eslint-disable-next-line no-alert
      if (globalThis.confirm("Bạn có chắc muốn xóa tin nhắn này?")) {
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
  
  const getConversationName = (conversation: IConversation) => {
    return conversation.name || "Cuộc trò chuyện";
  };
  
  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl;
  };
  
  const renderMessage = (message: IMessage) => {
    const isOwnMessage = message.senderId === user?.id;
    
    return (
      <div
        key={message.id}
        className={`chats ${isOwnMessage ? "chats-right" : ""}`}
        style={{
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {!isOwnMessage && (
                <div className="chat-avatar">
            <Avatar
              src={message.senderAvatarUrl}
              name={message.senderName}
                    className="rounded-circle"
                  />
                </div>
        )}
        
                <div className="chat-content">
          <div className={`chat-profile-name ${isOwnMessage ? "text-end" : ""}`}>
                    <h6>
              <span>{message.senderName}</span>
                      <i className="ti ti-circle-filled fs-7" />
              <span className="chat-time">{formatTime(message.createdAt)}</span>
              {isOwnMessage && message.readCount > 0 && (
                      <span className="msg-read success">
                        <i className="ti ti-checks" />
                      </span>
              )}
              {message.pinned && (
                <span className="pin-badge-modern">
                  <i className="ti ti-pin-filled" />
                </span>
              )}
                    </h6>
                  </div>
          
                  <div className="chat-info">
            <div className={`chat-actions ${!isOwnMessage ? "" : "order-first"}`}>
                      <Link className="#" to="#" data-bs-toggle="dropdown">
                        <i className="ti ti-dots-vertical" />
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                    onClick={() => handleTogglePin(message.id, message.pinned)}
                          >
                    <i className={`ti ti-pin${message.pinned ? "-filled" : ""} me-2`} />
                    {message.pinned ? "Bỏ ghim" : "Ghim"}
                          </Link>
                        </li>
                {isOwnMessage && (
                        <li>
                          <Link
                      className="dropdown-item text-danger"
                            to="#"
                      onClick={() => handleDeleteMessage(message.id)}
                          >
                            <i className="ti ti-trash me-2" />
                      Xóa
                          </Link>
                        </li>
                )}
                      </ul>
                    </div>
            
                    <div className="message-content">
              {message.content}
                            </div>
            
            {isOwnMessage && message.readCount > 0 && (
              <div className="chat-actions mt-1">
                <small className="text-muted">
                  ✓ Đã xem bởi {message.readCount} người
                </small>
                      </div>
            )}
                    </div>
                  </div>
        
        {isOwnMessage && (
                <div className="chat-avatar">
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName || user?.username}
                    className="rounded-circle dreams_chat"
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
        <div className="d-flex align-items-center justify-content-center" style={{ height: "100vh" }}>
          <div className="text-center">
            <i className="ti ti-user-off" style={{ fontSize: "64px", color: "#667eea" }} />
            <h4 className="mt-3">Bạn chưa đăng nhập</h4>
            <p className="text-muted">Vui lòng đăng nhập để sử dụng chat</p>
              </div>
                </div>
                  </div>
    );
  }
  
  return (
    <>
      {/* Modern Styles - Fix layout hoàn chỉnh */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* ========== TYPING INDICATOR - DƯỚI INPUT ========== */
        .typing-indicator-footer {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          padding: 8px 20px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #667eea;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .typing-indicator-modern {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #667eea;
          animation: pulse 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        /* ========== PIN BADGE MODERN ========== */
        .pin-badge-modern {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 10px;
          margin-left: 8px;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
          flex-shrink: 0;
        }
        
        .pin-badge-modern i {
          font-size: 10px;
        }
        
        /* ========== TRUNCATE TÊN NGƯỜI DÙNG ========== */
        .chat-profile-name h6 {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 8px;
        }
        
        .chat-profile-name h6 > span:first-of-type,
        .chat-profile-name h6 > span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
          display: inline-block;
        }
        
        .chat-header .ms-2 h6 {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
        
        /* ========== SEARCH BAR - ẨN MẶC ĐỊNH ========== */
        .chat-search.search-wrap.contact-search {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          padding: 0 15px;
          transition: all 0.3s ease;
          visibility: hidden;
        }
        
        .chat-search.search-wrap.contact-search.visible-chat {
          max-height: 60px;
          opacity: 1;
          padding: 10px 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          visibility: visible;
        }
        
        /* ========== MAIN CHAT LAYOUT - FIX HEIGHT ========== */
        #middle.chat.chat-messages {
          display: flex !important;
          flex-direction: column !important;
          height: calc(100vh - 0px) !important;
          max-height: 100vh !important;
          overflow: hidden !important;
          position: relative !important;
        }
        
        #middle.chat.chat-messages > div {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        
        /* Header - fixed at top */
        .chat-header {
          flex-shrink: 0 !important;
          background: #fff;
          z-index: 10;
          position: relative;
        }
        
        /* ========== CHAT BODY - SCROLL AREA ========== */
        .chat-body.chat-page-group {
          flex: 1 1 auto !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 20px !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .messages {
          display: flex;
          flex-direction: column;
          gap: 15px;
          flex: 1;
        }
        
        /* ========== FOOTER - FIXED AT BOTTOM ========== */
        .chat-footer {
          flex-shrink: 0 !important;
          background: #fff !important;
          border-top: 1px solid #e9ecef;
          padding: 12px 20px !important;
          z-index: 100;
          margin-top: auto !important;
          position: relative;
        }
        
        .footer-form {
          margin: 0;
        }
        
        .chat-footer-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chat-footer-wrap .form-wrap {
          flex: 1;
          position: relative;
        }
        
        .chat-footer-wrap .form-wrap .form-control {
          width: 100%;
          height: 42px;
          border-radius: 21px;
          padding: 0 18px;
          border: 1px solid #d0d0d0;
          background: #f8f9fa;
          font-size: 14px;
          line-height: 42px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          color: #212529;
          letter-spacing: 0;
          box-shadow: none;
        }
        
        .chat-footer-wrap .form-wrap .form-control:hover:not(:disabled) {
          background: #fff;
          border-color: #c0c0c0;
        }
        
        .chat-footer-wrap .form-wrap .form-control:focus {
          background: #fff;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: none;
        }
        
        .chat-footer-wrap .form-wrap .form-control:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
          border-color: #e0e0e0;
        }
        
        .chat-footer-wrap .form-wrap .form-control::placeholder {
          color: #9ca3af;
          font-style: normal;
          font-weight: 400;
        }
        
        .chat-footer-wrap .form-item {
          flex-shrink: 0;
        }
        
        .chat-footer-wrap .form-item .action-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          transition: all 0.2s ease;
        }
        
        .chat-footer-wrap .form-item .action-circle:hover {
          background: #667eea;
          color: #fff;
        }
        
        .chat-footer-wrap .form-btn {
          flex-shrink: 0;
        }
        
        .chat-footer-wrap .form-btn button {
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
          font-size: 18px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .chat-footer-wrap .form-btn button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .chat-footer-wrap .form-btn button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Own message styling */
        .chats.chats-right {
          justify-content: flex-end;
        }
        
        .chats.chats-right .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .chats.chats-right .chat-time {
          color: rgba(255,255,255,0.8);
        }
        
        /* Message animation */
        .chats {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
      
      {/* Chat */}
      <div 
        className={`chat chat-messages show`} 
        id="middle"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                    <Avatar
                      src={getConversationAvatar(selectedConversation)}
                      name={getConversationName(selectedConversation)}
                    className="rounded-circle"
                  />
                </div>
                  <div className="ms-2 overflow-hidden flex-grow-1">
                    <h6 className="text-truncate mb-0" style={{ maxWidth: '200px' }}>{getConversationName(selectedConversation)}</h6>
                    <span className="last-seen">
                      Online
                      </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="avatar avatar-lg flex-shrink-0">
                    <Avatar
                      name="Select chat"
                    className="rounded-circle"
                  />
                </div>
                        <div className="ms-2 overflow-hidden">
                    <h6>Chọn cuộc trò chuyện</h6>
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
                  <Tooltip title="Thông tin liên hệ" placement="bottom">
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
                  <Link className="btn no-bg" to="#" data-bs-toggle="dropdown">
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
                          <li>
                            <Link
                              to="#"
                            className="dropdown-item"
                            data-bs-toggle="modal"
                        data-bs-target="#clear-chat"
                      >
                        <i className="ti ti-clear-all me-2" />
                        Xóa tin nhắn
                          </Link>
                        </li>
                      </ul>
                                </li>
                              </ul>
                            </div>
            
            {/* Chat Search */}
            <div className={`chat-search search-wrap contact-search ${showSearch ? 'visible-chat' : ''}`}>
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
          
          {/* Chat Body - Scrollable area */}
          <div className="chat-body chat-page-group">
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
              
              {/* Messages - Hiển thị theo thứ tự thời gian (cũ → mới) */}
              {!isLoadingMessages && filteredMessages.length > 0 && 
                filteredMessages.map(renderMessage)
              }
              
              {/* No search results */}
              {!isLoadingMessages && searchKeyword && filteredMessages.length === 0 && messages.length > 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-search-off" style={{ fontSize: "48px", color: "#667eea" }} />
                  <h5 className="mt-3">Không tìm thấy kết quả</h5>
                  <p className="text-muted">Thử tìm với từ khóa khác</p>
                    </div>
              )}
              
              {/* Empty State */}
              {!isLoadingMessages && messages.length === 0 && selectedConversation && !searchKeyword && (
                <div className="text-center py-5">
                  <i className="ti ti-message-off" style={{ fontSize: "64px", color: "#667eea" }} />
                  <h5 className="mt-3">Chưa có tin nhắn nào</h5>
                  <p className="text-muted">Hãy bắt đầu cuộc trò chuyện! 💬</p>
                    </div>
              )}
              
              {/* No conversation selected */}
              {!selectedConversation && (
                <div className="text-center py-5">
                  <i className="ti ti-message-circle" style={{ fontSize: "64px", color: "#667eea" }} />
                  <h5 className="mt-3">Chọn một cuộc trò chuyện</h5>
                  <p className="text-muted">Chọn một cuộc trò chuyện từ sidebar để bắt đầu</p>
                  </div>
              )}
              
              {/* Scroll anchor - để scroll đến đây khi có tin nhắn mới */}
              <div ref={messagesEndRef} />
                </div>
              </div>
          
          {/* Chat Footer */}
        <div className="chat-footer">
            {/* Typing Indicator - Hiển thị dưới input như Zalo, Messenger */}
            {typingUsers.length > 0 && selectedConversation && (
              <div className="typing-indicator-footer">
                <span className="typing-indicator-modern">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </span>
                <span>{typingUsers[0]} đang nhập...</span>
              </div>
            )}
            
            <form className="footer-form" onSubmit={handleSendMessage}>
            <div className="chat-footer-wrap">
              <div className="form-wrap" style={{ position: 'relative' }}>
                  {/* Message Input */}
                <input
                    ref={inputRef}
                  type="text"
                  className="form-control"
                    placeholder="Nhập tin nhắn..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || !selectedConversation}
                    autoFocus
                />
              </div>
                
                {/* Send Button */}
              <div className="form-btn">
                  <button 
                    className="btn btn-primary" 
                    type="submit"
                    disabled={!inputMessage.trim() || isSending || !selectedConversation}
                  >
                    {isSending ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Đang gửi...</span>
              </div>
                    ) : (
                      <i className="ti ti-send" />
                    )}
                  </button>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Chat */}
      
      {/* Modals */}
      <ContactInfo />
    </>
  );
};

export default Chat;
