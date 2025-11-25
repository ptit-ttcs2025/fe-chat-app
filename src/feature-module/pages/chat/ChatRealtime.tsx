/**
 * ChatRealtime - Page chat realtime hoàn chỉnh
 * Tích hợp đầy đủ REST API + WebSocket theo API_DOCUMENTATION.md
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tooltip } from 'antd';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { all_routes } from '../../router/all_routes';

// Import APIs
import { chatApi } from '@/apis/chat/chat.api';
import type { IConversation, IMessage } from '@/apis/chat/chat.type';

// Import WebSocket hooks
import { useChatMessages, useTypingUsers } from '@/hooks/useChatMessages';
import { useTypingStatus, useChatActions } from '@/hooks/useWebSocketChat';

// Import modals
import ContactInfo from '../../../core/modals/contact-info-off-canva';
import ContactFavourite from '../../../core/modals/contact-favourite-canva';
import ForwardMessage from '../../../core/modals/forward-message';
import MessageDelete from '../../../core/modals/message-delete';

interface RootState {
  auth: {
    user: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
      email: string;
    } | null;
  };
}

const ChatRealtime: React.FC = () => {
  // ==================== STATE ====================
  const user = useSelector((state: RootState) => state.auth.user);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ==================== HOOKS ====================
  
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
  const { typingUsers, handleTypingStatus } = useTypingUsers(user?.id || '');

  // WebSocket subscriptions
  useTypingStatus(
    selectedConversation?.id || null,
    handleTypingStatus,
    !!selectedConversation
  );

  // Chat actions (WebSocket)
  const { sendTypingStatus } = useChatActions();

  // ==================== EFFECTS ====================
  
  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation?.id]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // ==================== HANDLERS ====================
  
  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await chatApi.getConversations(0, 20);
      console.log('📋 Loaded conversations:', response);
      
      if (response.data?.results) {
        setConversations(response.data.results);
        
        // Auto select first conversation
        if (response.data.results.length > 0 && !selectedConversation) {
          setSelectedConversation(response.data.results[0]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading conversations:', error);
      alert('Lỗi tải danh sách trò chuyện: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleConversationSelect = useCallback((conversation: IConversation) => {
    setSelectedConversation(conversation);
    setSearchKeyword('');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Send typing indicator
    if (selectedConversation && value.length > 0) {
      sendTypingStatus(selectedConversation.id, true, user?.fullName || 'User');
    }
  }, [selectedConversation, sendTypingStatus, user]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !selectedConversation || isSending) return;

    console.log('📤 Sending message:', inputMessage);

    try {
      await sendMessageHook(inputMessage.trim(), 'TEXT');
      setInputMessage('');
      
      // Stop typing indicator
      sendTypingStatus(selectedConversation.id, false, user?.fullName || 'User');
      
      // Focus input
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      alert('Lỗi gửi tin nhắn: ' + (error.response?.data?.message || error.message));
    }
  }, [inputMessage, selectedConversation, isSending, sendMessageHook, sendTypingStatus, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleSearchBar = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (!showSearch) {
      setSearchKeyword('');
    }
  }, [showSearch]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      deleteMessage(messageId);
    }
  }, [deleteMessage]);

  const handleTogglePin = useCallback((messageId: string, currentlyPinned: boolean) => {
    togglePin(messageId, !currentlyPinned);
  }, [togglePin]);

  // ==================== RENDER HELPERS ====================
  
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getConversationName = (conversation: IConversation) => {
    return conversation.name || 'Cuộc trò chuyện';
  };

  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl || 'assets/img/profiles/avatar-default.jpg';
  };

  const renderMessage = (message: IMessage) => {
    const isOwnMessage = message.senderId === user?.id;

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
              <span className="chat-time">{formatTime(message.createdAt)}</span>
              {isOwnMessage && message.readCount > 0 && (
                <span className="msg-read success ms-1">
                  <i className="ti ti-checks" />
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
                  <li>
                    <Link
                      to="#"
                      onClick={() => handleTogglePin(message.id, message.pinned)}
                      title={message.pinned ? 'Bỏ ghim' : 'Ghim'}
                    >
                      <i className={`ti ti-pin${message.pinned ? '-filled' : ''}`} />
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
              src={user?.avatarUrl || 'assets/img/profiles/avatar-default.jpg'}
              className="rounded-circle"
              alt="You"
            />
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================
  
  if (!user) {
    return (
      <div className="content main_content">
        <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <i className="ti ti-user-off" style={{ fontSize: '64px' }} />
            <h4 className="mt-3">Bạn chưa đăng nhập</h4>
            <p className="text-muted">Vui lòng đăng nhập để sử dụng chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content main_content">
        <div className="sidebar-group">
          {/* Left Sidebar - Conversations List */}
          <div className="sidebar-group left-sidebar chat_sidebar">
            {/* Sidebar Header */}
            <div className="sidebar-header">
              <div className="chat-user-details">
                <div className="d-flex align-items-center">
                  <h5>Trò chuyện</h5>
                  {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                    <span className="badge bg-danger rounded-pill ms-2">
                      {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="chat-options">
                <ul>
                  <li>
                    <Tooltip title="Tìm kiếm" placement="bottom">
                      <Link to="#" onClick={toggleSearchBar}>
                        <i className="ti ti-search" />
                      </Link>
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip title="Làm mới" placement="bottom">
                      <Link to="#" onClick={loadConversations}>
                        <i className="ti ti-refresh" />
                      </Link>
                    </Tooltip>
                  </li>
                </ul>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="sidebar-search p-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <span className="input-group-text">
                    <i className="ti ti-search" />
                  </span>
                </div>
              </div>
            )}

            {/* Conversations List */}
            <div className="sidebar-body">
              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    autoHide: 'scroll',
                    autoHideDelay: 1000,
                  },
                }}
                style={{ height: 'calc(100vh - 140px)' }}
              >
                <div className="chat-users-wrap">
                  {isLoadingConversations && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  )}

                  {!isLoadingConversations && conversations.length > 0 && (
                    <ul className="user-list">
                      {conversations
                        .filter((conv) =>
                          !searchKeyword ||
                          getConversationName(conv)
                            .toLowerCase()
                            .includes(searchKeyword.toLowerCase())
                        )
                        .map((conversation) => (
                          <li
                            key={conversation.id}
                            className={`chat-user-list ${
                              selectedConversation?.id === conversation.id ? 'active' : ''
                            }`}
                            onClick={() => handleConversationSelect(conversation)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Link to="#" className="d-block">
                              <div className="chat-block d-flex">
                                <div className="chat-user-img me-2">
                                  <div className="avatar avatar-lg">
                                    <ImageWithBasePath
                                      src={getConversationAvatar(conversation)}
                                      className="rounded-circle"
                                      alt={getConversationName(conversation)}
                                    />
                                  </div>
                                </div>

                                <div className="chat-user-info flex-fill">
                                  <div className="chat-user-name">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <h6 className="mb-0">
                                        {getConversationName(conversation)}
                                        {conversation.pinned && (
                                          <i className="ti ti-pin-filled text-primary ms-1" />
                                        )}
                                      </h6>
                                      <span className="chat-time">
                                        {formatLastMessageTime(conversation.lastMessageTimestamp)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="chat-user-msg d-flex justify-content-between align-items-center">
                                    <div className="flex-fill pe-2">
                                      <p className="mb-0">
                                        {conversation.muted && (
                                          <i className="ti ti-volume-off me-1" />
                                        )}
                                        Nhấn để xem tin nhắn
                                      </p>
                                    </div>

                                    {conversation.unreadCount > 0 && (
                                      <span className="badge bg-primary rounded-pill">
                                        {conversation.unreadCount > 99
                                          ? '99+'
                                          : conversation.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}

                  {!isLoadingConversations && conversations.length === 0 && (
                    <div className="text-center py-5">
                      <i className="ti ti-message-off" style={{ fontSize: '48px' }} />
                      <h6 className="mt-3">Chưa có cuộc trò chuyện</h6>
                      <p className="text-muted">
                        Bắt đầu cuộc trò chuyện mới từ danh sách bạn bè
                      </p>
                    </div>
                  )}
                </div>
              </OverlayScrollbarsComponent>
            </div>
          </div>

          {/* Middle - Chat Room */}
          {selectedConversation ? (
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
                    <div className="avatar avatar-lg flex-shrink-0">
                      <ImageWithBasePath
                        src={getConversationAvatar(selectedConversation)}
                        className="rounded-circle"
                        alt={getConversationName(selectedConversation)}
                      />
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <h6>{getConversationName(selectedConversation)}</h6>
                      <span className="last-seen">
                        {typingUsers.length > 0
                          ? `${typingUsers.join(', ')} đang nhập...`
                          : 'Online'}
                      </span>
                    </div>
                  </div>

                  <div className="chat-options">
                    <ul>
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
                        </ul>
                      </li>
                    </ul>
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
                      {isLoadingMessages && (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                          </div>
                        </div>
                      )}

                      {!isLoadingMessages && messages.length > 0 && messages.map(renderMessage)}

                      {!isLoadingMessages && messages.length === 0 && (
                        <div className="text-center py-5">
                          <i className="ti ti-message-off" style={{ fontSize: '48px' }} />
                          <p className="text-muted mt-3">Chưa có tin nhắn nào</p>
                          <p className="text-muted">Hãy bắt đầu cuộc trò chuyện!</p>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </OverlayScrollbarsComponent>

                {/* Chat Footer */}
                <div className="chat-footer">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                    <div className="smile-foot">
                      <div className="chat-action-btns">
                        <div className="chat-action-col">
                          <Link className="action-circle" to="#">
                            <i className="ti ti-mood-smile" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control chat_form"
                      placeholder="Nhập tin nhắn..."
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      disabled={isSending || isLoadingMessages}
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
          ) : (
            <div className="chat chat-messages">
              <div className="empty-state text-center py-5">
                <i className="ti ti-message-circle" style={{ fontSize: '64px' }} />
                <h4 className="mt-3">Chọn một cuộc trò chuyện</h4>
                <p className="text-muted">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ContactInfo />
      <ContactFavourite />
      <ForwardMessage />
      <MessageDelete />
    </>
  );
};

export default ChatRealtime;

