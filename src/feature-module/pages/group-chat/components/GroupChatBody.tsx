/**
 * Group Chat Body Component
 * Hiển thị messages với sender info (name + avatar) vì là group chat
 */

import { RefObject, useEffect, useCallback, useRef } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { Link } from "react-router-dom";
import ImageWithBasePath from "@/core/common/imageWithBasePath";
import Avatar from "@/feature-module/pages/chat/components/Avatar";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import type { IGroupMember } from "@/apis/group/group.type";
import PinnedMessages from "@/feature-module/pages/chat/components/PinnedMessages";

interface GroupChatBodyProps {
  messages: IMessage[];
  pinnedMessages: IMessage[];
  members: IGroupMember[];
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
  isAdmin?: boolean;
}

const GroupChatBody = ({
  messages,
  pinnedMessages,
  members,
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
  isAdmin = false,
}: GroupChatBodyProps) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);
  const prevConversationIdRef = useRef<string | null>(null);

  // Helper: Get member by userId
  const getMemberByUserId = useCallback(
    (userId: string) => {
      return members.find((m) => m.userId === userId);
    },
    [members]
  );

  // Helper: Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Handle scroll events - Load more when scroll to top
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop } = target;

      // Load more when scroll near top
      if (
        scrollTop < 200 &&
        hasMore &&
        !isLoadingMore &&
        !loadMoreThrottleRef.current &&
        onLoadMore
      ) {
        loadMoreThrottleRef.current = true;
        onLoadMore();

        // Reset throttle after 1s
        setTimeout(() => {
          loadMoreThrottleRef.current = false;
        }, 1000);
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  // Auto scroll to bottom on conversation change
  useEffect(() => {
    if (
      selectedConversation?.id &&
      selectedConversation.id !== prevConversationIdRef.current
    ) {
      prevConversationIdRef.current = selectedConversation.id;
      // Delay để đảm bảo messages đã load
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [selectedConversation?.id, scrollToBottom]);

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      // Scroll to bottom khi có tin nhắn mới
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId === currentUserId) {
        // Tin nhắn của mình - scroll ngay lập tức
        setTimeout(() => {
          scrollToBottom("auto");
        }, 100);
      }
    }
  }, [messages.length, currentUserId, isLoadingMore, scrollToBottom]);

  // Empty state
  if (!selectedConversation) {
    return (
      <div className="chat-body chat-page-group">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100%" }}
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
      <div className="chat-body chat-page-group">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100%" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fix message bubble width and layout */}
      <style>{`
        .chat-body.chat-page-group .chats.chats-right .chat-content {
          max-width: 70%;
          width: fit-content;
        }
        
        .chat-body.chat-page-group .chats .chat-content {
          max-width: 70%;
        }
        
        .chat-body.chat-page-group .message-content {
          display: inline-block;
          max-width: 100%;
          word-wrap: break-word;
        }
        
        .chat-body.chat-page-group .chats-right .chat-info {
          display: flex;
          justify-content: flex-end;
        }
        
        .chat-body.chat-page-group .chats .chat-info {
          display: flex;
        }
      `}</style>

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <PinnedMessages
          pinnedMessages={pinnedMessages}
          onMessageClick={onPinnedMessageClick}
          onUnpin={onUnpin}
        />
      )}

      {/* Messages Body */}
      <OverlayScrollbarsComponent
        options={{
          scrollbars: {
            autoHide: "scroll",
            autoHideDelay: 1000,
          },
        }}
        style={{ maxHeight: "88vh" }}
      >
        <div
          className="chat-body chat-page-group"
          ref={chatBodyRef}
          onScroll={handleScroll}
        >
          {/* Load More Indicator */}
          {isLoadingMore && (
            <div className="text-center py-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <div className="text-center py-2">
              <button
                className="btn btn-sm btn-light"
                onClick={onLoadMore}
              >
                <i className="ti ti-arrow-up me-1" />
                Tải thêm tin nhắn
              </button>
            </div>
          )}

          {/* Messages List */}
          <div className="messages">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              const sender = getMemberByUserId(message.senderId);
              const senderAvatar = isOwn
                ? userAvatarUrl
                : sender?.avatarUrl || message.senderAvatarUrl;
              const senderName = isOwn
                ? userFullName || "Bạn"
                : sender?.displayName || message.senderName || "Unknown";

              return (
                <div
                  key={message.id}
                  className={isOwn ? "chats chats-right" : "chats"}
                >
                  {!isOwn && (
                    <div className="chat-avatar">
                      <Avatar
                        src={senderAvatar}
                        name={senderName}
                        className="rounded-circle"
                        size={40}
                      />
                    </div>
                  )}
                  <div className="chat-content">
                    <div
                      className="chat-profile-name"
                      style={{ textAlign: isOwn ? "right" : "left" }}
                    >
                      <h6>
                        {senderName}
                        <i className="ti ti-circle-filled fs-7 mx-2" />
                        <span className="chat-time">
                          {new Date(message.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {isOwn && (
                          <span className="msg-read success">
                            <i className="ti ti-checks" />
                          </span>
                        )}
                      </h6>
                    </div>
                    <div className="chat-info">
                      <div className="message-content">
                        {message.type === "TEXT" && <>{message.content}</>}
                        {message.type === "IMAGE" && message.attachment && (
                          <div className="chat-image">
                            <ImageWithBasePath
                              src={message.attachment.url}
                              alt="Hình ảnh"
                              className="img-fluid rounded"
                            />
                          </div>
                        )}
                        {message.type === "FILE" && message.attachment && (
                          <div className="file-attach">
                            <div className="d-flex align-items-center">
                              <span className="file-icon bg-primary text-white">
                                <i className="ti ti-file-text" />
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="mb-1 text-truncate">
                                  {message.attachment.fileName || message.content}
                                </h6>
                                <p className="text-muted mb-0 small">
                                  {(message.attachment.fileSize / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {message.type === "VOICE" && (
                          <div className="file-attach">
                            <div className="d-flex align-items-center">
                              <span className="file-icon bg-info text-white">
                                <i className="ti ti-microphone" />
                              </span>
                              <div className="ms-2 overflow-hidden">
                                <h6 className="mb-1 text-truncate">Tin nhắn thoại</h6>
                                <p className="text-muted mb-0 small">Audio</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="chat-actions">
                        <Link className="#" to="#" data-bs-toggle="dropdown">
                          <i className="ti ti-dots-vertical" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              className="dropdown-item"
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                onTogglePin(message.id, message.pinned);
                              }}
                            >
                              <i
                                className={`ti ${
                                  message.pinned ? "ti-pin-off" : "ti-pin"
                                } me-2`}
                              />
                              {message.pinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                            </Link>
                          </li>
                          {isOwn && (
                            <li>
                              <Link
                                className="dropdown-item text-danger"
                                to="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onDeleteMessage(message.id);
                                }}
                              >
                                <i className="ti ti-trash me-2" />
                                Xóa
                              </Link>
                            </li>
                          )}
                          {!isOwn && isAdmin && (
                            <li>
                              <Link
                                className="dropdown-item text-danger"
                                to="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onDeleteMessage(message.id);
                                }}
                              >
                                <i className="ti ti-trash me-2" />
                                Xóa (Admin)
                              </Link>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  {isOwn && (
                    <div className="chat-avatar">
                      <Avatar
                        src={userAvatarUrl}
                        name={userFullName || "Bạn"}
                        className="rounded-circle dreams_chat"
                        size={40}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="chats">
              <div className="chat-avatar">
                <div className="avatar avatar-sm">
                  <i className="ti ti-dots" />
                </div>
              </div>
              <div className="chat-content">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span>{typingUsers.join(", ")}</span> đang nhập...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </OverlayScrollbarsComponent>
    </>
  );
};

export default GroupChatBody;

