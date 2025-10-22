
import ImageWithBasePath from '../imageWithBasePath'
import { Link } from 'react-router-dom'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { useState, useMemo, useEffect } from 'react';
import { useGetFriends, useSearchFriends, useGetRequestCount } from '@/apis/friend/friend.api';

const ContactTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch friends và search friends
  const { data: allFriends, isLoading: loadingAll } = useGetFriends();
  const { data: searchedFriends, isLoading: loadingSearch } = useSearchFriends(
    { q: debouncedQuery },
    debouncedQuery.length > 0
  );

  // Get request count
  const { data: requestCount } = useGetRequestCount();

  // Determine which data to use
  const friends = debouncedQuery.length > 0 ? searchedFriends : allFriends;
  const isLoading = debouncedQuery.length > 0 ? loadingSearch : loadingAll;

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Check if avatar URL is valid
  const isValidUrl = (url?: string | null) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

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
                <h4 className="mb-3">Contacts</h4>
                <div className="d-flex align-items-center mb-3">
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
                      placeholder="Search Contacts"
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
                <h5>All Contacts</h5>
                {friends && (
                  <span className="badge bg-primary">{friends.length}</span>
                )}
              </div>
              {/* /Left Chat Title */}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="text-muted mt-2">Đang tải danh bạ...</p>
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
                    {groupedFriends[letter].map((friend) => (
                      <div className="chat-list" key={friend.userId}>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#contact-details"
                          className="chat-user-list"
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
                                {friend.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="chat-user-info">
                            <div className="chat-user-msg">
                              <h6>{friend.displayName}</h6>
                              <p className="text-muted small">
                                {friend.isOnline ? (
                                  <><i className="ti ti-circle-filled text-success" style={{fontSize: '8px'}}></i> Online</>
                                ) : friend.lastActiveAt ? (
                                  <>Last seen: {new Date(friend.lastActiveAt).toLocaleDateString('vi-VN')}</>
                                ) : (
                                  'Offline'
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
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