import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../common/imageWithBasePath";
import { useGroupCreation } from '@/contexts/GroupCreationContext';
import { friendApis } from '@/apis/friend/friend.api';
import { useGroupCreationFlow } from '@/hooks/useGroupCreationFlow';
import type { IFriend } from '@/apis/friend/friend.type';

const AddGroup = () => {
  const {
    groupData,
    toggleMember,
    resetGroupData
  } = useGroupCreation();

  const { createGroup, isCreating, validationErrors } = useGroupCreationFlow();

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

        // Show success message
        alert('✅ Tạo nhóm thành công!');

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
      {/* Add Group */}
      <div className="modal fade" id="add-group">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">
                Thêm thành viên
                {groupData.selectedMemberIds.length > 0 && (
                  <span className="badge bg-primary ms-2">
                    {groupData.selectedMemberIds.length}
                  </span>
                )}
              </h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form>
                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="ti ti-alert-circle me-2" />
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                    />
                  </div>
                )}

                {/* Search */}
                <div className="search-wrap contact-search mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm bạn bè..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Link to="#" className="input-group-text">
                      <i className="ti ti-search" />
                    </Link>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-semibold fs-16 mb-0">Danh sách bạn bè</h6>
                  {isLoading && friends.length === 0 && (
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  )}
                </div>

                {/* Friends List with Infinite Scroll */}
                <div
                  className="contact-scroll contact-select mb-3"
                  ref={scrollRef}
                  onScroll={handleScroll}
                  style={{
                    maxHeight: '350px',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                  }}
                >
                  {friends.length === 0 && !isLoading && (
                    <div className="text-center py-4">
                      <i className="ti ti-user-off fs-32 text-muted mb-2" />
                      <p className="text-muted">
                        {searchQuery ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè'}
                      </p>
                    </div>
                  )}

                  {friends.map((friend) => (
                    <div
                      key={friend.friendId}
                      className="contact-user d-flex align-items-center justify-content-between"
                    >
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-lg">
                          <ImageWithBasePath
                            src={friend.avatarUrl || "assets/img/profiles/avatar-default.png"}
                            className="rounded-circle"
                            alt={friend.displayName}
                          />
                        </div>
                        <div className="ms-2">
                          <h6>{friend.displayName}</h6>
                          <p className="text-muted small">
                            {friend.isOnline ? (
                              <span className="text-success">
                                <i className="ti ti-circle-filled fs-7 me-1" />
                                Đang hoạt động
                              </span>
                            ) : (
                              <span className="text-muted">
                                <i className="ti ti-circle fs-7 me-1" />
                                Không hoạt động
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={groupData.selectedMemberIds.includes(friend.friendId)}
                          onChange={() => handleToggleMember(friend.friendId)}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Load More Indicator */}
                  {isLoading && friends.length > 0 && (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  )}

                  {!hasMore && friends.length > 0 && (
                    <div className="text-center py-2">
                      <small className="text-muted">Đã hiển thị tất cả bạn bè</small>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="row g-3">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={handleBack}
                      disabled={isCreating}
                    >
                      <i className="ti ti-arrow-left me-1" />
                      Quay lại
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleCreateGroup}
                      disabled={isCreating || isLoading || groupData.selectedMemberIds.length === 0}
                    >
                      {isCreating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Đang tạo nhóm...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-check me-1" />
                          Tạo nhóm ({groupData.selectedMemberIds.length} thành viên)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add group */}
    </>
  );
};

export default AddGroup;
