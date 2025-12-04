/**
 * Chat Component - Tích hợp API đầy đủ với theme gốc
 * Giữ nguyên giao diện nhưng thêm logic real-time và modern features
 * Refactored: Tách thành các component nhỏ hơn để dễ quản lý
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";

// Theme Components
import ContactInfo from "../../../core/modals/contact-info-off-canva";

// API & Hooks - Tích hợp real-time
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useWebSocketStatus, useChatActions } from "@/hooks/useWebSocketChat";
import websocketService from "@/core/services/websocket.service";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import { uploadImage, uploadFile, chatApi } from "@/apis/chat/chat.api";

// Components
import ChatHeader from "./components/ChatHeader";
import ChatSearch from "./components/ChatSearch";
import ChatBody from "./components/ChatBody";
import ChatFooter from "./components/ChatFooter";
import { chatStyles } from "./styles/chatStyles";

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
  
  // Messages cho conversation đã chọn (Cursor-based pagination)
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage: sendMessageHook,
    deleteMessage,
    togglePin,
    scrollToBottom,
    // Cursor pagination
    hasMore,
    isLoadingMore,
    loadMoreMessages,
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
  
  // NOTE: Đã chuyển logic auto-scroll sang ChatBody component
  // để tránh scroll khi load more messages
  
  // Filter messages when search keyword changes
  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = messages.filter(msg => 
        msg.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      // Luôn cập nhật filteredMessages với messages khi không có search keyword
      setFilteredMessages(messages);
    }
  }, [searchKeyword, messages]);
  
  // Đảm bảo filteredMessages được khởi tạo ngay khi messages thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      if (!searchKeyword.trim()) {
      setFilteredMessages(messages);
      }
    } else {
      setFilteredMessages([]);
    }
  }, [messages.length, searchKeyword]);
  
  // Focus input when conversation changes
  // NOTE: Scroll to bottom được xử lý trong ChatBody component
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation?.id]);
  
  // Tính toán chiều cao footer động
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        // Chỉ tính chiều cao thực tế của footer, không thêm buffer quá lớn
        const height = footerRef.current.offsetHeight;
        // Giới hạn footer height tối đa 150px để tránh tính sai
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    };
    
    // Delay một chút để đảm bảo DOM đã render
    const timeoutId = setTimeout(updateFooterHeight, 100);
    
    // Update khi typing indicator xuất hiện/ẩn
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        // Giới hạn footer height tối đa 150px
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    });
    
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }
    
    // Update khi window resize
    window.addEventListener('resize', updateFooterHeight);
    
    return () => {
      clearTimeout(timeoutId);
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
          const pinnedData = Array.isArray(response.data) ? response.data : [];
          setPinnedMessages(pinnedData);
        } else if (response && Array.isArray(response)) {
          // Trường hợp response trực tiếp là array
          setPinnedMessages(response);
        } else {
          // Fallback: Lọc từ messages nếu API không trả về đúng
          const pinnedFromMessages = messages.filter(m => m.pinned);
          setPinnedMessages(pinnedFromMessages);
        }
      } catch (error) {
        console.error("❌ Error fetching pinned messages:", error);
        // Fallback: Lọc từ messages
        const pinnedFromMessages = messages.filter(m => m.pinned);
        setPinnedMessages(pinnedFromMessages);
      }
    };
    
    fetchPinnedMessages();
  }, [selectedConversation?.id, messages]);
  
  // Sync pinned messages từ messages array khi messages thay đổi
  // Merge với existing pinned messages từ API (để hiển thị cả tin nhắn ghim của người khác)
  useEffect(() => {
    if (messages.length > 0) {
      const pinnedFromMessages = messages.filter(m => m.pinned);
      
      setPinnedMessages(prev => {
        // Tạo Map từ existing pinned messages (từ API)
        const existingMap = new Map(prev.map(p => [p.id, p]));
        
        // Cập nhật với pinned messages từ local messages
        pinnedFromMessages.forEach(msg => {
          existingMap.set(msg.id, msg);
        });
        
        // Xóa những message không còn pinned nữa (dựa trên local messages)
        messages.forEach(msg => {
          if (!msg.pinned && existingMap.has(msg.id)) {
            existingMap.delete(msg.id);
          }
        });
        
        const merged = Array.from(existingMap.values());
        
        // Sort theo thời gian mới nhất
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return merged;
      });
    }
  }, [messages]);
  
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
          const chatBody = document.querySelector('#middle .chat-body.chat-page-group') as HTMLElement;
          if (chatBody) {
            // Scroll đến cuối cùng
            const scrollHeight = chatBody.scrollHeight;
            const clientHeight = chatBody.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            chatBody.scrollTop = Math.max(0, maxScroll);
          }
          // Focus input sau khi DOM đã cập nhật
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        });
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
      if (!selectedConversation?.id) return;
      
      // Optimistic UI Update - Cập nhật ngay lập tức
      if (currentlyPinned) {
        // Bỏ ghim - xóa khỏi danh sách
        setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        // Ghim - tìm message và thêm vào đầu danh sách
        const messageToPin = messages.find(msg => msg.id === messageId);
        if (messageToPin) {
          setPinnedMessages(prev => [{ ...messageToPin, pinned: true }, ...prev]);
        }
      }
      
      // Gọi API toggle pin (không await vì là mutation)
        togglePin(messageId, !currentlyPinned);
        
      // Refresh từ server để đồng bộ
          setTimeout(async () => {
            try {
              const response = await chatApi.getPinnedMessages(selectedConversation.id);
              if (response.data) {
                setPinnedMessages(Array.isArray(response.data) ? response.data : []);
          } else if (response && Array.isArray(response)) {
            setPinnedMessages(response);
              }
            } catch (error) {
              console.error("❌ Error refreshing pinned messages:", error);
            }
      }, 150);
    },
    [togglePin, selectedConversation?.id, messages]
  );
  
  const handlePinnedMessageClick = useCallback(() => {
    // Logic đã được xử lý trong PinnedMessages component
  }, []);
  
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
      imageInputRef.current && (imageInputRef.current.value = '');
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
      fileInputRef.current && (fileInputRef.current.value = '');
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
      {/* Modern Styles */}
      <style>{chatStyles}</style>
      
      {/* Chat Container - Professional Layout Structure */}
      <div 
        className={`chat chat-messages show`} 
        id="middle"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          position: 'relative',
          '--footer-height': `${footerHeight}px`,
        } as React.CSSProperties}
      >
        {/* Header Section - Fixed at top */}
        <div style={{ 
          flexShrink: 0,
          zIndex: 10,
          position: 'relative',
        }}>
          <ChatHeader 
            selectedConversation={selectedConversation}
            onToggleSearch={toggleSearch}
          />
          
          <ChatSearch
            showSearch={showSearch}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
          />
        </div>
          
        {/* Body Section - Scrollable, takes remaining space */}
        <div style={{ 
          flex: '1 1 auto',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <ChatBody
            messages={messages}
            filteredMessages={filteredMessages}
            pinnedMessages={pinnedMessages}
            isLoadingMessages={isLoadingMessages}
            searchKeyword={searchKeyword}
            selectedConversation={selectedConversation}
            currentUserId={user?.id}
            userAvatarUrl={user?.avatarUrl}
            userFullName={user?.fullName}
            userUsername={user?.username}
            footerHeight={footerHeight}
            messagesEndRef={messagesEndRef}
            onTogglePin={handleTogglePin}
            onDeleteMessage={handleDeleteMessage}
            onPinnedMessageClick={handlePinnedMessageClick}
            onUnpin={(messageId) => handleTogglePin(messageId, true)}
            // Cursor pagination props
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreMessages}
          />
        </div>
        
        {/* Footer Section - Fixed at bottom */}
        <div style={{ 
          flexShrink: 0,
          zIndex: 100,
          position: 'relative',
        }}>
        <ChatFooter
          footerRef={footerRef}
          typingUsers={typingUsers}
          selectedConversation={selectedConversation}
          inputMessage={inputMessage}
          inputRef={inputRef}
          imageInputRef={imageInputRef}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          isSending={isSending}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSendMessage={handleSendMessage}
          onImageSelect={handleImageSelect}
          onFileSelect={handleFileSelect}
          onTriggerImageInput={triggerImageInput}
          onTriggerFileInput={triggerFileInput}
          footerHeight={footerHeight}
          onEmojiSelect={(emoji) => setInputMessage(prev => prev + emoji)}
        />
        </div>
      </div>
      {/* /Chat */}
      
      {/* Modals */}
      <ContactInfo />
    </>
  );
};

export default Chat;
