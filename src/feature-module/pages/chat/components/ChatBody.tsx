import { RefObject, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useState } from "react";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import MessageItem from "./MessageItem";
import PinnedMessages from "./PinnedMessages";
import EmptyState from "./EmptyState";
import NewMessagesBadge from "./NewMessagesBadge";

export interface ChatBodyHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

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

const ChatBody = forwardRef<ChatBodyHandle, ChatBodyProps>(({
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
}, ref) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);
  const prevConversationIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);

  // Refs for tracking
  const isAtBottomRef = useRef<boolean>(true);
  const lastMessageCountRef = useRef<number>(0);

  // States for scroll and badge
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fallback: messages to display
  const displayMessages = searchKeyword.trim()
    ? filteredMessages
    : (filteredMessages.length > 0 ? filteredMessages : messages);

  // Helper: Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior
      });
      // Force update tracking
      isAtBottomRef.current = true;
      setUnreadCount(0);
      setShowScrollButton(false);
      lastMessageCountRef.current = displayMessages.length;
    }
  }, [displayMessages.length]);

  // Expose scrollToBottom to parent
  useImperativeHandle(ref, () => ({
    scrollToBottom
  }));

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Standard threshold: 100px from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottomRef.current = isAtBottom;

    // Show button if user scrolled up significantly (> 300px) OR has unread messages
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isScrolledUp || unreadCount > 0);

    if (isAtBottom) {
      if (unreadCount > 0) setUnreadCount(0);
      lastMessageCountRef.current = displayMessages.length;
    }

    // Trigger load more when scrolling near top (< 150px)
    if (scrollTop < 150 && hasMore && !isLoadingMore && !loadMoreThrottleRef.current && onLoadMore) {
      loadMoreThrottleRef.current = true;
      onLoadMore();
      setTimeout(() => { loadMoreThrottleRef.current = false; }, 500);
    }
  }, [hasMore, isLoadingMore, onLoadMore, unreadCount, displayMessages.length]);

  // Reset states on conversation change
  useEffect(() => {
    if (selectedConversation?.id !== prevConversationIdRef.current) {
      prevConversationIdRef.current = selectedConversation?.id || null;
      initialLoadDoneRef.current = false;
      setUnreadCount(0);
      setShowScrollButton(false);
      isAtBottomRef.current = true;
      lastMessageCountRef.current = 0;
    }
  }, [selectedConversation?.id]);

  // Handle initial load scroll
  useEffect(() => {
    if (!initialLoadDoneRef.current && !isLoadingMessages && selectedConversation && displayMessages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
        initialLoadDoneRef.current = true;
        lastMessageCountRef.current = displayMessages.length;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMessages, selectedConversation, displayMessages.length, scrollToBottom]);

  // New messages logic
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;

    const currentCount = displayMessages.length;
    const prevCount = lastMessageCountRef.current;

    if (currentCount > prevCount) {
      if (!isLoadingMore) {
        // Appended messages (new incoming messages)
        if (isAtBottomRef.current) {
          scrollToBottom('smooth');
        } else {
          // User is scrolled up, track unread and show badge
          setUnreadCount(prev => prev + (currentCount - prevCount));
          setShowScrollButton(true);
        }
      }
    }

    lastMessageCountRef.current = currentCount;
  }, [displayMessages.length, isLoadingMore, scrollToBottom]);

  return (
    <div
      className="chat-body-wrapper"
      style={{
        width: '100%',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative', // Relative for the fixed badge
        overflow: 'hidden',
      }}
    >
      <div
        ref={chatBodyRef}
        className="chat-body chat-page-group"
        onScroll={handleScroll}
        style={{
          width: '100%',
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
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
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '8px' }}>
              <div className="spinner-border spinner-border-sm" role="status" style={{ width: '20px', height: '20px', borderWidth: '2px', color: '#667eea' }}>
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Đang tải tin nhắn cũ hơn...</span>
            </div>
          )}

          {/* Has More Indicator */}
          {hasMore && !isLoadingMore && !isLoadingMessages && displayMessages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px', marginBottom: '8px' }}>
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
                }}
              >
                <i className="ti ti-arrow-up" style={{ fontSize: '14px' }} />
                Tải thêm tin nhắn
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingMessages && <EmptyState type="loading" />}

          {/* Messages */}
          {!isLoadingMessages && displayMessages.length > 0 && (
            <>
              {displayMessages.map((message, index) => {
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
              })}
            </>
          )}

          {/* Empty States */}
          {!isLoadingMessages && searchKeyword.trim() && displayMessages.length === 0 && messages.length > 0 && (
            <EmptyState type="no-results" />
          )}
          {!isLoadingMessages && !searchKeyword.trim() && displayMessages.length === 0 && selectedConversation && (
            <EmptyState type="no-messages" />
          )}
          {!isLoadingMessages && !selectedConversation && (
            <EmptyState type="no-conversation" />
          )}

          {/* Scroll anchor */}
          {!isLoadingMessages && displayMessages.length > 0 && (
            <div ref={messagesEndRef} style={{ height: '1px', minHeight: '1px', paddingTop: '20px', marginTop: '10px', marginBottom: '20px', scrollMarginTop: '20px' }} />
          )}
        </div>
      </div>

      {/* New Messages Badge - Fixed Position at bottom right of wrapper */}
      <NewMessagesBadge
        show={showScrollButton}
        unreadCount={unreadCount}
        onScrollToBottom={() => scrollToBottom('smooth')}
      />
    </div>
  );
});

export default ChatBody;

