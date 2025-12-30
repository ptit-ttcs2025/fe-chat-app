import {useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "yet-another-react-lightbox/styles.css";
import ImageWithBasePath from "../common/imageWithBasePath";
import { useGetUserById } from "@/apis/user/user.api";
import { getConversation } from "@/apis/chat/chat.api";
import { IConversation } from "@/apis/chat/chat.type";
import { useMediaMessages } from "@/hooks/useMediaMessages";
import { NicknameEditor } from "@/components/NicknameEditor";
import { useFriendNicknameWebSocket } from "@/hooks/useFriendNicknameWebSocket";
import MediaGallery from "@/feature-module/chat/components/MediaGallery";
import ReportFormModal from "./report-form-modal";

interface ContactInfoProps {
  selectedConversation: IConversation | null;
}

const ContactInfo = ({ selectedConversation }: ContactInfoProps) => {
  // Subscribe to friend nickname updates via WebSocket
  useFriendNicknameWebSocket(true);

  // State for report modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Helper function to check if conversation is 1-1 (ONE_TO_ONE or PRIVATE)
  const isOneToOneConversation = (type?: string) => {
    return type === "ONE_TO_ONE" || type === "PRIVATE";
  };

  // ✅ Fetch full conversation detail to get peerUserId from backend
  const {
    data: conversationDetailResponse,
    isLoading: loadingConversationDetail,
  } = useQuery({
    queryKey: ['conversation-detail', selectedConversation?.id],
    queryFn: () => getConversation(selectedConversation!.id),
    enabled: !!selectedConversation?.id && isOneToOneConversation(selectedConversation?.type),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  // Extract conversation detail from API response
  const conversationDetail = useMemo(() => {
    if (!conversationDetailResponse) return null;

    const data = conversationDetailResponse as any;

    // Handle response format: { data: { ... } }
    if (data.data) {
      return data.data as IConversation;
    }

    // Handle direct response format
    if (data.id && data.type) {
      return data as IConversation;
    }

    return null;
  }, [conversationDetailResponse]);

  // ✅ Get current user ID from localStorage
  const currentUserId = useMemo(() => {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.userId || null;
      }
    } catch (error) {
      console.error('❌ Failed to get current user ID:', error);
    }
    return null;
  }, []);

  // ✨ OPTIMIZED: Get peerUserId with priority order
  const peerUserId = useMemo(() => {
    if (!selectedConversation || !isOneToOneConversation(selectedConversation.type)) {
      return null;
    }

    // Priority 1: Use peerUserId from conversation detail API (MOST RELIABLE!)
    if (conversationDetail?.peerUserId) {
      return conversationDetail.peerUserId;
    }

    // Priority 2: Use peerUserId from conversation list (if backend added it)
    if (selectedConversation.peerUserId) {
      return selectedConversation.peerUserId;
    }

    // Fallback 3: Extract from lastMessage.senderId
    if (selectedConversation.lastMessage?.senderId && currentUserId) {
      const senderId = selectedConversation.lastMessage.senderId;
      if (senderId !== currentUserId) {
        return senderId;
      }
    }

    // Cannot determine peer user ID
    return null;
  }, [selectedConversation, conversationDetail, currentUserId]);

  // Lấy thông tin peer user từ api
  const {
    data: peerProfile,
    isLoading: loadingPeer,
    error,
  } = useGetUserById(peerUserId || "", !!peerUserId);

  // ✅ Combined loading state
  const isLoadingData = loadingConversationDetail || loadingPeer;

  // Lấy ảnh từ conversation - DISABLED: API không có sẵn
  const {
    isLoading: loadingImages,
    totalCount: totalImages,
  } = useMediaMessages({
    conversationId: selectedConversation?.id || null,
    type: "IMAGE",
    pageSize: 12,
    enabled: false, // Disabled vì API không có sẵn
  });

  // Lấy files từ conversation - DISABLED: API không có sẵn
  const {
    isLoading: loadingFiles,
    totalCount: totalFiles,
  } = useMediaMessages({
    conversationId: selectedConversation?.id || null,
    type: "FILE",
    pageSize: 10,
    enabled: false, // Disabled vì API không có sẵn
  });

  // // Prepare lightbox slides
  // images.map((img) => ({
  //   src: img.attachment.url.startsWith("http")
  //     ? img.attachment.url
  //     : `${import.meta.env.VITE_IMG_PATH || ""}${img.attachment.url}`,
  // }));

  return (
    <>
      {/* Contact Info */}
      <div
        className="chat-offcanvas offcanvas offcanvas-end"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabIndex={-1}
        id="contact-profile"
        aria-labelledby="chatUserMoreLabel"
      >
        <div className="offcanvas-header">
          <h4 className="offcanvas-title" id="chatUserMoreLabel">
            Thông tin liên hệ
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
              <div className="contact-profile-info">
                {isLoadingData ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted mt-2">Đang tải thông tin...</p>
                  </div>
                ) : !selectedConversation ? (
                  <div className="text-center py-5">
                    <i
                      className="ti ti-user-off"
                      style={{ fontSize: "60px", color: "#dee2e6" }}
                    ></i>
                    <p className="text-muted mt-2">Không thể tải thông tin</p>
                  </div>
                ) : error || !peerProfile ? (
                  <div className="text-center py-5">
                    <i
                      className="ti ti-alert-circle"
                      style={{ fontSize: "60px", color: "#ff4d4f" }}
                    ></i>
                    <p className="text-danger mt-2">
                      {!peerUserId
                        ? "Không thể xác định người dùng"
                        : "Không thể tải thông tin"}
                    </p>
                    {!peerUserId && (
                      <p className="text-muted small mt-2">
                        Backend cần thêm field "peerUserId" vào conversation response
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="avatar avatar-xxl mb-2">
                      <ImageWithBasePath
                        src={
                          peerProfile.avatarUrl ||
                          "assets/img/profiles/avatar-06.jpg"
                        }
                        className="rounded-circle"
                        alt={peerProfile.fullName}
                      />
                    </div>
                    <h6>{peerProfile.fullName || "—"}</h6>
                    <p className="text-muted small">
                      {peerProfile.email || ""}
                    </p>
                  </>
                )}
              </div>
              {/* <div className="row gx-3">
            <div className="col">
              <Link to="#" className="action-wrap">
                <i className="ti ti-phone" />
                <p>Audio</p>
              </Link>
            </div>
            <div className="col">
              <Link to="#" className="action-wrap">
                <i className="ti ti-video" />
                <p>Video</p>
              </Link>
            </div>
            <div className="col">
              <Link to="#" className="action-wrap">
                <i className="ti ti-brand-hipchat" />
                <p>Chat</p>
              </Link>
            </div>
            <div className="col">
              <Link to="#" className="action-wrap">
                <i className="ti ti-search" />
                <p>Search</p>
              </Link>
            </div>
          </div> */}
              <div className="content-wrapper">
                <h5 className="sub-title">Thông tin</h5>
                <div className="card">
                  <div className="card-body">
                    {!peerProfile ? (
                      <div className="text-center py-3">
                        <p className="text-muted">
                          Không thể tải thông tin người dùng
                        </p>
                      </div>
                    ) : (
                      <ul className="list-group profile-item">
                        <li className="list-group-item">
                          <div className="info">
                            <h6>Tên người dùng</h6>
                            <p>{peerProfile.fullName || "_"}</p>
                          </div>
                          <div className="profile-icon">
                            <i className="ti ti-user-circle" />
                          </div>
                        </li>
                        <li className="list-group-item">
                          <div className="info">
                            <h6>Email</h6>
                            <p>{peerProfile.email || "_"}</p>
                          </div>
                          <div className="icon">
                            <i className="ti ti-mail-heart" />
                          </div>
                        </li>
                        <li className="list-group-item">
                          <div className="info">
                            <h6>Mô tả</h6>
                            <p>{peerProfile.bio || "_"}</p>
                          </div>
                          <div className="icon">
                            <i className="ti ti-user-check" />
                          </div>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              {/* ✨ NEW: Nickname Editor Section - chỉ hiện với 1-1 conversation */}
              {isOneToOneConversation(selectedConversation?.type) && peerUserId && peerProfile && (
                <div className="content-wrapper">
                  <h5 className="sub-title">
                    Biệt danh
                  </h5>
                  <div className="card">
                    <div className="card-body">
                      <NicknameEditor
                        friendId={peerUserId}
                        currentName={selectedConversation.name || peerProfile.fullName}
                        fullName={peerProfile.fullName}
                        onUpdate={(newName) => {
                          console.log('✅ Nickname updated in sidebar:', newName);
                          // Query will auto-refetch via invalidation
                        }}
                      />
                      <p className="text-muted small mt-2 mb-0">
                        <i className="ti ti-info-circle me-1" />
                        Biệt danh chỉ bạn nhìn thấy và sẽ hiển thị trong danh sách bạn bè và hội thoại.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* <div className="content-wrapper">
            <h5 className="sub-title">Social Profiles</h5>
            <div className="card">
              <div className="card-body">
                <div className="social-icon">
                  <Link to="#">
                    <i className="ti ti-brand-facebook" />
                  </Link>
                  <Link to="#">
                    <i className="ti ti-brand-twitter" />
                  </Link>
                  <Link to="#">
                    <i className="ti ti-brand-instagram" />
                  </Link>
                  <Link to="#">
                    <i className="ti ti-brand-linkedin" />
                  </Link>
                </div>
              </div>
            </div>
          </div> */}
              <div className="content-wrapper">
                <h5 className="sub-title">Ảnh/File</h5>
                <div className="chat-file">
                  <div className="file-item">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="mediafile"
                    >
                      {/* Ảnh Section */}
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#chatuser-collapse1"
                            aria-expanded="false"
                            aria-controls="chatuser-collapse1"
                          >
                            <i className="ti ti-photo-shield me-2" />
                            Ảnh {totalImages > 0 && `(${totalImages})`}
                          </Link>
                        </h2>
                        <div
                          id="chatuser-collapse1"
                          className="accordion-collapse collapse"
                          data-bs-parent="#mediafile"
                        >
                          <div className="accordion-body">
                            {loadingImages ? (
                              <div className="text-center py-3">
                                <div
                                  className="spinner-border spinner-border-sm text-primary"
                                  role="status"
                                >
                                  <span className="visually-hidden">Đang tải...</span>
                                </div>
                              </div>
                            ) : (
                              // Day-grouped gallery with WebSocket auto-refresh + pull-to-refresh
                              <MediaGallery
                                conversationId={selectedConversation?.id || ""}
                                type="IMAGE"
                                autoRefreshMs={60000}
                                className="mt-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Tài liệu Section */}
                      <div className="accordion-item">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#media-document"
                            aria-expanded="false"
                            aria-controls="media-document"
                          >
                            <i className="ti ti-file me-2" />
                            File {totalFiles > 0 && `(${totalFiles})`}
                          </Link>
                        </h2>
                        <div
                          id="media-document"
                          className="accordion-collapse collapse"
                          data-bs-parent="#mediafile"
                        >
                          <div className="accordion-body">
                            {loadingFiles ? (
                              <div className="text-center py-3">
                                <div
                                  className="spinner-border spinner-border-sm text-primary"
                                  role="status"
                                >
                                  <span className="visually-hidden">Đang tải...</span>
                                </div>
                              </div>
                            ) : (
                              // Day-grouped gallery with WebSocket auto-refresh + pull-to-refresh
                              <MediaGallery
                                conversationId={selectedConversation?.id || ""}
                                type="FILE"
                                autoRefreshMs={60000}
                                className="mt-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Video Section - Placeholder */}
                      {/* <div className="accordion-item">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#media-video"
                            aria-expanded="false"
                            aria-controls="media-video"
                          >
                            <i className="ti ti-video me-2" />
                            Video
                          </Link>
                        </h2>
                        <div
                          id="media-video"
                          className="accordion-collapse collapse"
                          data-bs-parent="#mediafile"
                        >
                          <div className="accordion-body">
                            <div className="chat-video">
                              <Link
                                to="#"
                                data-fancybox=""
                                className="fancybox video-img"
                                onClick={handleOpenModal}
                              >
                                <img
                                  src="assets/img/video/video.jpg"
                                  alt="img"
                                />
                                <span>
                                  <i className="ti ti-player-play-filled" />
                                </span>
                              </Link>
                            </div>
                            <VideoModal
                              show={showModal}
                              handleClose={handleCloseModal}
                              videoUrl={
                                "https://www.w3schools.com/html/mov_bbb.mp4"
                              }
                            />
                          </div>
                        </div>
                      </div> */}

                      {/* Link Section*/}
                      {/*<div className="accordion-item">*/}
                      {/*  <h2 className="accordion-header">*/}
                      {/*    <Link*/}
                      {/*      to="#"*/}
                      {/*      className="accordion-button collapsed"*/}
                      {/*      data-bs-toggle="collapse"*/}
                      {/*      data-bs-target="#media-links"*/}
                      {/*      aria-expanded="false"*/}
                      {/*      aria-controls="media-links"*/}
                      {/*    >*/}
                      {/*      <i className="ti ti-unlink me-2" />*/}
                      {/*      Link*/}
                      {/*    </Link>*/}
                      {/*  </h2>*/}
                      {/*  <div*/}
                      {/*    id="media-links"*/}
                      {/*    className="accordion-collapse collapse"*/}
                      {/*    data-bs-parent="#mediafile"*/}
                      {/*  >*/}
                      {/*    <div className="accordion-body">*/}
                      {/*      <div className="link-item">*/}
                      {/*        <span className="link-icon">*/}
                      {/*          <img*/}
                      {/*            src="assets/img/icons/github-icon.svg"*/}
                      {/*            alt="icon"*/}
                      {/*          />*/}
                      {/*        </span>*/}
                      {/*        <div className="ms-2">*/}
                      {/*          <p>https://segmentfault.com/u/ans</p>*/}
                      {/*        </div>*/}
                      {/*      </div>*/}
                      {/*      <div className="link-item">*/}
                      {/*        <span className="link-icon">*/}
                      {/*          <img*/}
                      {/*            src="assets/img/icons/info-icon.svg"*/}
                      {/*            alt="icon"*/}
                      {/*          />*/}
                      {/*        </span>*/}
                      {/*        <div className="ms-2">*/}
                      {/*          <p>https://segmentfault.com/u/ans</p>*/}
                      {/*        </div>*/}
                      {/*      </div>*/}
                      {/*    </div>*/}
                      {/*  </div>*/}
                      {/*</div>*/}
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="content-wrapper other-info">
                <h5 className="sub-title">Common in 4 Groups</h5>
                <div className="card">
                  <div className="card-body list-group profile-item">
                    <Link to="#" className="list-group-item">
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-lg bg-skyblue rounded-circle me-2">
                          GU
                        </div>
                        <div className="chat-user-info">
                          <h6>Gustov _family</h6>
                          <p>
                            Mark, Elizabeth, Aaron,{" "}
                            <span className="text-primary">More...</span>
                          </p>
                        </div>
                      </div>
                      <span className="link-icon">
                        <i className="ti ti-chevron-right" />
                      </span>
                    </Link>
                    <Link to="#" className="list-group-item border-0">
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-lg bg-info rounded-circle me-2">
                          AM
                        </div>
                        <div className="chat-user-info">
                          <h6>AM Technology</h6>
                          <p>
                            Roper, Deborah, David,{" "}
                            <span className="text-primary">More.. .</span>
                          </p>
                        </div>
                      </div>
                      <span className="link-icon">
                        <i className="ti ti-chevron-right" />
                      </span>
                    </Link>
                    <div className="text-center">
                      <Link
                        to="#"
                        className="view-all link-primary d-inline-flex align-items-center justify-content-center"
                      >
                        More Groups
                        <i className="ti ti-arrow-right ms-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div> */}
              <div className="content-wrapper other-info mb-0">
                <h5 className="sub-title">Cài đặt</h5>
                <div className="card mb-0">
                  <div className="card-body list-group profile-item">
                    {/*<Link*/}
                    {/*  to="#"*/}
                    {/*  className="list-group-item"*/}
                    {/*  data-bs-toggle="offcanvas"*/}
                    {/*  data-bs-target="#contact-favourite"*/}
                    {/*>*/}
                    {/*  <div className="profile-info">*/}
                    {/*    <h6>*/}
                    {/*      <i className="ti ti-graph me-2 text-default" />*/}
                    {/*      Yêu thích*/}
                    {/*    </h6>*/}
                    {/*  </div>*/}
                    {/*  <div className="d-flex align-items-center">*/}
                    {/*    <span className="badge badge-danger count-message me-1">*/}
                    {/*      12*/}
                    {/*    </span>*/}
                    {/*    <span className="link-icon">*/}
                    {/*      <i className="ti ti-chevron-right" />*/}
                    {/*    </span>*/}
                    {/*  </div>*/}
                    {/*</Link>*/}
                    {/*<Link to="#" className="list-group-item">*/}
                    {/*  <div className="profile-info">*/}
                    {/*    <h6>*/}
                    {/*      <i className="ti ti-volume-off me-2 text-warning" />*/}
                    {/*      Tắt thông báo*/}
                    {/*    </h6>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <span className="link-icon">*/}
                    {/*      <i className="ti ti-chevron-right" />*/}
                    {/*    </span>*/}
                    {/*  </div>*/}
                    {/*</Link>*/}
                    {/*<Link to="#" className="list-group-item">*/}
                    {/*  <div className="profile-info">*/}
                    {/*    <h6>*/}
                    {/*      <i className="ti ti-user-off me-2 text-info" />*/}
                    {/*      Chặn người dùng*/}
                    {/*    </h6>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <span className="link-icon">*/}
                    {/*      <i className="ti ti-chevron-right" />*/}
                    {/*    </span>*/}
                    {/*  </div>*/}
                    {/*</Link>*/}
                    <Link
                      to="#"
                      className="list-group-item"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowReportModal(true);
                        // Open modal using Bootstrap
                        setTimeout(() => {
                          const modalElement = document.getElementById('report-user-modal');
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
                          <i className="ti ti-user-x me-2 text-purple" />
                          Báo cáo người dùng
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    {/*<Link*/}
                    {/*  to="#"*/}
                    {/*  data-bs-toggle="modal"*/}
                    {/*  data-bs-target="#delete-chat"*/}
                    {/*  className="list-group-item"*/}
                    {/*>*/}
                    {/*  <div className="profile-info">*/}
                    {/*    <h6>*/}
                    {/*      <i className="ti ti-trash me-2 text-danger" />*/}
                    {/*      Xóa cuộc trò chuyện*/}
                    {/*    </h6>*/}
                    {/*  </div>*/}
                    {/*  <div>*/}
                    {/*    <span className="link-icon">*/}
                    {/*      <i className="ti ti-chevron-right" />*/}
                    {/*    </span>*/}
                    {/*  </div>*/}
                    {/*</Link>*/}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Contact Info */}

      {/* Report User Modal */}
      {showReportModal && peerUserId && (
        <ReportFormModal
          modalId="report-user-modal"
          targetUserId={peerUserId}
          targetUserName={peerProfile?.fullName || selectedConversation?.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
};

export default ContactInfo;
