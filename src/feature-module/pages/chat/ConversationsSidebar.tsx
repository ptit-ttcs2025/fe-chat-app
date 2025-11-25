/**
 * ConversationsSidebar - Sidebar hiển thị danh sách conversations
 * Component này có thể tích hợp vào layout chat hiện tại
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { Tooltip } from 'antd';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

// Import hooks
import { useChatConversations, useUnreadCount } from '@/hooks/useChatConversations';
import type { IConversation } from '@/apis/chat/chat.type';

interface ConversationsSidebarProps {
  currentUserId: string;
  onConversationSelect: (conversationId: string) => void;
  selectedConversationId: string | null;
}

const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  currentUserId,
  onConversationSelect,
  selectedConversationId,
}) => {
  // ==================== STATE ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // ==================== HOOKS ====================
  
  // Conversations
  const {
    conversations,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    togglePin,
    toggleMute,
    deleteConversation,
  } = useChatConversations({
    pageSize: 20,
    autoRefresh: true,
    filter: searchTerm ? { searchTerm } : undefined,
  });

  // Total unread count
  const { unreadCount } = useUnreadCount();

  // ==================== HANDLERS ====================
  
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const toggleSearchBar = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (showSearch) {
      setSearchTerm('');
    }
  }, [showSearch]);

  const handleConversationClick = useCallback((conversationId: string) => {
    onConversationSelect(conversationId);
  }, [onConversationSelect]);

  const handleTogglePin = useCallback((e: React.MouseEvent, conversationId: string, isPinned: boolean) => {
    e.stopPropagation();
    togglePin(conversationId, !isPinned);
  }, [togglePin]);

  const handleToggleMute = useCallback((e: React.MouseEvent, conversationId: string, isMuted: boolean) => {
    e.stopPropagation();
    toggleMute(conversationId, !isMuted);
  }, [toggleMute]);

  const handleDeleteConversation = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      deleteConversation(conversationId);
    }
  }, [deleteConversation]);

  // ==================== RENDER HELPERS ====================
  
  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const truncateMessage = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getConversationAvatar = (conversation: IConversation) => {
    if (conversation.avatarUrl) {
      return conversation.avatarUrl;
    }

    // For group chats
    if (conversation.type === 'GROUP') {
      return 'assets/img/profiles/avatar-group.jpg';
    }

    // For private chats, get the other user's avatar
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.userAvatarUrl || 'assets/img/profiles/avatar-default.jpg';
  };

  const getConversationName = (conversation: IConversation) => {
    if (conversation.name) {
      return conversation.name;
    }

    // For private chats, get the other user's name
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.userName || 'Người dùng';
  };

  const isOnline = (conversation: IConversation) => {
    if (conversation.type === 'GROUP') return false;

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.isOnline || false;
  };

  const renderConversation = (conversation: IConversation) => {
    const isActive = conversation.id === selectedConversationId;

    return (
      <li
        key={conversation.id}
        className={`chat-user-list ${isActive ? 'active' : ''}`}
        onClick={() => handleConversationClick(conversation.id)}
        style={{ cursor: 'pointer' }}
      >
        <Link to="#" className="d-block">
          <div className="chat-block d-flex">
            <div className="chat-user-img me-2">
              <div className={`avatar avatar-lg ${isOnline(conversation) ? 'online' : ''}`}>
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
                    {conversation.isPinned && (
                      <i className="ti ti-pin-filled text-primary ms-1" />
                    )}
                  </h6>
                  <span className="chat-time">
                    {formatLastMessageTime(conversation.lastMessageAt)}
                  </span>
                </div>
              </div>

              <div className="chat-user-msg d-flex justify-content-between align-items-center">
                <div className="flex-fill pe-2">
                  <p className="mb-0">
                    {conversation.isMuted && (
                      <i className="ti ti-volume-off me-1" />
                    )}
                    {conversation.lastMessage
                      ? truncateMessage(conversation.lastMessage.content)
                      : 'Chưa có tin nhắn'}
                  </p>
                </div>

                <div className="d-flex align-items-center">
                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <span className="badge bg-primary rounded-pill me-1">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}

                  {/* Actions dropdown */}
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="text-muted"
                      data-bs-toggle="dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-2">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          onClick={(e) => handleTogglePin(e, conversation.id, conversation.isPinned)}
                        >
                          <i className={`ti ti-pin${conversation.isPinned ? '-off' : ''} me-2`} />
                          {conversation.isPinned ? 'Bỏ ghim' : 'Ghim'}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item"
                          onClick={(e) => handleToggleMute(e, conversation.id, conversation.isMuted)}
                        >
                          <i className={`ti ti-volume${conversation.isMuted ? '' : '-off'} me-2`} />
                          {conversation.isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item text-danger"
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        >
                          <i className="ti ti-trash me-2" />
                          Xóa
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </li>
    );
  };

  // ==================== RENDER ====================
  
  // Sort: Pinned first, then by last message time
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="sidebar-group left-sidebar chat_sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="chat-user-details">
          <div className="d-flex align-items-center">
            <h5>Trò chuyện</h5>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill ms-2">
                {unreadCount}
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
                <Link to="#" onClick={() => refresh()}>
                  <i className="ti ti-refresh" />
                </Link>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Cuộc trò chuyện mới" placement="bottom">
                <Link to="#" data-bs-toggle="modal" data-bs-target="#new-chat">
                  <i className="ti ti-plus" />
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
              value={searchTerm}
              onChange={handleSearch}
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
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            )}

            {/* Conversations List */}
            {!isLoading && sortedConversations.length > 0 && (
              <ul className="user-list">
                {sortedConversations.map(renderConversation)}
              </ul>
            )}

            {/* Empty State */}
            {!isLoading && conversations.length === 0 && (
              <div className="text-center py-5">
                <i className="ti ti-message-off" style={{ fontSize: '48px' }} />
                <h6 className="mt-3">Chưa có cuộc trò chuyện</h6>
                <p className="text-muted">
                  {searchTerm
                    ? 'Không tìm thấy kết quả'
                    : 'Bắt đầu cuộc trò chuyện mới'}
                </p>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-3">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => loadMore()}
                >
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

export default ConversationsSidebar;

