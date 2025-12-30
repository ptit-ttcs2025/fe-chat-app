/**
 * Group Chat Body Component
 * Hiển thị messages với sender info (name + avatar) vì là group chat
 * Updated to use MessageItem component for consistent UI with 1-1 chat
 */

import { RefObject, useEffect, useCallback, useRef, useState } from "react";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import type { IGroupMember } from "@/apis/group/group.type";
import MessageItem from "@/feature-module/pages/chat/components/MessageItem";
import PinnedMessages from "@/feature-module/pages/chat/components/PinnedMessages";
import NewMessagesBadge from "@/feature-module/pages/chat/components/NewMessagesBadge";

interface GroupChatBodyProps {
  messages: IMessage[];
  pinnedMessages: IMessage[];
  members: IGroupMember[]; // Keep for future features, not used in rendering now
  isLoadingMessages: boolean;
  selectedConversation: IConversation | null;
  currentUserId?: string;
  userAvatarUrl?: string;
  userFullName?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onTogglePin: (messageId: string, currentlyPinned: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinnedMessageClick: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  typingUsers?: string[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const GroupChatBody = ({
  messages,
  pinnedMessages,
  members: _members, // Reserved for future use
  isLoadingMessages,
  selectedConversation,
  currentUserId,
  userAvatarUrl,
  userFullName,
  messagesEndRef,
  onTogglePin,
  onDeleteMessage,
  onPinnedMessageClick,
  onUnpin,
  typingUsers = [],
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: GroupChatBodyProps) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);
  const prevConversationIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);

  // Refs for tracking scroll position
  const isAtBottomRef = useRef<boolean>(true);
  const lastMessageCountRef = useRef<number>(0);

  // States for scroll badge
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);


  // Helper: Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior,
      });
      // Reset tracking
      isAtBottomRef.current = true;
      setUnreadCount(0);
      setShowScrollButton(false);
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Handle scroll events - Load more when scroll to top
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Check if at bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottomRef.current = isAtBottom;

      // Show scroll button if scrolled up
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
      setShowScrollButton(isScrolledUp || unreadCount > 0);

      if (isAtBottom) {
        if (unreadCount > 0) setUnreadCount(0);
        lastMessageCountRef.current = messages.length;
      }

      // Load more when scroll near top
      if (
        scrollTop < 150 &&
        hasMore &&
        !isLoadingMore &&
        !loadMoreThrottleRef.current &&
        onLoadMore
      ) {
        loadMoreThrottleRef.current = true;
        onLoadMore();

        // Reset throttle after 500ms
        setTimeout(() => {
          loadMoreThrottleRef.current = false;
        }, 500);
      }
    },
    [hasMore, isLoadingMore, onLoadMore, unreadCount, messages.length]
  );

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
    if (
      !initialLoadDoneRef.current &&
      !isLoadingMessages &&
      selectedConversation &&
      messages.length > 0
    ) {
      const timer = setTimeout(() => {
        scrollToBottom("auto");
        initialLoadDoneRef.current = true;
        lastMessageCountRef.current = messages.length;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMessages, selectedConversation, messages.length, scrollToBottom]);

  // Handle new messages
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;

    const currentCount = messages.length;
    const prevCount = lastMessageCountRef.current;

    if (currentCount > prevCount) {
      if (!isLoadingMore) {
        // New messages appended
        if (isAtBottomRef.current) {
          scrollToBottom("smooth");
        } else {
          // User scrolled up, show badge
          setUnreadCount((prev) => prev + (currentCount - prevCount));
          setShowScrollButton(true);
        }
      }
    }

    lastMessageCountRef.current = currentCount;
  }, [messages.length, isLoadingMore, scrollToBottom]);

  // Empty state
  if (!selectedConversation) {
    return (
      <div
        className="chat-body-wrapper"
        style={{
          width: "100%",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100%", width: "100%" }}
        >
          <div className="text-center">
            <i
              className="ti ti-users"
              style={{ fontSize: "64px", color: "#ccc" }}
            />
            <h5 className="mt-3">Chọn một nhóm để bắt đầu</h5>
            <p className="text-muted">
              Chọn nhóm từ sidebar để xem tin nhắn
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <div
        className="chat-body-wrapper"
        style={{
          width: "100%",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100%", width: "100%" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="chat-body-wrapper"
      style={{
        width: "100%",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={chatBodyRef}
        className="chat-body chat-page-group"
        onScroll={handleScroll}
        style={{
          width: "100%",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Pinned Messages Section - Sticky ở đầu chat */}
        {pinnedMessages.length > 0 && (
          <div
            className="pinned-messages-sticky"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 40,
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
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
            display: "flex",
            flexDirection: "column",
            gap: 0,
            flex: "1 1 auto",
            minHeight: "min-content",
            width: "100%",
            position: "relative",
            visibility: "visible",
            opacity: 1,
            padding: "16px 20px 20px 20px",
            boxSizing: "border-box",
          }}
        >
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "16px",
                gap: "8px",
              }}
            >
              <div
                className="spinner-border spinner-border-sm"
                role="status"
                style={{
                  width: "20px",
                  height: "20px",
                  borderWidth: "2px",
                  color: "#667eea",
                }}
              >
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Đang tải tin nhắn cũ hơn...
              </span>
            </div>
          )}

          {/* Has More Indicator */}
          {hasMore && !isLoadingMore && !isLoadingMessages && messages.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "8px 16px",
                marginBottom: "8px",
              }}
            >
              <button
                onClick={onLoadMore}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                }}
              >
                <i className="ti ti-arrow-up" style={{ fontSize: "14px" }} />
                Tải thêm tin nhắn
              </button>
            </div>
          )}

          {/* Messages - Using MessageItem component for consistent UI */}
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
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
                userUsername={userFullName} // Use fullName as fallback
                selectedConversation={selectedConversation}
                onTogglePin={onTogglePin}
                onDeleteMessage={onDeleteMessage}
              />
            );
          })}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="chats" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}>
              <div className="chat-avatar" style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div className="avatar avatar-sm" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                }}>
                  <i className="ti ti-dots" />
                </div>
              </div>
              <div className="chat-content">
                <div className="message-content" style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}>
                  <span style={{ fontWeight: 500, color: '#667eea' }}>
                    {typingUsers.join(", ")}
                  </span> đang nhập...
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div
            ref={messagesEndRef}
            style={{
              height: "1px",
              minHeight: "1px",
              paddingTop: "20px",
              marginTop: "10px",
              marginBottom: "20px",
              scrollMarginTop: "20px",
            }}
          />
        </div>
      </div>

      {/* New Messages Badge */}
      <NewMessagesBadge
        show={showScrollButton}
        unreadCount={unreadCount}
        onScrollToBottom={() => scrollToBottom("smooth")}
      />
    </div>
  );
};

export default GroupChatBody;

