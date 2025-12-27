/**
 * ChatTab - Sidebar Conversations với API Integration
 * Hiển thị danh sách conversations từ API thay vì dữ liệu tĩnh
 */

import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { Swiper, SwiperSlide } from 'swiper/react';

// Styles
import '../../../../node_modules/swiper/swiper.css';
import "overlayscrollbars/overlayscrollbars.css";

// Components
import { all_routes } from '../../../feature-module/router/all_routes';
import { isValidUrl, getInitial, getAvatarColor } from '@/lib/avatarHelper';
import { useTotalUnreadCount, useUnreadSummary } from '@/hooks/useUnreadMessages';
import CollapseButton from './CollapseButton';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';

// API Hooks
import { useChatConversations } from '@/hooks/useChatConversations';
import type { IConversation } from '@/apis/chat/chat.type';

// Redux
import { setSelectedConversation } from '@/core/data/redux/commonSlice';

// OverlayScrollbars types
interface OverlayScrollbarsInstance {
  elements?: () => {
    target?: HTMLElement;
  };
}

interface RootState {
  common: {
    selectedConversationId: string | null;
  };
  auth: {
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string;
    } | null;
  };
}

const ChatTab = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const user = useSelector((state: RootState) => state.auth?.user);
  const selectedConversationId = useSelector((state: RootState) => state.common?.selectedConversationId);
  
  // Local state
  const [activeTab, setActiveTab] = useState('All Chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(50); // Dynamic page size for scroll pagination
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sidebar collapse state
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  // Tổng số tin nhắn chưa đọc để hiển thị badge nhỏ bên cạnh tiêu đề "Chats"
  const { data: totalUnreadCount } = useTotalUnreadCount();
  // Tổng hợp unread theo conversation
  const { data: unreadSummary } = useUnreadSummary();
  const unreadMap = useMemo(() => {
    const map: Record<string, { count: number; lastPreview?: string | null; lastTime?: string | null }> = {};
    if (unreadSummary) {
      unreadSummary.unreadConversations.forEach((conv) => {
        map[conv.conversationId] = {
          count: conv.unreadCount,
          lastPreview: conv.lastMessagePreview,
          lastTime: conv.lastMessageTimestamp,
        };
      });
    }
    return map;
  }, [unreadSummary]);
  
  // API Hooks
  const {
    conversations,
    isLoading,
    refresh: refetchConversations,
    toggleMute,
    togglePin: togglePinConversation,
    deleteConversation,
  } = useChatConversations({
    pageSize: pageSize, // Dynamic page size that increases on scroll
    autoRefresh: true,
    // Removed type filter - fetch both ONE_TO_ONE and GROUP conversations
  });
  
  // Filter conversations based on tab and search
  const filteredConversations = useMemo(() => {
    let result = conversations || [];
    
    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(conv =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Tab filter
    switch (activeTab) {
      case 'Favourite Chats':
        result = result.filter(conv => conv.favorite); // API trả về "favorite" không phải "favourite"
        break;
      case 'Pinned Chats':
        result = result.filter(conv => conv.pinned);
        break;
      case 'Archive Chats':
        result = result.filter(conv => conv.archived);
        break;
      case 'Trash':
        result = result.filter(conv => conv.deleted);
        break;
      default:
        result = result.filter(conv => !conv.archived && !conv.deleted);
    }
    
    // Sort: Pinned first, sau đó theo thời gian tin nhắn cuối (ưu tiên dữ liệu từ unread summary)
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      const infoA = unreadMap[a.id];
      const infoB = unreadMap[b.id];

      const timeA = infoA?.lastTime
        ? new Date(infoA.lastTime).getTime()
        : a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = infoB?.lastTime
        ? new Date(infoB.lastTime).getTime()
        : b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });
    
    return result;
  }, [conversations, searchQuery, activeTab, unreadMap]);

  // Recent/Online users for swiper
  const recentUsers = useMemo(() => {
    return (conversations || [])
      .filter(conv => conv.type === 'PRIVATE' && conv.isOnline)
      .slice(0, 7);
  }, [conversations]);
  
  // Handlers
  const handleConversationClick = useCallback((conversation: IConversation) => {
    // Dispatch action để set selected conversation
    dispatch(setSelectedConversation(conversation.id));
    navigate(routes.chat);
  }, [dispatch, navigate, routes.chat]);
  
  const handleDeleteConversation = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      deleteConversation(conversationId);
    }
  }, [deleteConversation]);
  
  const handleTogglePin = useCallback((e: React.MouseEvent, conversationId: string, isPinned: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinConversation(conversationId, !isPinned);
  }, [togglePinConversation]);
  
  const handleToggleMute = useCallback((e: React.MouseEvent, conversationId: string, isMuted: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMute(conversationId, !isMuted);
  }, [toggleMute]);
  
  // Scroll-based pagination handler
  const handleScroll = useCallback((instance: OverlayScrollbarsInstance) => {
    // OverlayScrollbars passes instance object, not Event
    const elements = instance?.elements?.();
    if (!elements) {
      return;
    }

    const { target } = elements;

    // Safety check: ensure element exists
    if (!target) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = target;

    // Load more when scroll near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom && !isLoadingMore && !isLoading && conversations.length >= pageSize) {
      setIsLoadingMore(true);
      // Increase page size by 50 to load more conversations
      setPageSize(prev => prev + 50);

      // Reset loading state after 500ms
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 500);
    }
  }, [isLoadingMore, isLoading, conversations.length, pageSize]);

  // Format helpers
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      const diffInSecs = Math.floor(diffInMs / 1000);
      
      // Nếu < 0 (timestamp trong tương lai) hoặc < 1 phút
      if (diffInMins < 0 || diffInSecs < 60) {
        return 'Vừa xong';
      } else if (diffInMins === 1) {
        return '1 phút trước';
      } else {
        return `${diffInMins} phút trước`;
      }
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('vi-VN', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };
  
  const getConversationName = (conv: IConversation) => {
    return conv.name || 'Cuộc trò chuyện';
  };
  
  const getConversationAvatar = (conv: IConversation) => {
    return conv.avatarUrl || 'assets/img/profiles/avatar-default.jpg';
  };

  // Avatar Component với fallback
  const Avatar = ({ src, name, className = "" }: { src?: string; name?: string; className?: string }) => {
    const [imgError, setImgError] = useState(false);
    const avatarName = name || "User";
    const initial = getInitial(avatarName);
    const bgColor = getAvatarColor(avatarName);
    const hasValidUrl = isValidUrl(src) && !imgError;

    if (hasValidUrl && src) {
      const fullSrc = src.startsWith('http') ? src : `${import.meta.env.VITE_IMG_PATH || ''}${src}`;
      return (
        <img
          src={fullSrc}
          className={className}
          alt={avatarName}
          onError={() => setImgError(true)}
          style={{ objectFit: 'cover' }}
        />
      );
    }

    // Fallback: Avatar với chữ cái đầu
    return (
      <div
        className={`${className} d-inline-flex align-items-center justify-content-center`}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: bgColor,
          color: "#fff",
          fontWeight: "600",
          fontSize: "16px",
        }}
      >
        {initial}
      </div>
    );
  };
  
  const getLastMessagePreview = (conv: IConversation) => {
    const unreadInfo = unreadMap[conv.id];
    if (unreadInfo?.lastPreview) {
      return unreadInfo.lastPreview;
    }

    if (!conv.lastMessage) return 'Chưa có tin nhắn';
    
      const { content, type, senderId } = conv.lastMessage;
    const isOwnMessage = senderId === user?.id;
    const prefix = isOwnMessage ? 'Bạn: ' : '';
    
    if (type === 'TEXT') {
      return `${prefix}${content?.slice(0, 30)}${content && content.length > 30 ? '...' : ''}`;
    } else if (type === 'IMAGE') {
      return `${prefix}📷 Hình ảnh`;
    } else if (type === 'FILE') {
      return `${prefix}📎 File`;
    } else if (type === 'VOICE') {
      return `${prefix}🎵 Âm thanh`;
    } else if (type === 'VIDEO') {
      return `${prefix}🎬 Video`;
    }
    return `${prefix}Tin nhắn`;
  };
  
  // Render single conversation item
  const renderConversationItem = (conv: IConversation) => (
    <div className="chat-list" key={conv.id}>
      <Link 
        to="#" 
        className={`chat-user-list ${selectedConversationId === conv.id ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          handleConversationClick(conv);
        }}
      >
        <div className={`avatar avatar-lg ${conv.isOnline ? 'online' : ''} me-2`}>
          <Avatar
            src={getConversationAvatar(conv)}
            name={getConversationName(conv)}
            className={`rounded-circle ${conv.pinned ? 'border border-warning border-2' : ''}`}
          />
        </div>
        <div className="chat-user-info">
          <div className="chat-user-msg">
            <h6>
              {getConversationName(conv)}
              {conv.muted && <i className="ti ti-volume-off ms-1 text-muted fs-12" />}
            </h6>
            <p>
              {conv.typing ? (
                <span className="animate-typing text-primary">
                  đang nhập
                  <span className="dot mx-1" />
                  <span className="dot me-1" />
                  <span className="dot" />
                </span>
              ) : (
                getLastMessagePreview(conv)
              )}
            </p>
          </div>
          <div className="chat-user-time">
            <span className="time">
              {unreadMap[conv.id]?.lastTime
                ? formatTime(unreadMap[conv.id]!.lastTime || undefined)
                : formatTime(conv.lastMessage?.createdAt)}
            </span>
            <div className="chat-pin">
              {conv.pinned && <i className="ti ti-pin me-2" />}
              {(() => {
                const unread = unreadMap[conv.id]?.count ?? conv.unreadCount;
                if (unread > 0) {
                  return (
                    <span className="count-message fs-12 fw-semibold">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  );
                }
                return conv.lastMessage?.readCount ? (
                  <i className="ti ti-checks text-success" />
                ) : (
                  <i className="ti ti-check text-muted" />
                );
              })()}
            </div>
          </div>
        </div>
      </Link>
      <div className="chat-dropdown">
        <Link className="#" to="#" data-bs-toggle="dropdown">
          <i className="ti ti-dots-vertical" />
        </Link>
        <ul className="dropdown-menu dropdown-menu-end p-3">
          <li>
            <Link 
              className="dropdown-item" 
              to="#"
              onClick={(e) => handleTogglePin(e, conv.id, conv.pinned)}
            >
              <i className={`ti ti-pin${conv.pinned ? '-filled' : ''} me-2`} />
              {conv.pinned ? 'Bỏ ghim' : 'Ghim chat'}
            </Link>
          </li>
          <li>
            <Link className="dropdown-item" to="#">
              <i className="ti ti-heart me-2" />
              {conv.favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            </Link>
          </li>
          <li>
            <Link 
              className="dropdown-item" 
              to="#"
              onClick={(e) => handleToggleMute(e, conv.id, conv.muted)}
            >
              <i className={`ti ti-volume${conv.muted ? '' : '-off'} me-2`} />
              {conv.muted ? 'Bật thông báo' : 'Tắt thông báo'}
            </Link>
          </li>
          <li>
            <Link className="dropdown-item" to="#">
              <i className="ti ti-box-align-right me-2" />
              Lưu trữ
            </Link>
          </li>
          <li>
            <Link
              className="dropdown-item text-danger"
              to="#"
              onClick={(e) => handleDeleteConversation(e, conv.id)}
            >
              <i className="ti ti-trash me-2" />
              Xóa
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Chats sidebar */}
      <div id="chats" className="sidebar-content active">
        <OverlayScrollbarsComponent
          options={{
            scrollbars: {
              autoHide: 'scroll',
              autoHideDelay: 1000,
            },
          }}
          events={{
            scroll: handleScroll,
          }}
          style={{ maxHeight: '100vh' }}
        >
          <div className="">
            {/* Header */}
            <div className="chat-search-header">
              <div className="header-title d-flex align-items-center justify-content-between">
                <h4 className="mb-3 d-flex align-items-center gap-2">
                  <span>Chats</span>
                  {(totalUnreadCount ?? 0) > 0 && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        background:
                          'linear-gradient(135deg, #6338F6 0%, #764ba2 100%)',
                        fontSize: '11px',
                      }}
                    >
                      {(totalUnreadCount ?? 0) > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </h4>
                <div className="d-flex align-items-center mb-3 gap-1">
                  <CollapseButton 
                    isCollapsed={isCollapsed} 
                    onToggle={toggleCollapse}
                    variant="header"
                  />
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#new-chat"
                    className="add-icon btn btn-primary p-0 d-flex align-items-center justify-content-center fs-16"
                    style={{ width: '36px', height: '36px' }}
                  >
                    <i className="ti ti-plus" />
                  </Link>
                  <div className="dropdown">
                    <Link
                      to="#"
                      data-bs-toggle="dropdown"
                      className="fs-16 text-default d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px' }}
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <ul className="dropdown-menu p-3">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#invite"
                        >
                          <i className="ti ti-send me-2" />
                          Mời bạn bè
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            refetchConversations();
                          }}
                        >
                          <i className="ti ti-refresh me-2" />
                          Làm mới
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Search */}
              <div className="search-wrap">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm tin nhắn hoặc liên hệ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="input-group-text">
                      {searchQuery ? (
                        <i 
                          className="ti ti-x cursor-pointer" 
                          onClick={() => setSearchQuery('')}
                        />
                      ) : (
                        <i className="ti ti-search" />
                      )}
                    </span>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Recent/Online Contacts */}
            {recentUsers.length > 0 && (
              <div className="top-online-contacts">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-3">Đang hoạt động</h5>
                  <div className="dropdown mb-3">
                    <Link
                      to="#"
                      className="text-default"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="ti ti-dots-vertical" />
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link className="dropdown-item mb-1" to="#">
                          <i className="ti ti-eye-off me-2" />
                          Ẩn
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="swiper-container">
                  <div className="swiper-wrapper">
                    <Swiper spaceBetween={15} slidesPerView={4}>
                      {recentUsers.map((conv) => (
                        <SwiperSlide key={conv.id}>
                          <Link 
                            to="#" 
                            className="chat-status text-center"
                            onClick={(e) => {
                              e.preventDefault();
                              handleConversationClick(conv);
                            }}
                          >
                            <div className="avatar avatar-lg online d-block">
                              <Avatar
                                src={getConversationAvatar(conv)}
                                name={getConversationName(conv)}
                                className="rounded-circle"
                              />
                            </div>
                            <p className="text-truncate">{getConversationName(conv).split(' ')[0]}</p>
                          </Link>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                </div>
              </div>
            )}
            
            {/* Conversations List */}
            <div className="sidebar-body chat-body" id="chatsidebar">
              {/* Title and Filter */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="chat-title">{activeTab}</h5>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="text-default fs-16"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ti ti-filter" />
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3" id="innerTab" role="tablist">
                    <li role="presentation">
                      <Link
                        className={`dropdown-item ${activeTab === 'All Chats' ? 'active' : ''}`}
                        to="#"
                        onClick={() => setActiveTab('All Chats')}
                      >
                        Tất cả
                      </Link>
                    </li>
                    <li role="presentation">
                      <Link
                        className={`dropdown-item ${activeTab === 'Favourite Chats' ? 'active' : ''}`}
                        to="#"
                        onClick={() => setActiveTab('Favourite Chats')}
                      >
                        Yêu thích
                      </Link>
                    </li>
                    <li role="presentation">
                      <Link
                        className={`dropdown-item ${activeTab === 'Pinned Chats' ? 'active' : ''}`}
                        to="#"
                        onClick={() => setActiveTab('Pinned Chats')}
                      >
                        Đã ghim
                      </Link>
                    </li>
                    <li role="presentation">
                      <Link
                        className={`dropdown-item ${activeTab === 'Archive Chats' ? 'active' : ''}`}
                        to="#"
                        onClick={() => setActiveTab('Archive Chats')}
                      >
                        Lưu trữ
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Conversations Content */}
              <div className="tab-content" id="innerTabContent">
                <div className="tab-pane fade show active" id="all-chats" role="tabpanel">
                  <div className="chat-users-wrap">
                    {/* Loading State */}
                    {isLoading && (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary spinner-border-sm" role="status">
                          <span className="visually-hidden">Đang tải...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0 small">Đang tải cuộc trò chuyện...</p>
                      </div>
                    )}
                    
                    {/* Conversations List */}
                    {!isLoading && filteredConversations.length > 0 && (
                      filteredConversations.map(renderConversationItem)
                    )}
                    
                    {/* Load More Indicator */}
                    {isLoadingMore && (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Đang tải thêm...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0 small">Đang tải thêm cuộc trò chuyện...</p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredConversations.length === 0 && (
                      <div className="text-center py-5">
                        <i className="ti ti-message-off fs-1 text-muted" />
                        <h6 className="mt-3">
                          {searchQuery 
                            ? 'Không tìm thấy kết quả' 
                            : 'Chưa có cuộc trò chuyện'}
                        </h6>
                        <p className="text-muted small">
                          {searchQuery 
                            ? 'Thử tìm với từ khóa khác' 
                            : 'Bắt đầu trò chuyện mới!'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
      
      {/* Styles */}
      <style>{`
        .chat-user-list.active {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-left: 3px solid #667eea;
        }
        
        .chat-user-list:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        
        .animate-typing {
          display: inline-flex;
          align-items: center;
        }
        
        .animate-typing .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #667eea;
          animation: typing 1.4s infinite;
        }
        
        .animate-typing .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .animate-typing .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .count-message {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default ChatTab;
