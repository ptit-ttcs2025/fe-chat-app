/**
 * Group Chat Header Component
 * Hiển thị thông tin nhóm và action buttons
 */

import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import ImageWithBasePath from "@/core/common/imageWithBasePath";
import { all_routes } from "@/feature-module/router/all_routes";
import type { IConversation } from "@/apis/chat/chat.type";
import type { IGroup, IGroupMember } from "@/apis/group/group.type";

interface GroupChatHeaderProps {
  conversation: IConversation | null;
  group: IGroup | undefined | null;
  members: IGroupMember[];
  onlineMembersCount: number;
  onToggleSearch?: () => void; // Deprecated, kept for backward compatibility
  onShowEditGroup: () => void;
  onLeaveGroup?: () => void; // Optional for backward compatibility with chat.tsx
  isAdmin: boolean;
  showSearch?: boolean; // Deprecated
  searchKeyword?: string; // Deprecated
  onSearchChange?: (keyword: string) => void; // Deprecated
}

const GroupChatHeader = ({
  conversation,
  group,
  members,
  onlineMembersCount,
  onToggleSearch,
  onShowEditGroup,
  onLeaveGroup,
  isAdmin,
  showSearch,
  searchKeyword,
  onSearchChange,
}: GroupChatHeaderProps) => {
  const routes = all_routes;

  if (!conversation && !group) {
    return (
      <div className="chat-header">
        <div className="user-details">
          <div className="d-xl-none">
            <Link className="text-muted chat-close me-2" to="#">
              <i className="fas fa-arrow-left" />
            </Link>
          </div>
          <div className="ms-2">
            <h6>Chọn một nhóm để bắt đầu trò chuyện</h6>
          </div>
        </div>
      </div>
    );
  }

  const groupName = group?.name || conversation?.name || "Group Chat";
  const groupAvatar =
    group?.avatarUrl ||
    conversation?.avatarUrl ||
    "assets/img/avatar/avatar-default-group.png";
  const totalMembers = members.length;

  return (
    <>
      <div className="chat-header">
        <div className="user-details">
          <div className="d-xl-none">
            <Link className="text-muted chat-close me-2" to="#">
              <i className="fas fa-arrow-left" />
            </Link>
          </div>
          <div className="avatar avatar-lg online flex-shrink-0">
            <ImageWithBasePath
              src={groupAvatar}
              className="rounded-circle"
              alt={groupName}
            />
          </div>
          <div className="ms-2 overflow-hidden">
            <h6>{groupName}</h6>
            <p className="last-seen text-truncate">
              {totalMembers} thành viên
                {/*,{" "}*/}
              {/*<span className="text-success">{onlineMembersCount} trực tuyến</span>*/}
            </p>
          </div>
        </div>
        <div className="chat-options">
          <ul>
            <li>
              <div className="avatar-list-stacked avatar-group-md d-flex">
                {members.slice(0, 4).map((member) => (
                  <span key={member.id} className="avatar avatar-rounded">
                    <ImageWithBasePath
                      src={
                        member.avatarUrl ||
                        "assets/img/avatar/avatar-default.png"
                      }
                      alt={member.displayName}
                    />
                  </span>
                ))}
                {totalMembers > 4 && (
                  <Link
                    className="avatar bg-primary avatar-rounded text-fixed-white"
                    to="#"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#contact-profile"
                  >
                    {totalMembers - 4}+
                  </Link>
                )}
              </div>
            </li>
            <li>
              <Tooltip title="Tìm kiếm" placement="bottom">
                <Link
                  to="#"
                  className="btn chat-search-btn"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#chat-search-sidebar"
                >
                  <i className="ti ti-search" />
                </Link>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Thông tin nhóm" placement="bottom">
                <Link
                  to="#"
                  className="btn position-relative"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#contact-profile"
                >
                  <i className="ti ti-info-circle" />
                </Link>
              </Tooltip>
            </li>
            <li>
              <Link className="btn no-bg" to="#" data-bs-toggle="dropdown">
                <i className="ti ti-dots-vertical" />
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                {isAdmin && (
                  <>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-group"
                      >
                        <i className="ti ti-edit me-2" />
                        Chỉnh sửa nhóm
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item"
                        data-bs-toggle="modal"
                        data-bs-target="#group-info"
                      >
                        <i className="ti ti-users me-2" />
                        Quản lý thành viên
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                  </>
                )}
                <li>
                  <Link to={routes.index} className="dropdown-item">
                    <i className="ti ti-x me-2" />
                    Đóng nhóm
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="dropdown-item text-danger"
                    onClick={(e) => {
                      e.preventDefault();
                      onLeaveGroup?.();
                    }}
                  >
                    <i className="ti ti-logout me-2" />
                    {isAdmin ? "Xóa nhóm" : "Rời nhóm"}
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        {/* Chat Search */}
        <div
          className={`chat-search search-wrap contact-search ${
            showSearch ? "visible-chat" : ""
          }`}
        >
          <form>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm tin nhắn"
                value={searchKeyword}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <span className="input-group-text">
                <i className="ti ti-search" />
              </span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GroupChatHeader;

