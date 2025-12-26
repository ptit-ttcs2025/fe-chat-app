import ImageWithBasePath from '../imageWithBasePath'
import { Link } from 'react-router-dom'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { useState, useMemo, useEffect } from 'react';
import { useSearchFriends, useGetRequestCount } from '@/apis/friend/friend.api';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSelectedFriend } from '@/contexts/SelectedFriendContext';
import { useTotalUnreadCount, useUnreadSummary } from '@/hooks/useUnreadMessages';
import { useChatConversations } from '@/hooks/useChatConversations';
import type { IConversation } from '@/apis/chat/chat.type';
import type { UnreadConversation } from '@/types/unread';

const ContactTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Selected friend context
  const { setSelectedFriendId } = useSelectedFriend();
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Chỉ dùng searchFriends cho cả get all (q rỗng) và search
  const { data: friends, isLoading, refetch } = useSearchFriends(
    { q: debouncedQuery },
    true // Luôn enabled để gọi ngay khi mount
  );

  // Get conversations để lấy ID và match với friend
  const { conversations } = useChatConversations({
    pageSize: 100,
    autoRefresh: true,
  });

  // Get unread summary để lấy lastMessagePreview
  const { data: unreadSummary } = useUnreadSummary();

  // Get request count
  const { data: requestCount } = useGetRequestCount();
  
  // Get notification count
  const { unreadCount: notificationCount } = useNotifications();

  // Tổng số tin nhắn chưa đọc (để user luôn thấy dù đang ở tab Bạn bè)
  const { data: totalUnreadCount } = useTotalUnreadCount();

  // Map friendId -> {conversation, unreadInfo} để lấy đầy đủ thông tin
  const friendDataMap = useMemo(() => {
    const map: Record<string, {
      conversation: IConversation;
      unreadInfo?: UnreadConversation;
    }> = {};
    
    if (conversations && friends) {
      // First: Map conversations với friends
      conversations.forEach((conv) => {
        // Chỉ xét PRIVATE/ONE_TO_ONE conversations (backend có thể trả cả 2 type)
        if (conv.type === 'PRIVATE' || (conv as any).type === 'ONE_TO_ONE') {
          const friend = friends.find((f) => {
            // Match bằng tên (vì backend trả conv.name = tên của friend)
            return conv.name === f.displayName;
          });
          
          if (friend) {
            map[friend.friendId] = {
              conversation: conv,
            };
          }
        }
      });

      // Second: Enrich với unread info (có lastMessagePreview)
      if (unreadSummary?.unreadConversations) {
        unreadSummary.unreadConversations.forEach((unreadConv) => {
          // Tìm friend có conversation này
          const friend = friends.find((f) => {
            const friendData = map[f.friendId];
            return friendData?.conversation.id === unreadConv.conversationId;
          });

          if (friend && map[friend.friendId]) {
            map[friend.friendId].unreadInfo = unreadConv;
          }
        });
      }
    }
    
    return map;
  }, [conversations, friends, unreadSummary]);

  // Group friends by first letter
  const groupedFriends = useMemo(() => {
    if (!friends) return {};

    const grouped: Record<string, typeof friends> = {};
    friends.forEach(friend => {
      const firstLetter = friend.displayName.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(friend);
    });

    return grouped;
  }, [friends]);

  const groupedLetters = Object.keys(groupedFriends).sort();

  // Get last message preview for a friend
  const getLastMessagePreview = (friendId: string) => {
    const data = friendDataMap[friendId];
    
    // Ưu tiên lấy từ unreadInfo (có preview đầy đủ)
    if (data?.unreadInfo?.lastMessagePreview) {
      let preview = data.unreadInfo.lastMessagePreview;
      if (preview.length > 35) {
        preview = preview.substring(0, 35) + '...';
      }
      return preview;
    }
    
    // Fallback: Dùng lastMessageTimestamp từ conversation (không có content)
    if (data?.conversation?.lastMessageTimestamp) {
      return 'Có tin nhắn mới';
    }
    
    return 'Chưa có tin nhắn';
  };

  // Format last message time
  const formatLastMessageTime = (friendId: string) => {
    const data = friendDataMap[friendId];
    
    // Ưu tiên từ unreadInfo
    const timestamp = data?.unreadInfo?.lastMessageTimestamp || data?.conversation?.lastMessageTimestamp;
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMins}m`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Handle click on friend to open contact details modal
  const handleFriendClick = (friendId: string) => {
    // Always open modal to show friend details
    // User can click "Message" icon inside modal to start chat
    setSelectedFriendId(friendId);
  };

  return (
    <>
        {/* Chats sidebar */}
        <div className="sidebar-content active slimscroll">
        <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'scroll',
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: '100vh' }}
          >
          <div className="slimscroll">
            <div className="chat-search-header">
              <div className="header-title d-flex align-items-center justify-content-between">
                <h4 className="mb-3 d-flex align-items-center gap-2">
                  <span>Bạn bè</span>
                  {(totalUnreadCount ?? 0) > 0 && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        background:
                          'linear-gradient(135deg, #6338F6 0%, #764ba2 100%)',
                        fontSize: '11px',
                      }}
                    >
                      {totalUnreadCount! > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </h4>
                <div className="d-flex align-items-center mb-3">
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#notifications-modal"
                    className="add-icon btn btn-info p-0 d-flex align-items-center justify-content-center fs-16 me-2 position-relative"
                    title="Thông báo"
                  >
                    <i className="ti ti-bell" />
                    {notificationCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                            style={{ fontSize: '10px' }}>
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#friend-requests"
                    className="add-icon btn btn-warning p-0 d-flex align-items-center justify-content-center fs-16 me-2 position-relative"
                    title="Lời mời kết bạn"
                  >
                    <i className="ti ti-user-check" />
                    {requestCount !== undefined && requestCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                            style={{ fontSize: '10px' }}>
                        {requestCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#add-contact"
                    className="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16"
                    title="Thêm bạn bè"
                  >
                    <i className="ti ti-plus" />
                  </Link>
                </div>
              </div>
              {/* Chat Search */}
              <div className="search-wrap">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm bạn bè"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="input-group-text">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </form>
              </div>
              {/* /Chat Search */}
            </div>
            <div className="sidebar-body chat-body">
              {/* Left Chat Title */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  {searchQuery ? `Kết quả tìm kiếm` : 'Tất cả bạn bè'}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {friends && (
                    <span className="badge bg-primary">{friends.length}</span>
                  )}
                  <button 
                    className="btn btn-sm btn-light" 
                    onClick={() => refetch()}
                    title="Làm mới"
                  >
                    <i className="ti ti-refresh"></i>
                  </button>
                </div>
              </div>
              {/* /Left Chat Title */}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="text-muted mt-2">
                    {searchQuery ? 'Đang tìm kiếm...' : 'Đang tải danh bạ...'}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && (!friends || friends.length === 0) && (
                <div className="text-center py-5">
                  <i className="ti ti-users-off" style={{ fontSize: '60px', color: '#dee2e6' }}></i>
                  <p className="text-muted mt-3">Chưa có bạn bè nào</p>
                  <p className="small text-muted">Hãy thêm bạn bè mới!</p>
                </div>
              )}

              {/* No Search Results */}
              {!isLoading && friends && friends.length > 0 && groupedLetters.length === 0 && (
                <div className="text-center py-4">
                  <i className="ti ti-search-off" style={{ fontSize: '50px', color: '#dee2e6' }}></i>
                  <p className="text-muted mt-2">Không tìm thấy "{searchQuery}"</p>
                </div>
              )}

              {/* Friends List */}
              <div className="chat-users-wrap">
                {groupedLetters.map((letter) => (
                  <div className="mb-4" key={letter}>
                    <h6 className="mb-2">{letter}</h6>
                    {groupedFriends[letter].map((friend) => {
                      const data = friendDataMap[friend.friendId];
                      const lastMessagePreview = getLastMessagePreview(friend.friendId);
                      const lastMessageTime = formatLastMessageTime(friend.friendId);
                      const unreadCount = data?.unreadInfo?.unreadCount || data?.conversation?.unreadCount || 0;
                      
                      return (
                        <div className="chat-list" key={friend.userId}>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#contact-details"
                            className="chat-user-list"
                            onClick={() => handleFriendClick(friend.friendId)}
                          >
                            <div className={`avatar avatar-lg ${friend.isOnline ? 'online' : 'offline'} me-2`}>
                              {isValidUrl(friend.avatarUrl) && friend.avatarUrl ? (
                                <ImageWithBasePath
                                  src={friend.avatarUrl}
                                  className="rounded-circle"
                                  alt={friend.displayName}
                                />
                              ) : (
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: getAvatarColor(friend.displayName),
                                    fontSize: '18px'
                                  }}
                                >
                                  {getInitial(friend.displayName)}
                                </div>
                              )}
                            </div>
                            <div className="chat-user-info">
                              <div className="chat-user-msg">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0">{friend.displayName}</h6>
                                  {lastMessageTime && (
                                    <span className="text-muted" style={{ fontSize: '11px' }}>
                                      {lastMessageTime}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <p className={`small mb-0 ${unreadCount > 0 ? 'fw-semibold text-dark' : 'text-muted'}`}>
                                    {lastMessagePreview}
                                  </p>
                                  {unreadCount > 0 && (
                                    <span 
                                      className="badge rounded-pill"
                                      style={{
                                        background: 'linear-gradient(135deg, #6338F6 0%, #764ba2 100%)',
                                        fontSize: '10px',
                                        minWidth: '18px',
                                      }}
                                    >
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </OverlayScrollbarsComponent>
        </div>
        {/* / Chats sidebar */}
    </>
  )
}

export default ContactTab