import { RefObject, useEffect, useCallback, useRef, useState } from "react";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import MessageItem from "./MessageItem";
import PinnedMessages from "./PinnedMessages";
import EmptyState from "./EmptyState";
import NewMessagesBadge from "./NewMessagesBadge";
import TypingIndicator from "./TypingIndicator";

interface ChatBodyProps {
  messages: IMessage[];
  filteredMessages: IMessage[];
  pinnedMessages: IMessage[];
  isLoadingMessages: boolean;
  searchKeyword: string;
  selectedConversation: IConversation | null;
  currentUserId?: string;
  userAvatarUrl?: string;
  userFullName?: string;
  userUsername?: string;
  footerHeight: number;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onTogglePin: (messageId: string, currentlyPinned: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinnedMessageClick: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  typingUsers?: string[]; // Typing indicator
  // Cursor pagination props
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const ChatBody = ({
  messages,
  filteredMessages,
  pinnedMessages,
  isLoadingMessages,
  searchKeyword,
  selectedConversation,
  currentUserId,
  userAvatarUrl,
  userFullName,
  userUsername,
  footerHeight: _footerHeight, // Reserved for future use
  messagesEndRef,
  onTogglePin,
  onDeleteMessage,
  onPinnedMessageClick,
  onUnpin,
  typingUsers = [], // Typing indicator
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ChatBodyProps) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);
  const prevConversationIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const initialLoadDoneRef = useRef<boolean>(false);
  const isAtBottomRef = useRef<boolean>(true); // Track if user is at bottom
  const lastSeenMessageCountRef = useRef<number>(0); // Track last seen message count for badge
  
  // State for new messages badge
  const [unreadNewMessagesCount, setUnreadNewMessagesCount] = useState(0);
  
  // Fallback: Nếu filteredMessages rỗng nhưng messages có dữ liệu và không có search keyword, sử dụng messages
  const displayMessages = searchKeyword.trim() 
    ? filteredMessages 
    : (filteredMessages.length > 0 ? filteredMessages : messages);
  
  // Reset initial load flag khi conversation thay đổi
  useEffect(() => {
    if (selectedConversation?.id !== prevConversationIdRef.current) {
      prevConversationIdRef.current = selectedConversation?.id || null;
      prevMessageCountRef.current = 0;
      initialLoadDoneRef.current = false;
      lastSeenMessageCountRef.current = 0;
      setUnreadNewMessagesCount(0);
      isAtBottomRef.current = true;
    }
  }, [selectedConversation?.id]);
  
  // Scroll up handler - Load more messages khi scroll gần đầu
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // ✅ FIX: Tăng threshold lên 250px để user có thể scroll lên một chút mà vẫn auto-scroll
    // 250px cho phép user xem tin cũ nhưng vẫn được coi là "đang theo dõi chat"
    const threshold = 250;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    // Update isAtBottomRef (không log để giảm noise)
    
    isAtBottomRef.current = isAtBottom;
    
    // Trigger load more khi scroll lên gần đầu (< 150px từ top)
    if (scrollTop < 150 && hasMore && !isLoadingMore && !loadMoreThrottleRef.current && onLoadMore) {
      loadMoreThrottleRef.current = true;
      onLoadMore();
      
      // Throttle: chờ 500ms trước khi cho phép load tiếp
      setTimeout(() => {
        loadMoreThrottleRef.current = false;
      }, 500);
    }
  }, [hasMore, isLoadingMore, onLoadMore]);
  
  // Auto scroll CHỈ khi initial load - KHÔNG scroll khi load more
  useEffect(() => {
    // Detect nếu đây là initial load hay load more
    const isInitialLoad = prevMessageCountRef.current === 0 && displayMessages.length > 0;
    const isLoadMoreCompleted = displayMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0;
    
    // Update message count ref
    prevMessageCountRef.current = displayMessages.length;
    
    // Chỉ scroll khi:
    // 1. Đây là initial load (không phải load more)
    // 2. Không đang loading
    // 3. Có conversation được chọn
    // 4. Chưa scroll lần đầu cho conversation này
    if (isInitialLoad && !isLoadingMessages && selectedConversation && !initialLoadDoneRef.current) {
      const scrollToBottom = () => {
        const chatBody = chatBodyRef.current || document.querySelector('#middle .chat-body.chat-page-group') as HTMLElement;
        if (chatBody) {
          // Scroll đến cuối cùng
          const scrollHeight = chatBody.scrollHeight;
          const clientHeight = chatBody.clientHeight;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);
          chatBody.scrollTop = maxScroll;
        }
      };
      
      // Scroll ngay lập tức
      requestAnimationFrame(scrollToBottom);
      
      // Double check sau khi DOM render hoàn toàn
      setTimeout(scrollToBottom, 100);
      setTimeout(() => {
        scrollToBottom();
        initialLoadDoneRef.current = true; // Đánh dấu đã scroll xong
      }, 300);
    }
    
    // Không auto scroll khi load more; chỉ xử lý initial load
  }, [isLoadingMessages, displayMessages.length, selectedConversation?.id]);
  
  // ✅ Auto-scroll thông minh + Badge tracking - FIXED: Gộp chung 1 useEffect để tránh conflict
  useEffect(() => {
    // Đợi initial load xong
    if (!initialLoadDoneRef.current) {
      lastSeenMessageCountRef.current = displayMessages.length;
      return;
    }
    
    // Check có tin nhắn mới không
    const hasNewMessages = displayMessages.length > lastSeenMessageCountRef.current;
    
    if (hasNewMessages) {
      const newCount = displayMessages.length - lastSeenMessageCountRef.current;
      
      if (isAtBottomRef.current) {
        // ✅ User đang ở cuối => Auto-scroll + reset badge
        requestAnimationFrame(() => {
          const chatBody = chatBodyRef.current;
          if (chatBody) {
            chatBody.scrollTo({
              top: chatBody.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
        setUnreadNewMessagesCount(0);
      } else {
        // ✅ User KHÔNG ở cuối => Tăng badge count (KHÔNG scroll)
        setUnreadNewMessagesCount(prev => prev + newCount);
      }
      
      lastSeenMessageCountRef.current = displayMessages.length;
    }
  }, [displayMessages.length]); // ✅ CHỈ phụ thuộc vào displayMessages.length
  
  // Scroll to bottom handler for badge
  const scrollToBottomSmooth = useCallback(() => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: 'smooth'
      });
    }
    setUnreadNewMessagesCount(0);
    lastSeenMessageCountRef.current = displayMessages.length;
    isAtBottomRef.current = true;
  }, [displayMessages.length]);
  
  return (
    <div 
      ref={chatBodyRef}
      className="chat-body chat-page-group"
      onScroll={handleScroll}
      style={{
        width: '100%',
        flex: '1 1 auto',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        visibility: 'visible',
        opacity: 1,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Pinned Messages Section - Sticky ở đầu chat */}
      {pinnedMessages.length > 0 && (
        <div 
          className="pinned-messages-sticky"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <PinnedMessages 
            pinnedMessages={pinnedMessages} 
            onMessageClick={onPinnedMessageClick}
            onUnpin={onUnpin}
          />
        </div>
      )}
      
      <div 
        className="messages"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          flex: '1 1 auto',
          minHeight: 'min-content',
          width: '100%',
          position: 'relative',
          visibility: 'visible',
          opacity: 1,
          padding: '16px 20px 20px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Loading More Indicator - Hiển thị khi đang load thêm tin nhắn cũ */}
        {isLoadingMore && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            gap: '8px',
          }}>
            <div 
              className="spinner-border spinner-border-sm" 
              role="status" 
              style={{ 
                width: '20px', 
                height: '20px', 
                borderWidth: '2px',
                color: '#667eea'
              }}
            >
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Đang tải tin nhắn cũ hơn...
            </span>
          </div>
        )}
        
        {/* Has More Indicator - Hiển thị khi còn tin nhắn cũ hơn */}
        {hasMore && !isLoadingMore && !isLoadingMessages && displayMessages.length > 0 && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 16px',
              marginBottom: '8px',
            }}
          >
            <button
              onClick={onLoadMore}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              <i className="ti ti-arrow-up" style={{ fontSize: '14px' }} />
              Tải thêm tin nhắn
            </button>
          </div>
        )}
        
        {/* Loading State */}
        {isLoadingMessages && <EmptyState type="loading" />}
        
        {/* Messages - Hiển thị theo thứ tự thời gian (cũ → mới) */}
        {!isLoadingMessages && displayMessages.length > 0 && (
          <>
            {displayMessages.map((message, index) => {
              try {
                const previousMessage = index > 0 ? displayMessages[index - 1] : null;
                const isOwnMessage = message.senderId === currentUserId;
                
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    previousMessage={previousMessage}
                    isOwnMessage={isOwnMessage}
                    currentUserId={currentUserId}
                    userAvatarUrl={userAvatarUrl}
                    userFullName={userFullName}
                    userUsername={userUsername}
                    selectedConversation={selectedConversation}
                    onTogglePin={onTogglePin}
                    onDeleteMessage={onDeleteMessage}
                  />
                );
              } catch (error) {
                console.error('Error rendering message:', error, message);
                return (
                  <div key={message.id} style={{ padding: '10px', color: 'red' }}>
                    Error rendering message: {message.id}
                  </div>
                );
              }
            })}
          </>
        )}
        
        {/* Typing Indicator - hiển thị khi có người đang nhập */}
        {typingUsers.length > 0 && !isLoadingMessages && displayMessages.length > 0 && (
          <div style={{ padding: '8px 0', marginLeft: '46px' }}>
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        )}
        
        {/* No search results - chỉ hiển thị khi đang search và không có kết quả */}
        {!isLoadingMessages && searchKeyword.trim() && displayMessages.length === 0 && messages.length > 0 && (
          <EmptyState type="no-results" />
        )}
        
        {/* Empty State - chỉ hiển thị khi không có messages và không đang search */}
        {!isLoadingMessages && !searchKeyword.trim() && displayMessages.length === 0 && selectedConversation && (
          <EmptyState type="no-messages" />
        )}
        
        {/* No conversation selected - chỉ hiển thị khi không có conversation được chọn */}
        {!isLoadingMessages && !selectedConversation && (
          <EmptyState type="no-conversation" />
        )}
        
        {/* Scroll anchor - để scroll đến đây khi có tin nhắn mới */}
        {!isLoadingMessages && displayMessages.length > 0 && (
          <div 
            ref={messagesEndRef} 
            style={{ 
              height: '1px', 
              minHeight: '1px',
              paddingTop: '20px',
              marginTop: '10px',
              marginBottom: '20px',
              scrollMarginTop: '20px',
            }} 
          />
        )}
      </div>
      
      {/* New Messages Badge - Floating button */}
      {unreadNewMessagesCount > 0 && (
        <NewMessagesBadge 
          unreadCount={unreadNewMessagesCount}
          onScrollToBottom={scrollToBottomSmooth}
        />
      )}
    </div>
  );
};

export default ChatBody;

