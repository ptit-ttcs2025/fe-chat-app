import { Link, useNavigate } from 'react-router-dom'
import { all_routes } from '../../feature-module/router/all_routes'
import ImageWithBasePath from '../common/imageWithBasePath';
import { useSelectedFriend } from '@/contexts/SelectedFriendContext';
import { useGetFriendDetail, useDeleteFriend } from '@/apis/friend/friend.api';
import { getAvatarColor, isValidUrl, getInitial } from '@/lib/avatarHelper';
import { useModalCleanup } from '@/hooks/useModalCleanup';
import { useQueryClient } from '@tanstack/react-query';
import { checkConversationExists, createConversation } from '@/apis/chat/chat.api';
import { useDispatch } from 'react-redux';
import { setSelectedConversation } from '@/core/data/redux/commonSlice';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import type { IConversation } from '@/apis/chat/chat.type';
import websocketService from '@/core/services/websocket.service';
import { useState } from 'react';

const ContactDetails = () => {
    const routes = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { selectedFriendId } = useSelectedFriend();
    const { setActiveTab, setIsCollapsed } = useSidebarCollapse();
    const MySwal = withReactContent(Swal);

    const [loading, setLoading] = useState(false);

    // Cleanup modal on navigation
    useModalCleanup('contact-details');

    // Fetch friend detail
    const { data: friendDetail, isLoading } = useGetFriendDetail(
        selectedFriendId || '',
        !!selectedFriendId
    );

    // Delete friend mutation
    const deleteFriendMutation = useDeleteFriend();

    // Handle delete friend
    const handleDeleteFriend = async () => {
        if (!selectedFriendId || !friendDetail) return;

        // Show confirmation dialog
        const result = await MySwal.fire({
            title: 'Xác nhận xóa bạn bè',
            html: `Bạn có chắc chắn muốn xóa <strong>${friendDetail.fullName}</strong> khỏi danh sách bạn bè?<br><br><small class="text-muted">Hành động này không thể hoàn tác.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="ti ti-trash me-2"></i>Xóa bạn bè',
            cancelButtonText: '<i class="ti ti-x me-2"></i>Hủy',
            reverseButtons: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await deleteFriendMutation.mutateAsync(selectedFriendId);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
            queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
            queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });

            // Close modal
            const modal = document.getElementById('contact-details');
            if (modal) {
                const bootstrap = (window as unknown as { bootstrap?: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } } } }).bootstrap;
                const bsModal = bootstrap?.Modal?.getInstance(modal);
                bsModal?.hide();
            }

            // Show success notification
            MySwal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Đã xóa bạn bè thành công',
                html: `<div style="text-align: left;">
                  <p style="margin: 0; font-size: 14px;">
                    Đã xóa <strong>${friendDetail.fullName}</strong> khỏi danh sách bạn bè
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
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Không thể xóa bạn bè. Vui lòng thử lại.';
            
            // Show error notification
            MySwal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Có lỗi xảy ra!',
                html: `<div style="text-align: left;">
                  <p style="margin: 0; font-size: 14px;">
                    ${errorMessage}
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
        }
    };

    // Handle start chat - NEW FLOW: Check first, then create if needed
    const handleStartChat = async () => {
        if (!selectedFriendId) return;

        // ✅ Set loading state
        setLoading(true);

        try {
            // ✅ Step 1: Check if conversation already exists
            const checkResponse = await checkConversationExists(selectedFriendId);

            console.log('✅ Check response:', checkResponse);

            let conversation: IConversation | null = null;

            // ✅ FIX: checkResponse IS the data (already unwrapped by interceptor)
            // Check if checkResponse is a conversation object (not null)
            if (checkResponse && typeof checkResponse === 'object' && 'id' in checkResponse) {
                // ✅ Conversation exists - use it
                conversation = checkResponse;
                console.log('✅ Conversation exists, reusing:', conversation.id);
            } else {
                // ✅ Conversation doesn't exist - create new
                console.log('⚠️ Conversation does not exist, creating new...');

                const createResponse = await createConversation(selectedFriendId);
                if (!createResponse || !createResponse.data) {
                    throw new Error('No conversation data returned');
                }
                conversation = createResponse.data;
                console.log('✅ Created new conversation:', conversation.id);
            }

            // ✅ Step 2: Process conversation (same for both existing and new)
            if (!conversation) {
                throw new Error('No conversation available');
            }

            // ✅ 2.1. Optimistically add/update conversation in cache
            queryClient.setQueriesData(
                { queryKey: ['chat', 'conversations'] },
                (oldData: unknown) => {
                    if (!oldData) return oldData;

                    const data = oldData as { results?: IConversation[]; meta?: { totalElements?: number } };

                    // Check if conversation already exists in cache
                    const existingIndex = data.results?.findIndex(
                        (conv: IConversation) => conv.id === conversation!.id
                    );

                    if (existingIndex !== undefined && existingIndex >= 0) {
                        // Update existing conversation
                        return {
                            ...data,
                            results: data.results?.map((conv: IConversation, idx: number) =>
                                idx === existingIndex ? { ...conv, ...conversation } : conv
                            ),
                        };
                    }

                    // Add new conversation to the beginning of the list
                    return {
                        ...data,
                        results: [conversation!, ...(data.results || [])],
                        meta: {
                            ...data.meta,
                            totalElements: (data.meta?.totalElements || 0) + 1,
                        },
                    };
                }
            );

            // ✅ 2.2. Subscribe to WebSocket
            if (websocketService.getConnectionStatus()) {
                websocketService.subscribeNewConversation(conversation.id);
            }

            // ✅ 2.3. Set selected conversation in Redux FIRST
            dispatch(setSelectedConversation(conversation.id));

            // ✅ 2.4. Switch to chat tab and open sidebar
            setActiveTab('chat');
            setIsCollapsed(false);

            // ✅ 2.5. Refetch conversations to ensure sync
            await queryClient.refetchQueries({
                queryKey: ['chat', 'conversations'],
                type: 'active'
            });

            // ✅ 2.6. Close contact details modal
            const modal = document.getElementById('contact-details');
            if (modal) {
                const bootstrap = (window as unknown as { bootstrap?: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } } } }).bootstrap;
                const bsModal = bootstrap?.Modal?.getInstance(modal);
                bsModal?.hide();
            }

            // ✅ 2.7. Small delay to ensure UI updates, then navigate
            setTimeout(() => {
                navigate(routes.chat);
                // No success modal - user will see the conversation directly
            }, 100);

        } catch (error) {
            console.error('❌ Error in handleStartChat:', error);

            const err = error as { response?: { data?: { message?: string } } };
            const errorMessage = err?.response?.data?.message || 'Không thể mở hội thoại. Vui lòng thử lại.';

            // Show error toast notification
            MySwal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Có lỗi xảy ra!',
                html: `<div style="text-align: left;">
                  <p style="margin: 0; font-size: 14px;">
                    ${errorMessage}
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
        } finally {
            // ✅ Reset loading state
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get gender label
    const getGenderLabel = (gender?: 'MALE' | 'FEMALE' | 'OTHER' | null) => {
        if (!gender) return 'Không rõ';
        switch (gender) {
            case 'MALE': return 'Nam';
            case 'FEMALE': return 'Nữ';
            case 'OTHER': return 'Khác';
            default: return 'Không rõ';
        }
    };

    // Get status badge
    const getStatusBadge = (status?: 'ONLINE' | 'OFFLINE' | 'AWAY') => {
        switch (status) {
            case 'ONLINE':
                return <span className="badge bg-success">Online</span>;
            case 'AWAY':
                return <span className="badge bg-warning">Away</span>;
            case 'OFFLINE':
            default:
                return <span className="badge bg-secondary">Offline</span>;
        }
    };
  return (
    <>
      {/* Contact Detail */}
  <div className="modal fade" id="contact-details">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Chi tiết liên hệ</h4>
          <div className="d-flex align-items-center">
            <div className="dropdown me-2">
              <Link className="d-block" to="#" data-bs-toggle="dropdown">
                <i className="ti ti-dots-vertical" />
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleDeleteFriend}
                    disabled={deleteFriendMutation.isPending}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                  >
                    {deleteFriendMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-trash me-2" />
                        Xóa
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted mt-2">Đang tải thông tin...</p>
            </div>
          )}

          {/* No Friend Selected */}
          {!isLoading && !friendDetail && (
            <div className="text-center py-5">
              <i className="ti ti-user-off" style={{ fontSize: '60px', color: '#dee2e6' }}></i>
              <p className="text-muted mt-2">Chưa chọn bạn bè nào</p>
            </div>
          )}

          {/* Friend Detail */}
          {!isLoading && friendDetail && (
            <>
              <div className="card bg-light shadow-none">
                <div className="card-body pb-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar avatar-lg">
                        {isValidUrl(friendDetail.avatarUrl) && friendDetail.avatarUrl ? (
                          <ImageWithBasePath
                            src={friendDetail.avatarUrl}
                            className="rounded-circle"
                            alt={friendDetail.fullName}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: getAvatarColor(friendDetail.fullName),
                              fontSize: '24px'
                            }}
                          >
                            {getInitial(friendDetail.fullName)}
                          </div>
                        )}
                      </span>
                      <div className="ms-2">
                        <h6>{friendDetail.fullName}</h6>
                        <p className="mb-0">{getStatusBadge(friendDetail.status)}</p>
                      </div>
                    </div>
                <div className="contact-actions d-flex align-items-center mb-3">
                  <button
                    type="button"
                    className="btn btn-icon btn-light me-2"
                    onClick={handleStartChat}
                    disabled={loading}
                    title="Nhắn tin"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="ti ti-message" style={{ fontSize: '18px' }} />
                    )}
                  </button>
                  <Link
                    to="#"
                    className="me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#voice_call"
                  >
                    <i className="ti ti-phone" />
                  </Link>
                  <Link
                    to="#"
                    className="me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#video-call"
                  >
                    <i className="ti ti-video" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="card border mb-3">
            <div className="card-header border-bottom">
              <h6>Thông Tin Cá Nhân</h6>
            </div>
            <div className="card-body pb-1">
              <div className="mb-2">
                <div className="row align-items-center">
                  {friendDetail.lastActiveAt && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-clock-hour-4 me-1" />
                          Hoạt động lần cuối
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">
                          {new Date(friendDetail.lastActiveAt).toLocaleString('vi-VN')}
                        </h6>
                      </div>
                    </>
                  )}
                  
                  {friendDetail.dob && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-calendar-event me-1" />
                          Ngày sinh
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">{formatDate(friendDetail.dob)}</h6>
                      </div>
                    </>
                  )}

                  {friendDetail.gender && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-gender-bigender me-1" />
                          Giới tính
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">{getGenderLabel(friendDetail.gender)}</h6>
                      </div>
                    </>
                  )}

                  <div className="col-sm-6">
                    <p className="mb-2 d-flex align-items-center">
                      <i className="ti ti-mail me-1" />
                      Email
                    </p>
                  </div>
                  <div className="col-sm-6">
                    <h6 className="fw-medium fs-14 mb-2">
                      {friendDetail.email}
                    </h6>
                  </div>

                  {friendDetail.bio && (
                    <>
                      <div className="col-sm-6">
                        <p className="mb-2 d-flex align-items-center">
                          <i className="ti ti-info-circle me-1" />
                          Tiểu sử
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <h6 className="fw-medium fs-14 mb-2">
                          {friendDetail.bio}
                        </h6>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  {/* /Contact Detail */}
    </>
  )
}

export default ContactDetails
