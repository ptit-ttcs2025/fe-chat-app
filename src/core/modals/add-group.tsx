import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../common/imageWithBasePath";
import { useGroupCreation } from '@/contexts/GroupCreationContext';
import { friendApis } from '@/apis/friend/friend.api';
import { useGroupCreationFlow } from '@/hooks/useGroupCreationFlow';
import type { IFriend } from '@/apis/friend/friend.type';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const AddGroup = () => {
  const {
    groupData,
    toggleMember,
    resetGroupData
  } = useGroupCreation();

  const { createGroup, isCreating, validationErrors } = useGroupCreationFlow();
  const MySwal = withReactContent(Swal);

  // State
  const [friends, setFriends] = useState<IFriend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreThrottleRef = useRef<boolean>(false);

  // Fetch friends with pagination
  const fetchFriends = useCallback(async (pageNumber: number, isLoadMore: boolean = false) => {
    if (isLoading || (!isLoadMore && pageNumber > 0)) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await friendApis.searchFriends({
        q: searchQuery,
        pageNumber,
        pageSize: 20,
      });

      if (isLoadMore) {
        setFriends(prev => [...prev, ...result]);
      } else {
        setFriends(result);
      }

      // Check if has more
      if (result.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setError('Không thể tải danh sách bạn bè');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isLoading]);

  // Initial load
  useEffect(() => {
    fetchFriends(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search handler
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        // Reset pagination khi search
        setPage(0);
        setHasMore(true);
        setFriends([]);
        fetchFriends(0);
      } else {
        // Reset về danh sách ban đầu
        setPage(0);
        setHasMore(true);
        setFriends([]);
        fetchFriends(0);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Load more when scroll near bottom
    if (
      scrollHeight - scrollTop <= clientHeight + 100 &&
      hasMore &&
      !isLoading &&
      !loadMoreThrottleRef.current
    ) {
      loadMoreThrottleRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFriends(nextPage, true);

      // Reset throttle after 1s
      setTimeout(() => {
        loadMoreThrottleRef.current = false;
      }, 1000);
    }
  }, [hasMore, isLoading, page, fetchFriends]);

  // Handle member selection
  const handleToggleMember = (friendId: string) => {
    toggleMember(friendId);
  };

  // Handle create group
  const handleCreateGroup = async () => {
    try {
      setError(null);

      console.log('🚀 Creating group from AddGroup modal...');

      // Call the unified create group flow from hook
      const result = await createGroup();

      if (result.success) {
        console.log('✅ Group created successfully!', result);

        // Close modal
        const addGroupModal = document.getElementById('add-group');
        if (addGroupModal) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bsModal = (window as any).bootstrap?.Modal?.getInstance(addGroupModal);
          bsModal?.hide();
        }

        // Show success toast notification
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Tạo nhóm thành công!',
          html: `<div style="text-align: left;">
            <p style="margin: 0; font-size: 14px;">
              Nhóm <strong>${groupData.name}</strong> đã được tạo thành công! 🎉
            </p>
          </div>`,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          showClass: {
            popup: 'animate__animated animate__fadeInRight'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutRight'
          },
          customClass: {
            popup: 'colored-toast'
          }
        });

        // Navigate to the new conversation if we have conversationId
        if (result.conversationId) {
          // TODO: Navigate to conversation detail page
          console.log('Navigate to conversation:', result.conversationId);
        }
      } else {
        // Show error from validation or API
        setError(result.error || 'Không thể tạo nhóm. Vui lòng thử lại.');
        console.error('❌ Group creation failed:', result.error);
      }
    } catch (err) {
      console.error('❌ Unexpected error during group creation:', err);
      setError('Có lỗi không mong muốn xảy ra. Vui lòng thử lại.');
    }
  };

  // Handle back
  const handleBack = () => {
    const addGroupModal = document.getElementById('add-group');
    const newGroupModal = document.getElementById('new-group');
    if (addGroupModal && newGroupModal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bsModal1 = (window as any).bootstrap?.Modal?.getInstance(addGroupModal);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bsModal2 = (window as any).bootstrap?.Modal?.getInstance(newGroupModal);
      bsModal1?.hide();
      setTimeout(() => {
        bsModal2?.show();
      }, 300);
    }
  };

  return (
    <>
      {/* Add Group Modal */}
      <div className="modal fade" id="add-group" tabIndex={-1} aria-labelledby="addGroupModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="modal-header border-0 pb-3" style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
              <div className="w-100">
                <div className="d-flex align-items-center mb-1">
                  <h4 className="modal-title fw-bold mb-0 me-2" style={{ fontSize: '24px', color: '#1a1a1a' }}>
                    Thêm thành viên
                  </h4>
                  {groupData.selectedMemberIds.length > 0 && (
                    <span
                      className="badge rounded-pill d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#6338F6',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '4px 12px',
                        minWidth: '32px',
                        height: '24px',
                      }}
                    >
                      {groupData.selectedMemberIds.length}
                    </span>
                  )}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                  Chọn bạn bè để thêm vào nhóm
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                style={{ fontSize: '12px', opacity: 0.6 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <form>
                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '12px', border: 'none', padding: '12px 16px' }}>
                    <i className="ti ti-alert-circle me-2 fs-18" />
                    <span style={{ fontSize: '14px', flex: 1 }}>{error}</span>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                      style={{ fontSize: '10px' }}
                    />
                  </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="input-group" style={{ position: 'relative' }}>
                    <span
                      className="input-group-text bg-light border-end-0"
                      style={{
                        borderTopLeftRadius: '12px',
                        borderBottomLeftRadius: '12px',
                        borderColor: '#e0e0e0',
                        paddingLeft: '16px',
                        paddingRight: '12px',
                      }}
                    >
                      <i className="ti ti-search text-muted" style={{ fontSize: '18px' }} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Tìm kiếm bạn bè..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        borderTopRightRadius: '12px',
                        borderBottomRightRadius: '12px',
                        borderColor: '#e0e0e0',
                        paddingLeft: '12px',
                        paddingRight: '16px',
                        fontSize: '14px',
                        height: '48px',
                      }}
                    />
                  </div>
                </div>

                {/* Section Title */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-semibold mb-0" style={{ fontSize: '15px', color: '#1a1a1a' }}>
                    Danh sách bạn bè
                  </h6>
                  {isLoading && friends.length === 0 && (
                    <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '18px', height: '18px' }}>
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  )}
                </div>

                {/* Friends List with Infinite Scroll */}
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                    backgroundColor: '#fafafa',
                  }}
                  className="mb-4"
                >
                  {/* Empty State */}
                  {friends.length === 0 && !isLoading && (
                    <div className="text-center py-5 px-3">
                      <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: '#f0f0f0',
                          color: '#999',
                        }}
                      >
                        <i className="ti ti-user-off" style={{ fontSize: '32px' }} />
                      </div>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        {searchQuery ? 'Không tìm thấy bạn bè phù hợp' : 'Chưa có bạn bè'}
                      </p>
                      {!searchQuery && (
                        <small className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                          Hãy kết bạn trước để thêm vào nhóm
                        </small>
                      )}
                    </div>
                  )}

                  {/* Friends List */}
                  {friends.map((friend) => {
                    const isSelected = groupData.selectedMemberIds.includes(friend.friendId);
                    return (
                      <div
                        key={friend.friendId}
                        className="d-flex align-items-center justify-content-between p-3"
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          backgroundColor: isSelected ? '#f1edfe' : 'transparent',
                        }}
                        onClick={() => handleToggleMember(friend.friendId)}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f8f8f8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                          {/* Avatar */}
                          <div className="position-relative me-3" style={{ flexShrink: 0 }}>
                            <div className="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden' }}>
                              {isValidUrl(friend.avatarUrl) && friend.avatarUrl ? (
                                <ImageWithBasePath
                                  src={friend.avatarUrl}
                                  className="rounded-circle"
                                  alt={friend.displayName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center rounded-circle"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: getAvatarColor(friend.displayName || 'User'),
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '18px',
                                  }}
                                >
                                  {getInitial(friend.displayName || 'User')}
                                </div>
                              )}
                            </div>
                            {/* Online Status Indicator */}
                            {friend.isOnline && (
                              <div
                                className="position-absolute rounded-circle border border-white"
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: '#28a745',
                                  bottom: '2px',
                                  right: '2px',
                                  zIndex: 1,
                                }}
                              />
                            )}
                          </div>

                          {/* Friend Info */}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <h6
                              className="mb-1 fw-semibold"
                              style={{
                                fontSize: '14px',
                                color: '#1a1a1a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {friend.displayName}
                            </h6>
                            <div className="d-flex align-items-center">
                              {friend.isOnline ? (
                                <span className="d-flex align-items-center" style={{ fontSize: '12px', color: '#28a745' }}>
                                  <i className="ti ti-circle-filled me-1" style={{ fontSize: '8px' }} />
                                  Đang hoạt động
                                </span>
                              ) : (
                                <span className="d-flex align-items-center" style={{ fontSize: '12px', color: '#999' }}>
                                  <i className="ti ti-circle me-1" style={{ fontSize: '8px' }} />
                                  Không hoạt động
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div className="form-check ms-3" style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMember(friend.friendId)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              borderColor: isSelected ? '#6338F6' : '#ddd',
                              backgroundColor: isSelected ? '#6338F6' : '#fff',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Load More Indicator */}
                  {isLoading && friends.length > 0 && (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '18px', height: '18px' }}>
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  )}

                  {/* End of List Indicator */}
                  {!hasMore && friends.length > 0 && (
                    <div className="text-center py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                      <small className="text-muted" style={{ fontSize: '12px' }}>
                        <i className="ti ti-check me-1" />
                        Đã hiển thị tất cả bạn bè
                      </small>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-3 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={handleBack}
                    disabled={isCreating}
                    style={{
                      height: '48px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderColor: '#e0e0e0',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.borderColor = '#6338F6'
                        e.currentTarget.style.color = '#6338F6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCreating) {
                        e.currentTarget.style.borderColor = '#e0e0e0'
                        e.currentTarget.style.color = '#6c757d'
                      }
                    }}
                  >
                    <i className="ti ti-arrow-left me-2" />
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={handleCreateGroup}
                    disabled={isCreating || isLoading || groupData.selectedMemberIds.length === 0}
                    style={{
                      height: '48px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      backgroundColor: (isCreating || isLoading || groupData.selectedMemberIds.length === 0) ? '#ccc' : '#6338F6',
                      borderColor: (isCreating || isLoading || groupData.selectedMemberIds.length === 0) ? '#ccc' : '#6338F6',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '16px', height: '16px' }} />
                        Đang tạo nhóm...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-check me-2" />
                        Tạo nhóm
                        {groupData.selectedMemberIds.length > 0 && (
                          <span className="ms-1">({groupData.selectedMemberIds.length})</span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddGroup;
