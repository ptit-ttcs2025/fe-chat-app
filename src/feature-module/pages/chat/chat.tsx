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
import { uploadImage, uploadFile, chatApi } from "@/apis/chat/chat.api";

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
  const [isUploading, setIsUploading] = useState(false);
  
  // ==================== Refs ====================
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(100);
  
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
  
  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState<IMessage[]>([]);
  
  // Get sendMessageMutation để gửi message với attachment
  const sendMessageWithAttachment = useCallback(
    async (content: string, type: 'TEXT' | 'IMAGE' | 'FILE', attachmentId?: string) => {
      if (!selectedConversation) return;
      
      await chatApi.sendMessage({
        conversationId: selectedConversation.id,
        content,
        type,
        attachmentId,
      });
    },
    [selectedConversation]
  );
  
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
      }, 100);
      
      // Double check scroll sau 200ms
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
      
      // Smooth scroll cuối cùng
      setTimeout(() => {
        scrollToBottom(false);
      }, 400);
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
  
  // Tính toán chiều cao footer động
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.offsetHeight;
        setFooterHeight(height + 20); // Thêm 20px buffer
      }
    };
    
    updateFooterHeight();
    
    // Update khi typing indicator xuất hiện/ẩn
    const resizeObserver = new ResizeObserver(() => {
      updateFooterHeight();
    });
    
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }
    
    // Update khi window resize
    window.addEventListener('resize', updateFooterHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFooterHeight);
    };
  }, [typingUsers.length, selectedConversation]);
  
  // Fetch pinned messages when conversation changes
  useEffect(() => {
    const fetchPinnedMessages = async () => {
      if (!selectedConversation?.id) {
        setPinnedMessages([]);
        return;
      }
      
      try {
        const response = await chatApi.getPinnedMessages(selectedConversation.id);
        if (response.data) {
          setPinnedMessages(Array.isArray(response.data) ? response.data : []);
        } else {
          setPinnedMessages([]);
        }
      } catch (error) {
        console.error("❌ Error fetching pinned messages:", error);
        setPinnedMessages([]);
      }
    };
    
    fetchPinnedMessages();
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
      
      const messageToSend = inputMessage.trim();
      
      try {
        // Clear input trước để UI phản hồi nhanh
        setInputMessage("");
        
        // Focus input ngay lập tức trước khi gửi để đảm bảo không mất focus
        inputRef.current?.focus();
        
        sendMessageHook(messageToSend, "TEXT");
        
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
        
        // Auto scroll to bottom và đảm bảo focus
        requestAnimationFrame(() => {
          scrollToBottom(true); // instant scroll
          // Focus input sau khi DOM đã cập nhật
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        });
        
        // Double check scroll sau 50ms và đảm bảo focus
        setTimeout(() => {
          scrollToBottom(true);
          inputRef.current?.focus();
        }, 50);
        
        // Smooth scroll cuối cùng và đảm bảo focus vẫn còn
        setTimeout(() => {
          scrollToBottom(false);
          // Đảm bảo input vẫn focus sau khi scroll
          if (document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
          }
        }, 200);
        
        // Final focus check sau khi mọi thứ đã ổn định
        setTimeout(() => {
          if (document.activeElement !== inputRef.current && inputRef.current) {
            inputRef.current.focus();
          }
        }, 400);
      } catch (error) {
        console.error("❌ Error sending message:", error);
        // Vẫn focus input ngay cả khi có lỗi
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
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
      try {
        togglePin(messageId, !currentlyPinned);
        
        // Refresh pinned messages after toggle
        if (selectedConversation?.id) {
          setTimeout(async () => {
            try {
              const response = await chatApi.getPinnedMessages(selectedConversation.id);
              if (response.data) {
                setPinnedMessages(Array.isArray(response.data) ? response.data : []);
              } else {
                setPinnedMessages([]);
              }
            } catch (error) {
              console.error("❌ Error refreshing pinned messages:", error);
            }
          }, 300);
        }
      } catch (error) {
        console.error("❌ Error toggling pin:", error);
      }
    },
    [togglePin, selectedConversation?.id]
  );
  
  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File, type: 'IMAGE' | 'FILE') => {
      if (!selectedConversation || isUploading) return;
      
      setIsUploading(true);
      try {
        const uploadResponse = await (type === 'IMAGE' 
          ? uploadImage(file, selectedConversation.id)
          : uploadFile({ file, conversationId: selectedConversation.id, type: 'FILE' }));
        
        if (uploadResponse.data) {
          // Gửi tin nhắn với attachment
          await sendMessageWithAttachment(
            uploadResponse.data.fileName || (type === 'IMAGE' ? 'Ảnh' : 'File'),
            type,
            uploadResponse.data.id
          );
        }
      } catch (error) {
        console.error("❌ Error uploading file:", error);
        alert("Không thể tải file lên. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedConversation, isUploading, sendMessageWithAttachment]
  );
  
  // Handle image selection
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file, 'IMAGE');
      }
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );
  
  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file, 'FILE');
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );
  
  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Trigger image input
  const triggerImageInput = useCallback(() => {
    imageInputRef.current?.click();
  }, []);
  
  // ==================== Render Helpers ====================
  
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Format date marker - hiển thị ngày/thứ/tháng/năm
  const formatDateMarker = (timestamp: string): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    
    // So sánh ngày (không tính giờ)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
    
    // Hôm nay
    if (diffDays === 0) {
      return "Hôm nay";
    }
    
    // Hôm qua
    if (diffDays === 1) {
      return "Hôm qua";
    }
    
    // Trong tuần này (từ 2-6 ngày trước)
    if (diffDays >= 2 && diffDays <= 6) {
      return date.toLocaleDateString("vi-VN", { weekday: "long" });
    }
    
    // Cùng tháng nhưng khác tuần
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
    }
    
    // Cùng năm nhưng khác tháng
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
    }
    
    // Khác năm
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
  };
  
  // Kiểm tra xem có cần hiển thị date marker không
  const shouldShowDateMarker = (currentMessage: IMessage, previousMessage: IMessage | null): boolean => {
    if (!previousMessage) return true; // Tin nhắn đầu tiên
    
    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);
    
    // So sánh ngày (không tính giờ)
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const previousDateOnly = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
    
    return currentDateOnly.getTime() !== previousDateOnly.getTime();
  };
  
  const getConversationName = (conversation: IConversation) => {
    return conversation.name || "Cuộc trò chuyện";
  };
  
  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl;
  };
  
  const renderMessage = (message: IMessage, index: number) => {
    const isOwnMessage = message.senderId === user?.id;
    const previousMessage = index > 0 ? filteredMessages[index - 1] : null;
    const showDateMarker = shouldShowDateMarker(message, previousMessage);
    
    return (
      <>
        {/* Date Marker */}
        {showDateMarker && (
          <div className="date-marker">
            <span>{formatDateMarker(message.createdAt)}</span>
          </div>
        )}
        
        <div
          key={message.id}
          data-message-id={message.id}
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
                {/* Hiển thị ảnh */}
                {message.type === 'IMAGE' && message.attachment && (
                  <div className="message-image" style={{ marginBottom: message.content ? '8px' : '0' }}>
                    <img
                      src={message.attachment.url.startsWith('http') 
                        ? message.attachment.url 
                        : `${import.meta.env.VITE_IMG_PATH || ''}${message.attachment.url}`}
                      alt="Ảnh"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '300px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Mở ảnh trong modal hoặc tab mới
                        window.open(
                          message.attachment!.url.startsWith('http') 
                            ? message.attachment!.url 
                            : `${import.meta.env.VITE_IMG_PATH || ''}${message.attachment!.url}`,
                          '_blank'
                        );
                      }}
                    />
                  </div>
                )}
                
                {/* Hiển thị file */}
                {message.type === 'FILE' && message.attachment && (
                  <div className="message-file" style={{ marginBottom: message.content ? '8px' : '0' }}>
                    <div className="file-attach" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                      borderRadius: '12px',
                      maxWidth: '300px'
                    }}>
                      <div className="file-icon" style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.3)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        <i className="ti ti-file" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {message.attachment.fileName || 'File đính kèm'}
                        </p>
                        <small style={{
                          fontSize: '12px',
                          opacity: 0.7
                        }}>
                          {(message.attachment.fileSize / 1024).toFixed(1)} KB
                        </small>
                      </div>
                      <a
                        href={message.attachment.url.startsWith('http') 
                          ? message.attachment.url 
                          : `${import.meta.env.VITE_IMG_PATH || ''}${message.attachment.url}`}
                        download
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.3)' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          color: 'inherit',
                          flexShrink: 0
                        }}
                        title="Tải xuống"
                      >
                        <i className="ti ti-download" />
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Hiển thị nội dung text */}
                {message.content && (
                  <div style={{ 
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                )}
              </div>
              
              {/* Read status - chỉ hiển thị "Đã xem" cho 1-1 conversation */}
              {isOwnMessage && message.readCount > 0 && selectedConversation?.type === 'PRIVATE' && (
                <div className="chat-actions mt-1">
                  <small className="text-muted">
                    ✓ Đã xem
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
      </>
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
          padding: 20px 20px calc(var(--footer-height, 100px) + 20px) 20px !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          position: relative;
        }
        
        .messages {
          display: flex;
          flex-direction: column;
          gap: 15px;
          flex: 1;
          min-height: 0;
        }
        
        /* ========== EMPTY/LOADING STATE - CĂN GIỮA ========== */
        .empty-state-container,
        .loading-state-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% - 40px);
          max-width: 400px;
          text-align: center;
          padding: 20px;
          z-index: 1;
        }
        
        .empty-state-container i,
        .loading-state-container i {
          display: block;
          margin: 0 auto 16px;
        }
        
        .empty-state-container h5,
        .loading-state-container h5 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .empty-state-container p,
        .loading-state-container p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        
        .loading-state-container .spinner-border {
          width: 48px;
          height: 48px;
          border-width: 4px;
          margin: 0 auto;
          border-color: #667eea;
          border-right-color: transparent;
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
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
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
        
        /* ========== DATE MARKER ========== */
        .date-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          position: relative;
        }
        
        .date-marker::before,
        .date-marker::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e0e0e0;
        }
        
        .date-marker span {
          display: inline-block;
          padding: 6px 16px;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 13px;
          color: #666;
          font-weight: 500;
          margin: 0 12px;
        }
        
        /* ========== MESSAGE IMAGE ========== */
        .message-image img {
          max-width: 300px;
          max-height: 300px;
          border-radius: 12px;
          object-fit: cover;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .message-image img:hover {
          transform: scale(1.02);
        }
        
        /* ========== MESSAGE FILE ========== */
        .message-file .file-attach {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f0f0f0;
          border-radius: 12px;
          max-width: 300px;
          transition: background 0.2s ease;
        }
        
        .chats-right .message-file .file-attach {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .message-file .file-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .chats-right .message-file .file-icon {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* ========== HIGHLIGHT MESSAGE ========== */
        .highlight-message {
          animation: highlightPulse 2s ease;
        }
        
        @keyframes highlightPulse {
          0% { background-color: rgba(102, 126, 234, 0.3); }
          50% { background-color: rgba(102, 126, 234, 0.1); }
          100% { background-color: transparent; }
        }
        
        /* ========== PINNED MESSAGES SECTION ========== */
        .pinned-messages-section {
          flex-shrink: 0;
        }
        
        .pinned-messages-section::-webkit-scrollbar {
          width: 4px;
        }
        
        .pinned-messages-section::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .pinned-messages-section::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        
        .pinned-messages-section::-webkit-scrollbar-thumb:hover {
          background: #555;
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
          <div 
            className="chat-body chat-page-group"
            style={{
              paddingBottom: `${footerHeight + 20}px`
            }}
          >
            {/* Pinned Messages Section */}
            {pinnedMessages.length > 0 && (
              <div className="pinned-messages-section" style={{
                padding: '12px 20px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                marginBottom: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <i className="ti ti-pin-filled" style={{ color: '#667eea', fontSize: '16px' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#667eea' }}>
                    Tin nhắn đã ghim
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {pinnedMessages.map((pinnedMsg) => (
                    <div
                      key={pinnedMsg.id}
                      onClick={() => {
                        // Scroll to message
                        const messageElement = document.querySelector(`[data-message-id="${pinnedMsg.id}"]`);
                        if (messageElement) {
                          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight message
                          messageElement.classList.add('highlight-message');
                          setTimeout(() => {
                            messageElement.classList.remove('highlight-message');
                          }, 2000);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.borderColor = '#667eea';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                          {pinnedMsg.senderName}
                        </span>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                          {formatTime(pinnedMsg.createdAt)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {pinnedMsg.type === 'IMAGE' && '📷 Hình ảnh'}
                        {pinnedMsg.type === 'FILE' && '📎 File'}
                        {pinnedMsg.type === 'TEXT' && pinnedMsg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="messages">
              {/* Loading State */}
              {isLoadingMessages && (
                <div className="loading-state-container">
                  <div className="spinner-border text-primary" role="status" style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderWidth: '4px',
                    color: '#667eea'
                  }}>
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p style={{ marginTop: '16px', marginBottom: 0, fontSize: '14px', color: '#666' }}>
                    Đang tải tin nhắn...
                  </p>
                </div>
              )}
              
              {/* Messages - Hiển thị theo thứ tự thời gian (cũ → mới) */}
              {!isLoadingMessages && filteredMessages.length > 0 && 
                filteredMessages.map((message, index) => renderMessage(message, index))
              }
              
              {/* No search results */}
              {!isLoadingMessages && searchKeyword && filteredMessages.length === 0 && messages.length > 0 && (
                <div className="empty-state-container">
                  <i className="ti ti-search-off" style={{ fontSize: "64px", color: "#667eea", display: 'block', marginBottom: '16px' }} />
                  <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    Không tìm thấy kết quả
                  </h5>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Thử tìm với từ khóa khác
                  </p>
                </div>
              )}
              
              {/* Empty State */}
              {!isLoadingMessages && messages.length === 0 && selectedConversation && !searchKeyword && (
                <div className="empty-state-container">
                  <i className="ti ti-message-off" style={{ fontSize: "64px", color: "#667eea", display: 'block', marginBottom: '16px' }} />
                  <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    Chưa có tin nhắn nào
                  </h5>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Hãy bắt đầu cuộc trò chuyện! 💬
                  </p>
                </div>
              )}
              
              {/* No conversation selected */}
              {!selectedConversation && (
                <div className="empty-state-container">
                  <i className="ti ti-message-circle" style={{ fontSize: "64px", color: "#667eea", display: 'block', marginBottom: '16px' }} />
                  <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    Chọn một cuộc trò chuyện
                  </h5>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    Chọn một cuộc trò chuyện từ sidebar để bắt đầu
                  </p>
                </div>
              )}
              
              {/* Scroll anchor - để scroll đến đây khi có tin nhắn mới */}
              {!isLoadingMessages && filteredMessages.length > 0 && (
                <div 
                  ref={messagesEndRef} 
                  style={{ 
                    height: '1px', 
                    minHeight: '1px',
                    paddingTop: '20px',
                    marginTop: '10px',
                    scrollMarginTop: '20px'
                  }} 
                />
              )}
            </div>
              </div>
          
          {/* Chat Footer */}
        <div className="chat-footer" ref={footerRef} style={{ '--footer-height': `${footerHeight}px` } as React.CSSProperties}>
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
              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                disabled={isUploading || !selectedConversation}
              />
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={isUploading || !selectedConversation}
              />
              
              {/* Left side: Upload buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Tooltip title="Gửi ảnh" placement="top">
                  <button
                    type="button"
                    className="action-circle"
                    onClick={triggerImageInput}
                    disabled={isUploading || isSending || !selectedConversation}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#f5f5f5',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#667eea';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#f5f5f5';
                        e.currentTarget.style.color = '#666';
                      }
                    }}
                  >
                    {isUploading ? (
                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px' }}>
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    ) : (
                      <i className="ti ti-photo" style={{ fontSize: '18px' }} />
                    )}
                  </button>
                </Tooltip>
                
                <Tooltip title="Gửi file" placement="top">
                  <button
                    type="button"
                    className="action-circle"
                    onClick={triggerFileInput}
                    disabled={isUploading || isSending || !selectedConversation}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#f5f5f5',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#667eea';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#f5f5f5';
                        e.currentTarget.style.color = '#666';
                      }
                    }}
                  >
                    <i className="ti ti-paperclip" style={{ fontSize: '18px' }} />
                  </button>
                </Tooltip>
              </div>
              
              {/* Center: Message Input */}
              <div className="form-wrap" style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isSending || isUploading || !selectedConversation}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '21px',
                    padding: '0 18px',
                    border: '1px solid #d0d0d0',
                    background: '#f8f9fa',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
                
              {/* Right side: Send Button */}
              <div className="form-btn">
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={(!inputMessage.trim() && !isUploading) || isSending || isUploading || !selectedConversation}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: 'none',
                    background: inputMessage.trim() || isUploading 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : '#d0d0d0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (!inputMessage.trim() && !isUploading) || isSending || isUploading || !selectedConversation 
                      ? 'not-allowed' 
                      : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: inputMessage.trim() || isUploading 
                      ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled && (inputMessage.trim() || isUploading)) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {isSending || isUploading ? (
                    <div className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px' }}>
                      <span className="visually-hidden">Đang gửi...</span>
                    </div>
                  ) : (
                    <i className="ti ti-send" style={{ fontSize: '18px' }} />
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
