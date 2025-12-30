/**
 * ContactTab - Optimized Friend List Sidebar
 */

import ImageWithBasePath from '../imageWithBasePath'
import { Link } from 'react-router-dom'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { useState, useMemo, useEffect, useCallback, memo, useContext } from 'react';
import { useSearchFriends, useGetRequestCount } from '@/apis/friend/friend.api';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import { NotificationContext } from '@/contexts/NotificationContext';
import { useSelectedFriend } from '@/contexts/SelectedFriendContext';
import { useUserStatus } from '@/hooks/useWebSocketChat';
import type { IFriend } from '@/apis/friend/friend.type';
import type { UserStatus } from '@/apis/chat/chat.type';
import { useFriendNicknameWebSocket } from '@/hooks/useFriendNicknameWebSocket';

// ========== MEMOIZED FRIEND ITEM COMPONENT ==========
interface FriendItemProps {
  friend: IFriend & { wsOnline?: boolean };
  onFriendClick: (friendId: string) => void;
}

const FriendItem = memo(({ friend, onFriendClick }: FriendItemProps) => {
  // Use WebSocket online status nếu có, fallback về friend.isOnline từ API
  const isOnline = friend.wsOnline ?? friend.isOnline;

  return (
    <div className="chat-list" style={{ marginBottom: '8px' }}>
      <Link
        to="#"
        data-bs-toggle="modal"
        data-bs-target="#contact-details"
        className="chat-user-list"
        onClick={(e) => {
          e.preventDefault();
          onFriendClick(friend.friendId);
        }}
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Avatar with online/offline badge */}
        <div className={`avatar avatar-lg ${isOnline ? 'online' : 'offline'} me-3`}>
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
                width: '48px',
                height: '48px',
                backgroundColor: getAvatarColor(friend.displayName),
                fontSize: '18px'
              }}
            >
              {getInitial(friend.displayName)}
            </div>
          )}
        </div>

        {/* Name + Status text (vertical layout) */}
        <div className="chat-user-info flex-grow-1">
          <div>
            <h6 className="mb-1" style={{ fontSize: '15px', fontWeight: '500' }}>
              {friend.displayName}
            </h6>
            <p className="mb-0" style={{ fontSize: '13px' }}>
              {isOnline ? (
                <span className="text-success">
                  <i className="ti ti-circle-filled" style={{ fontSize: '8px', marginRight: '4px' }} />
                  Đang hoạt động
                </span>
              ) : (
                <span className="text-muted">Offline</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison cho memo(): chỉ re-render khi cần thiết
  return (
    prevProps.friend.friendId === nextProps.friend.friendId &&
    prevProps.friend.displayName === nextProps.friend.displayName &&
    prevProps.friend.avatarUrl === nextProps.friend.avatarUrl &&
    prevProps.friend.wsOnline === nextProps.friend.wsOnline
  );
});

FriendItem.displayName = 'FriendItem';

// ========== MAIN CONTACT TAB COMPONENT ==========
const ContactTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // ✅ WebSocket real-time online status tracking
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  // Selected friend context
  const { setSelectedFriendId } = useSelectedFriend();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get friends data
  const { data: friends, isLoading, refetch } = useSearchFriends(
    { q: debouncedQuery },
    true
  );

  // Get request count
  const { data: requestCount } = useGetRequestCount();
  
  // Get notification count - safely handle if NotificationProvider is not available
  const notificationContext = useContext(NotificationContext);
  const notificationCount = notificationContext?.unreadCount || 0;

  // ✅ Subscribe to WebSocket user status updates
  useUserStatus(
    useCallback((status: UserStatus) => {
      console.log('📡 User status update:', status);
      setOnlineStatus((prev) => ({
        ...prev,
        [status.userId]: status.isOnline,
      }));
    }, []),
    true // enabled
  );

  // ✨ NEW: Subscribe to friend nickname updates
  useFriendNicknameWebSocket(true);

  // ✅ Enrich friends data với WebSocket online status
  const enrichedFriends = useMemo(() => {
    if (!friends) return [];

    return friends.map((friend) => ({
      ...friend,
      wsOnline: onlineStatus[friend.friendId],
    }));
  }, [friends, onlineStatus]);

  // Group friends by first letter
  const groupedFriends = useMemo(() => {
    if (!enrichedFriends) return {};

    const grouped: Record<string, typeof enrichedFriends> = {};
    enrichedFriends.forEach(friend => {
      const firstLetter = friend.displayName.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(friend);
    });

    return grouped;
  }, [enrichedFriends]);

  const groupedLetters = Object.keys(groupedFriends).sort();

  // Handle click on friend
  const handleFriendClick = useCallback((friendId: string) => {
    setSelectedFriendId(friendId);
  }, [setSelectedFriendId]);

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
            {/* Header */}
            <div className="chat-search-header">
              <div className="header-title d-flex align-items-center justify-content-between">
                <h4 className="mb-3">Bạn bè</h4>
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
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '10px' }}
                      >
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
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '10px' }}
                      >
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

              {/* Search */}
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
            </div>

            {/* Body */}
            <div className="sidebar-body chat-body">
              {/* Title */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>{searchQuery ? `Kết quả tìm kiếm` : 'Tất cả bạn bè'}</h5>
                <div className="d-flex align-items-center gap-2">
                  {enrichedFriends && (
                    <span className="badge bg-primary">{enrichedFriends.length}</span>
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

              {/* Loading */}
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

              {/* Empty */}
              {!isLoading && (!enrichedFriends || enrichedFriends.length === 0) && (
                <div className="text-center py-5">
                  <i className="ti ti-users-off" style={{ fontSize: '60px', color: '#dee2e6' }}></i>
                  <p className="text-muted mt-3">Chưa có bạn bè nào</p>
                  <p className="small text-muted">Hãy thêm bạn bè mới!</p>
                </div>
              )}

              {/* No results */}
              {!isLoading && enrichedFriends && enrichedFriends.length > 0 && groupedLetters.length === 0 && (
                <div className="text-center py-4">
                  <i className="ti ti-search-off" style={{ fontSize: '50px', color: '#dee2e6' }}></i>
                  <p className="text-muted mt-2">Không tìm thấy "{searchQuery}"</p>
                </div>
              )}

              {/* Friends List */}
              <div className="chat-users-wrap">
                {groupedLetters.map((letter) => (
                  <div className="mb-4" key={letter}>
                    <h6 className="mb-3" style={{ fontSize: '14px', fontWeight: '600', color: '#6c757d' }}>
                      {letter}
                    </h6>
                    {groupedFriends[letter].map((friend) => (
                      <FriendItem
                        key={friend.userId}
                        friend={friend}
                        onFriendClick={handleFriendClick}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </>
  );
};

export default ContactTab;
