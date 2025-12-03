/**
 * ChatRoomExample - Component demo tích hợp Chat API
 * Sử dụng file này làm reference để tích hợp vào chat.tsx hiện tại
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Tooltip } from 'antd';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

// Import custom hooks
import { useChatMessages, useTypingUsers, useReadReceipts } from '@/hooks/useChatMessages';
import { useTypingStatus, useReadReceipts as useReadReceiptsWS, useChatActions } from '@/hooks/useWebSocketChat';
import { useChatConversations } from '@/hooks/useChatConversations';

// Import types
import type { IMessage, MessageType } from '@/apis/chat/chat.type';

interface ChatRoomExampleProps {
  // Props bạn có thể truyền vào
  initialConversationId?: string;
  currentUserId: string;
  currentUserName: string;
}

const ChatRoomExample: React.FC<ChatRoomExampleProps> = ({
  initialConversationId,
  currentUserId,
  currentUserName,
}) => {
  // ==================== STATE ====================
  const [inputMessage, setInputMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState<Record<string, boolean>>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId || null
  );

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // ==================== HOOKS ====================
  
  // Conversations management
  const {
    conversations,
    isLoading: isLoadingConversations,
    selectConversation,
    selectedConversation,
  } = useChatConversations({
    pageSize: 20,
    autoRefresh: true,
  });

  // Messages management
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage,
    markAsRead,
    deleteMessage,
    togglePin,
    scrollToBottom,
    messagesEndRef,
  } = useChatMessages({
    conversationId: selectedConversationId,
    pageSize: 20,
    autoMarkAsRead: true,
    currentUserId,
  });

  // Typing users management
  const { typingUsers, handleTypingStatus } = useTypingUsers(currentUserId);

  // Read receipts management
  const { handleReadReceipt } = useReadReceipts();

  // WebSocket subscriptions
  useTypingStatus(selectedConversationId, handleTypingStatus, !!selectedConversationId);
  useReadReceiptsWS(selectedConversationId, handleReadReceipt, !!selectedConversationId);

  // Chat actions
  const { sendTypingStatus } = useChatActions();

  // ==================== EFFECTS ====================
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      inputRef.current?.focus();
    }
  }, [selectedConversationId]);

  // ==================== HANDLERS ====================
  
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    selectConversation(conversationId);
  }, [selectConversation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (selectedConversationId && e.target.value.length > 0) {
      sendTypingStatus(selectedConversationId, true, currentUserName);
    }
  }, [selectedConversationId, currentUserName, sendTypingStatus]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !selectedConversationId) return;

    // Send message
    sendMessage(inputMessage.trim(), 'TEXT');

    // Clear input
    setInputMessage('');

    // Stop typing indicator
    sendTypingStatus(selectedConversationId, false, currentUserName);

    // Focus input
    inputRef.current?.focus();
  }, [inputMessage, selectedConversationId, sendMessage, sendTypingStatus, currentUserName]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const toggleEmoji = useCallback((messageId: string) => {
    setShowEmoji((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      deleteMessage(messageId);
    }
  }, [deleteMessage]);

  const handleTogglePin = useCallback((messageId: string, currentlyPinned: boolean) => {
    togglePin(messageId, !currentlyPinned);
  }, [togglePin]);

  // ==================== RENDER HELPERS ====================
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageStatusIcon = (message: IMessage) => {
    if (message.readCount > 0) {
      return <i className="ti ti-checks text-primary" />;
    }
    return <i className="ti ti-check" />;
  };

  const renderMessage = (message: IMessage) => {
    const isOwnMessage = message.senderId === currentUserId;

    return (
      <div
        key={message.id}
        className={`chats ${isOwnMessage ? 'chats-right' : ''}`}
      >
        {!isOwnMessage && (
          <div className="chat-avatar">
            <ImageWithBasePath
              src={message.senderAvatarUrl || 'assets/img/profiles/avatar-default.jpg'}
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
              <span className="chat-time">{formatMessageTime(message.createdAt)}</span>
              {isOwnMessage && (
                <span className="msg-read success">
                  {getMessageStatusIcon(message)}
                </span>
              )}
              {message.pinned && (
                <span className="badge bg-info ms-2">
                  <i className="ti ti-pin" /> Đã ghim
                </span>
              )}
            </h6>
          </div>

          <div className="chat-info">
            <div className="message-content">
              {message.content}

              {/* Message actions */}
              <div className="emoj-group">
                <ul>
                  <li className="emoj-action">
                    <Link to="#" onClick={() => toggleEmoji(message.id)}>
                      <i className="ti ti-mood-smile" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      onClick={() => handleTogglePin(message.id, message.pinned)}
                    >
                      <i className={`ti ti-pin${message.pinned ? '-filled' : ''}`} />
                    </Link>
                  </li>
                  {isOwnMessage && (
                    <li>
                      <Link
                        to="#"
                        onClick={() => handleDeleteMessage(message.id)}
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
              src={message.senderAvatarUrl || 'assets/img/profiles/avatar-default.jpg'}
              className="rounded-circle"
              alt="You"
            />
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================
  
  if (!selectedConversationId) {
    return (
      <div className="chat chat-messages">
        <div className="empty-state text-center py-5">
          <i className="ti ti-message-circle" style={{ fontSize: '48px' }} />
          <h4 className="mt-3">Chọn một cuộc trò chuyện</h4>
          <p className="text-muted">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat chat-messages show" id="middle">
      <div>
        {/* Chat Header */}
        <div className="chat-header">
          <div className="user-details">
            <div className="d-xl-none">
              <Link className="text-muted chat-close me-2" to="#">
                <i className="fas fa-arrow-left" />
              </Link>
            </div>
            <div className="avatar avatar-lg online flex-shrink-0">
              <ImageWithBasePath
                src={selectedConversation?.avatarUrl || 'assets/img/profiles/avatar-default.jpg'}
                className="rounded-circle"
                alt={selectedConversation?.name || 'Chat'}
              />
            </div>
            <div className="ms-2 overflow-hidden">
              <h6>{selectedConversation?.name || 'Cuộc trò chuyện'}</h6>
              <span className="last-seen">
                {selectedConversation?.participants?.length || 0} thành viên
              </span>
            </div>
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
                  <Link to="#" className="btn">
                    <i className="ti ti-video" />
                  </Link>
                </Tooltip>
              </li>
              <li>
                <Tooltip title="Voice Call" placement="bottom">
                  <Link to="#" className="btn">
                    <i className="ti ti-phone" />
                  </Link>
                </Tooltip>
              </li>
              <li>
                <Tooltip title="Thông tin" placement="bottom">
                  <Link to="#" className="btn">
                    <i className="ti ti-info-circle" />
                  </Link>
                </Tooltip>
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
                />
                <span className="input-group-text">
                  <i className="ti ti-search" />
                </span>
              </div>
            </form>
          </div>
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
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {!isLoadingMessages && messages.map(renderMessage)}

              {/* Empty State */}
              {!isLoadingMessages && messages.length === 0 && (
                <div className="text-center py-5">
                  <i className="ti ti-message-off" style={{ fontSize: '48px' }} />
                  <p className="text-muted mt-3">Chưa có tin nhắn nào</p>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator px-3 py-2">
                <span className="text-muted">
                  {typingUsers.join(', ')} đang nhập...
                </span>
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>

        {/* Chat Footer */}
        <div className="chat-footer">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <div className="smile-foot">
              <div className="chat-action-btns">
                <div className="chat-action-col">
                  <Link className="action-circle" to="#" data-bs-toggle="dropdown">
                    <i className="ti ti-dots-vertical" />
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end p-3">
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-file me-2" />
                      Tệp
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-photo me-2" />
                      Ảnh
                    </Link>
                    <Link to="#" className="dropdown-item">
                      <i className="ti ti-microphone me-2" />
                      Ghi âm
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="smile-foot emoj-action-foot">
              <Link to="#" className="action-circle">
                <i className="ti ti-mood-smile" />
              </Link>
            </div>

            <input
              ref={inputRef}
              type="text"
              className="form-control chat_form"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />

            <div className="form-buttons">
              <button
                type="submit"
                className="btn send-btn"
                disabled={!inputMessage.trim() || isSending}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomExample;

