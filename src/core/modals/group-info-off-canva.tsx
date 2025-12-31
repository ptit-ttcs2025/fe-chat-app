import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "yet-another-react-lightbox/styles.css";
import ImageFallback from "@/components/ImageFallback";
import { IConversation } from "@/apis/chat/chat.type";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { UpdateGroupRequest } from "@/apis/group/group.type";
import MediaGallery from "@/feature-module/chat/components/MediaGallery";
import { useMediaMessages } from "@/hooks/useMediaMessages";
import ReportFormModal from "./report-form-modal";
import EditGroupModal from "./edit-group-modal";

interface GroupInfoProps {
  selectedConversation: IConversation | null;
}

const GroupInfo = ({ selectedConversation }: GroupInfoProps) => {
  // Search query for members modal
  const [searchQuery, setSearchQuery] = useState("");
  // State for report modal
  const [showReportModal, setShowReportModal] = useState(false);
  // State for edit group modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if conversation is GROUP
  const isGroupConversation = selectedConversation?.type === "GROUP";
  const groupId = selectedConversation?.groupId || null;
  const adminId = selectedConversation?.adminId || "";

  // Get current user ID
  const currentUserId = useMemo(() => {
    try {
      const userStr = localStorage.getItem("auth_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.userId || null;
      }
    } catch (error) {
      console.error("❌ Failed to get current user ID:", error);
    }
    return null;
  }, []);

  // Fetch group data using useGroupManagement hook
  const {
    members,
    isLoadingMembers,
    getOnlineMembersCount,
    updateGroup,
  } = useGroupManagement({
    groupId: groupId,
    autoFetchMembers: isGroupConversation && !!groupId,
    // Note: autoFetchGroup removed - EditGroupModal fetches data independently via API
  });

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    return currentUserId !== null && currentUserId === adminId;
  }, [adminId, currentUserId]);

  const checkIsAdmin = (userId: string | null) => {
    return userId !== null && userId === adminId;
  }

  // Get online members count
  const onlineMembersCount = getOnlineMembersCount();

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((member) =>
      member.name?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Get media counts
  const { totalCount: totalImages } = useMediaMessages({
    conversationId: selectedConversation?.id || null,
    type: "IMAGE",
    pageSize: 12,
    enabled: !!selectedConversation?.id && isGroupConversation,
  });

  const { totalCount: totalFiles } = useMediaMessages({
    conversationId: selectedConversation?.id || null,
    type: "FILE",
    pageSize: 10,
    enabled: !!selectedConversation?.id && isGroupConversation,
  });

  // Handle update group
  const handleUpdateGroup = async (data: UpdateGroupRequest) => {
    try {
      await updateGroup(data);
      setShowEditModal(false);
      // Success notification handled in EditGroupModal
    } catch (error) {
      console.error("❌ Error updating group:", error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  // Loading state
  const isLoading = isLoadingMembers;

  if (!isGroupConversation || !selectedConversation) {
    return (
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="contact-profile"
        aria-labelledby="groupInfoLabel"
      >
        <div className="offcanvas-header">
          <h4 className="offcanvas-title" id="groupInfoLabel">
            Thông tin nhóm
          </h4>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="offcanvas-body">
          <div className="text-center py-5">
            <i
              className="ti ti-users-group"
              style={{ fontSize: "60px", color: "#dee2e6" }}
            />
            <p className="text-muted mt-3">Đây không phải là nhóm chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Group Info */}
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="contact-profile"
        aria-labelledby="groupInfoLabel"
      >
        <div className="offcanvas-header">
          <h4 className="offcanvas-title" id="groupInfoLabel">
            Thông tin nhóm
          </h4>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="offcanvas-body">
          <div className="chat-contact-info">
            <div className="profile-content">
              {/* Group Profile Header */}
              <div className="contact-profile-info">
                {isLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted mt-2">Đang tải thông tin nhóm...</p>
                  </div>
                ) : (
                  <>
                    <div className="avatar avatar-xxl mb-2 position-relative">
                      <ImageFallback
                        src={selectedConversation.avatarUrl}
                        alt={selectedConversation.name || "Group"}
                        type="group-avatar"
                        name={selectedConversation.name || "Group"}
                        className="rounded-circle"
                      />
                      {onlineMembersCount > 0 && (
                        <span
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                          style={{ width: "16px", height: "16px" }}
                        />
                      )}
                    </div>
                    <h6 className="fw-semibold">
                      {selectedConversation.name || "Nhóm không tên"}
                    </h6>
                    <p className="text-muted">
                      Nhóm · {members.length} thành viên
                    </p>
                  </>
                )}
              </div>

              {/* Group Description */}
              {selectedConversation.description && (
                <div className="content-wrapper">
                  <h5 className="sub-title">
                    Mô tả nhóm
                  </h5>
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <p className="mb-0">{selectedConversation.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members List - Collapsible Accordion */}
              <div className="content-wrapper">
                <h5 className="sub-title">Thành viên</h5>
                <div className="card">
                  <div className="card-body">
                    <div className="accordion" id="membersAccordion">
                      <div className="accordion-item border-0">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button"
                            data-bs-toggle="collapse"
                            data-bs-target="#members-list"
                            aria-expanded="true"
                            aria-controls="members-list"
                          >
                            <i className="ti ti-users me-2" />
                            Thành viên nhóm ({members.length})
                          </Link>
                        </h2>
                        <div
                          id="members-list"
                          className="accordion-collapse collapse show"
                          data-bs-parent="#membersAccordion"
                        >
                          <div className="accordion-body p-0">
                            {isLoadingMembers ? (
                              <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" />
                                <p className="text-muted small mt-2">Đang tải thành viên...</p>
                              </div>
                            ) : members.length === 0 ? (
                              <div className="text-center py-4">
                                <i className="ti ti-users-off fs-1 text-muted" />
                                <p className="text-muted small mt-2">Chưa có thành viên nào</p>
                              </div>
                            ) : (
                              <>
                                <ul className="list-group list-group-flush">
                                  {/* Show only first 5 members */}
                                  {members.slice(0, 5).map((member) => (
                                    <li
                                      key={member.id}
                                      className="list-group-item d-flex align-items-center"
                                    >
                                      <div className="avatar avatar-md me-2 position-relative">
                                        <img
                                          src={member.avatarUrl || '/assets/img/profiles/avatar-01.jpg'}
                                          alt={member.name}
                                          className="rounded-circle"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/assets/img/profiles/avatar-01.jpg';
                                          }}
                                        />
                                        {member.isOnline && (
                                          <span className="avatar-status online" />
                                        )}
                                      </div>
                                      <div className="flex-grow-1 overflow-hidden">
                                        <h6 className="mb-0 text-truncate">
                                          {member.name}
                                          {member.userId === currentUserId && (
                                            <span className="badge bg-primary-transparent text-primary ms-2 small">
                                              Bạn
                                            </span>
                                          )}
                                        </h6>
                                        <p className="text-muted small mb-0">
                                          {checkIsAdmin(member.userId) ? (
                                            <span className="badge bg-warning-transparent text-warning">
                                              <i className="ti ti-crown me-1" />
                                              Quản trị viên
                                            </span>
                                          ) : (
                                            <span className="text-muted">Thành viên</span>
                                          )}
                                        </p>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                                {/* View All Button */}
                                <div className="text-center py-3 border-top">
                                  <Link
                                    to="#"
                                    className="text-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view-all-members"
                                  >
                                    Xem tất cả ({members.length})
                                  </Link>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Gallery - Collapsible Accordion */}
              <div className="content-wrapper">
                <h5 className="sub-title">Ảnh/File</h5>
                <div className="chat-file">
                  <div className="file-item">
                    <div className="accordion accordion-flush chat-accordion" id="mediafile">
                      {/* Images Section */}
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#media-images"
                            aria-expanded="false"
                            aria-controls="media-images"
                          >
                            <i className="ti ti-photo-shield me-2" />
                            Ảnh {totalImages > 0 && `(${totalImages})`}
                          </Link>
                        </h2>
                        <div
                          id="media-images"
                          className="accordion-collapse collapse"
                          data-bs-parent="#mediaAccordion"
                        >
                          <div className="accordion-body">
                            <MediaGallery
                              conversationId={selectedConversation.id}
                              type="IMAGE"
                              autoRefreshMs={60000}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Files Section */}
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#media-files"
                            aria-expanded="false"
                            aria-controls="media-files"
                          >
                            <i className="ti ti-file me-2" />
                            File {totalFiles > 0 && `(${totalFiles})`}
                          </Link>
                        </h2>
                        <div
                          id="media-files"
                          className="accordion-collapse collapse"
                          data-bs-parent="#mediaAccordion"
                        >
                          <div className="accordion-body">
                            <MediaGallery
                              conversationId={selectedConversation.id}
                              type="FILE"
                              autoRefreshMs={60000}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Settings */}
              <div className="content-wrapper other-info">
                <h5 className="sub-title">Cài đặt</h5>
                <div className="card mb-0">
                  <div className="card-body list-group profile-item">
                    {/*<Link to="#" className="list-group-item">*/}
                    {/*  <div className="profile-info">*/}
                    {/*    <h6>*/}
                    {/*      <i className="ti ti-pin me-2 text-info" />*/}
                    {/*      Ghim cuộc trò chuyện*/}
                    {/*    </h6>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <div className="form-check form-switch">*/}
                    {/*      <input*/}
                    {/*        className="form-check-input"*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={selectedConversation.pinned}*/}
                    {/*        readOnly*/}
                    {/*      />*/}
                    {/*    </div>*/}
                    {/*  </div>*/}
                    {/*</Link>*/}
                    {isAdmin && (
                      <>
                        <Link
                          to="#"
                          className="list-group-item"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('🎯 [GroupInfo] Opening EditGroupModal with:', {
                              groupId,
                              selectedConversation: {
                                id: selectedConversation?.id,
                                type: selectedConversation?.type,
                                groupId: selectedConversation?.groupId,
                                name: selectedConversation?.name,
                              },
                              isGroupConversation,
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <div className="profile-info">
                            <h6>
                              <i className="ti ti-edit me-2 text-primary" />
                              Chỉnh sửa thông tin nhóm
                            </h6>
                          </div>
                          <div>
                            <span className="link-icon">
                              <i className="ti ti-chevron-right" />
                            </span>
                          </div>
                        </Link>
                        <Link
                          to="#"
                          className="list-group-item"
                          data-bs-toggle="modal"
                          data-bs-target="#add-group-member"
                        >
                          <div className="profile-info">
                            <h6>
                              <i className="ti ti-user-plus me-2 text-success" />
                              Thêm thành viên
                            </h6>
                          </div>
                          <div>
                            <span className="link-icon">
                              <i className="ti ti-chevron-right" />
                            </span>
                          </div>
                        </Link>
                      </>
                    )}
                    <Link
                      to="#"
                      className="list-group-item"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowReportModal(true);
                        // Open modal using Bootstrap
                        setTimeout(() => {
                          const modalElement = document.getElementById('report-group-modal');
                          if (modalElement) {
                            const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
                            if (bsModal) {
                              bsModal.show();
                            } else {
                              // Create new modal instance if doesn't exist
                              const Modal = (window as any).bootstrap?.Modal;
                              if (Modal) {
                                const newModal = new Modal(modalElement);
                                newModal.show();
                              }
                            }
                          }
                        }, 100);
                      }}
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-flag me-2 text-purple" />
                          Báo cáo nhóm
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#leave-group"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-logout me-2 text-danger" />
                          Rời khỏi nhóm
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Group Info */}

      {/* View All Members Modal */}
      <div className="modal fade" id="view-all-members">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                Thành viên nhóm ({members.length})
              </h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {/* Search Members */}
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-transparent">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm thành viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setSearchQuery("")}
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>
              </div>

              {/* Add Member Button (Admin only) */}
              {isAdmin && (
                <div className="mb-3">
                  <Link
                    to="#"
                    className="btn btn-primary w-100"
                    data-bs-toggle="modal"
                    data-bs-target="#add-group-member"
                  >
                    <i className="ti ti-user-plus me-2" />
                    Thêm thành viên
                  </Link>
                </div>
              )}

              {/* Members List */}
              <div className="members-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {isLoadingMembers ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" />
                    <p className="text-muted mt-2">Đang tải thành viên...</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="ti ti-users-off fs-1 text-muted" />
                    <p className="text-muted mt-2">
                      {searchQuery
                        ? "Không tìm thấy thành viên"
                        : "Chưa có thành viên nào"}
                    </p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {filteredMembers.map((member) => (
                      <li
                        key={member.id}
                        className="list-group-item d-flex align-items-center px-0"
                      >
                        <div className="avatar avatar-md me-3 position-relative">
                          <ImageFallback
                            src={member.avatarUrl}
                            alt={member.name}
                            type="avatar"
                            name={member.name}
                            className="rounded-circle"
                          />
                          {member.isOnline && (
                            <span className="avatar-status online" />
                          )}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="mb-0 text-truncate">
                            {member.name}
                            {member.userId === currentUserId && (
                              <span className="badge bg-primary-transparent text-primary ms-2 small">
                                Bạn
                              </span>
                            )}
                          </h6>
                          <p className="text-muted small mb-0">
                            {member.role === "ROLE_ADMIN" ? (
                              <span className="badge bg-warning-transparent text-warning">
                                <i className="ti ti-crown me-1" />
                                Quản trị viên
                              </span>
                            ) : (
                              <span className="text-muted">Thành viên</span>
                            )}
                          </p>
                        </div>
                        {/* Member Actions - Admin only */}
                        {isAdmin && member.userId !== currentUserId && (
                          <div className="dropdown">
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical" />
                            </Link>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <Link to="#" className="dropdown-item">
                                  <i className="ti ti-message me-2" />
                                  Nhắn tin
                                </Link>
                              </li>
                              <li>
                                <Link to="#" className="dropdown-item">
                                  <i className="ti ti-user-check me-2" />
                                  Xem profile
                                </Link>
                              </li>
                              <li>
                                <hr className="dropdown-divider" />
                              </li>
                              {member.role !== "ROLE_ADMIN" && (
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item text-warning"
                                  >
                                    <i className="ti ti-crown me-2" />
                                    Chỉ định làm admin
                                  </Link>
                                </li>
                              )}
                              <li>
                                <Link
                                  to="#"
                                  className="dropdown-item text-danger"
                                >
                                  <i className="ti ti-user-x me-2" />
                                  Xóa khỏi nhóm
                                </Link>
                              </li>
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /View All Members Modal */}

      {/* Report Group Modal */}
      {showReportModal && selectedConversation?.adminId && (
        <ReportFormModal
          modalId="report-group-modal"
          targetUserId={selectedConversation.adminId}
          targetUserName={selectedConversation.name || 'Nhóm'}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Edit Group Modal */}
      <EditGroupModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        groupId={groupId}
        onUpdate={handleUpdateGroup}
      />
    </>
  );
};

export default GroupInfo;

