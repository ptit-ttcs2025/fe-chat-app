/**
 * Chat Component - Tích hợp API đầy đủ với theme gốc
 * Giữ nguyên giao diện nhưng thêm logic real-time và modern features
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Tooltip } from "antd";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Theme Components
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import ContactInfo from "../../../core/modals/contact-info-off-canva";
import ContactFavourite from "../../../core/modals/contact-favourite-canva";
import ForwardMessage from "../../../core/modals/forward-message";
import MessageDelete from "../../../core/modals/message-delete";
import { all_routes } from "../../router/all_routes";

// API & Hooks - Tích hợp real-time
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useWebSocketStatus, useChatActions } from "@/hooks/useWebSocketChat";
import websocketService from "@/core/services/websocket.service";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";

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
  const [open1, setOpen1] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState<Record<string, boolean>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  
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
  
  // Auto scroll to bottom
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
  
  const toggleEmoji = useCallback((groupId: string) => {
    setShowEmoji((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);
  
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
        
        // Focus input
        inputRef.current?.focus();
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    },
    [inputMessage, selectedConversation, isSending, sendMessageHook, sendTypingStatus, user]
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
    return conversation.avatarUrl || "assets/img/profiles/avatar-default.jpg";
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
                  <ImageWithBasePath
              src={message.senderAvatarUrl || "assets/img/profiles/avatar-default.jpg"}
                    className="rounded-circle"
              alt={message.senderName}
                  />
                </div>
        )}
        
                <div className="chat-content">
          <div className={`chat-profile-name ${isOwnMessage ? "text-end" : ""}`}>
                    <h6>
              {message.senderName}
                      <i className="ti ti-circle-filled fs-7 mx-2" />
              <span className="chat-time">{formatTime(message.createdAt)}</span>
              {isOwnMessage && message.readCount > 0 && (
                      <span className="msg-read success">
                        <i className="ti ti-checks" />
                      </span>
              )}
              {message.pinned && (
                <span className="badge bg-primary ms-2">
                  <i className="ti ti-pin" />
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
                  <Link className="dropdown-item" onClick={() => setShowReply(true)} to="#">
                            <i className="ti ti-arrow-back-up me-2" />
                    Trả lời
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-arrow-forward-up-double me-2" />
                    Chuyển tiếp
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="#">
                            <i className="ti ti-file-export me-2" />
                    Sao chép
                          </Link>
                        </li>
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
              
                      <div className="emoj-group">
                        <ul>
                          <li className="emoj-action">
                    <Link to="#" onClick={() => toggleEmoji(message.id)}>
                              <i className="ti ti-mood-smile" />
                            </Link>
                    <div 
                      className="emoj-group-list" 
                      onClick={() => toggleEmoji(message.id)} 
                      style={{ display: showEmoji[message.id] ? 'block' : 'none' }}
                    >
                      <ul>
                        <li><Link to="#">❤️</Link></li>
                        <li><Link to="#">👍</Link></li>
                        <li><Link to="#">😂</Link></li>
                        <li><Link to="#">😮</Link></li>
                        <li><Link to="#">😢</Link></li>
                        <li><Link to="#">🔥</Link></li>
                                <li className="add-emoj">
                                  <Link to="#">
                                    <i className="ti ti-plus" />
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </li>
                          <li>
                            <Link
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#forward-message"
                            >
                              <i className="ti ti-arrow-forward-up" />
                            </Link>
                          </li>
                        </ul>
                      </div>
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
                  <ImageWithBasePath
              src={user?.avatarUrl || "assets/img/profiles/avatar-default.jpg"}
                    className="rounded-circle dreams_chat"
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
      {/* Modern Styles - Tích hợp animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .typing-indicator-modern {
          padding: 8px 15px;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          animation: slideIn 0.3s ease-out;
        }
        
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: pulse 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .chats {
          animation: slideIn 0.3s ease-out;
        }
        
        .message-actions {
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .chats:hover .message-actions {
          opacity: 1;
        }
      `}</style>
      
      {/* Chat */}
      <div className={`chat chat-messages show`} id="middle">
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
                </div>
                  <div className="ms-2 overflow-hidden">
                    <h6>{getConversationName(selectedConversation)}</h6>
                    <span className="last-seen">
                      {typingUsers.length > 0 ? (
                        <span className="typing-indicator-modern">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="ms-1">{typingUsers[0]} đang nhập...</span>
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
          
          {/* Chat Body */}
          <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'scroll',
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: '88vh' }}
          >
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
                
                {/* Messages */}
                {!isLoadingMessages && messages.length > 0 && messages.map(renderMessage)}
                
                {/* Empty State */}
                {!isLoadingMessages && messages.length === 0 && selectedConversation && (
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
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>
          </div>
          </OverlayScrollbarsComponent>
          
          {/* Chat Footer */}
        <div className="chat-footer">
            <form className="footer-form" onSubmit={handleSendMessage}>
            <div className="chat-footer-wrap">
              <div className="form-item">
                <Link to="#" className="action-circle">
                  <i className="ti ti-microphone" />
                </Link>
              </div>
                
              <div className="form-wrap">
                  {/* Reply Preview */}
              <div
                    className={`chats reply-chat ${showReply ? "d-flex" : "d-none"}`}
                  >
                    <div className="chat-avatar">
                      <ImageWithBasePath
                        src="assets/img/profiles/avatar-06.jpg"
                        className="rounded-circle"
                        alt="image"
                      />
                    </div>
                    <div className="chat-content">
                      <div className="chat-profile-name">
                        <h6>Đang trả lời</h6>
                      </div>
                      <div className="chat-info">
                        <div className="message-content">
                          <div className="message-reply reply-content">
                            Thank you for your support
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="#"
                      className="close-replay"
                      onClick={() => setShowReply(false)}
                    >
                      <i className="ti ti-x" />
                    </Link>
                  </div>
                  
                  {/* Message Input */}
                <input
                    ref={inputRef}
                  type="text"
                  className="form-control"
                    placeholder="Nhập tin nhắn... 💬"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || !selectedConversation}
                />
              </div>
                
                {/* Emoji Picker */}
              <div className="form-item emoj-action-foot">
                  <Link to="#" className="action-circle" onClick={() => toggleEmoji("footer")}>
                  <i className="ti ti-mood-smile" />
                </Link>
                  <div 
                    className="emoj-group-list-foot down-emoji-circle" 
                    onClick={() => toggleEmoji("footer")} 
                    style={{ display: showEmoji["footer"] ? 'block' : 'none' }}
                  >
                    <ul>
                      <li><Link to="#">😊</Link></li>
                      <li><Link to="#">❤️</Link></li>
                      <li><Link to="#">👍</Link></li>
                      <li><Link to="#">😂</Link></li>
                      <li><Link to="#">🔥</Link></li>
                    <li className="add-emoj">
                      <Link to="#">
                        <i className="ti ti-plus" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
                
                {/* File Attachment */}
                <div className="form-item position-relative d-flex align-items-center justify-content-center">
                <Link
                  to="#"
                  className="action-circle file-action position-absolute"
                >
                  <i className="ti ti-folder" />
                </Link>
                <input
                  type="file"
                  className="open-file position-relative"
                  name="files"
                  id="files"
                />
              </div>
                
                {/* More Options */}
              <div className="form-item">
                <Link to="#" data-bs-toggle="dropdown">
                  <i className="ti ti-dots-vertical" />
                </Link>
                <div className="dropdown-menu dropdown-menu-end p-3">
                  <Link to="#" className="dropdown-item">
                    <i className="ti ti-camera-selfie me-2" />
                    Camera
                  </Link>
                  <Link to="#" className="dropdown-item">
                    <i className="ti ti-photo-up me-2" />
                    Gallery
                  </Link>
                  <Link to="#" className="dropdown-item">
                    <i className="ti ti-music me-2" />
                    Audio
                  </Link>
                  <Link to="#" className="dropdown-item">
                    <i className="ti ti-map-pin-share me-2" />
                    Location
                  </Link>
                </div>
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

export default Chat;
