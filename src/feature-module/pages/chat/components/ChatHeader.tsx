import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { all_routes } from "../../../router/all_routes";
import Avatar from "./Avatar";
import type { IConversation } from "@/apis/chat/chat.type";

interface ChatHeaderProps {
  selectedConversation: IConversation | null;
  onToggleSearch: () => void;
}

const ChatHeader = ({ selectedConversation, onToggleSearch }: ChatHeaderProps) => {
  const getConversationName = (conversation: IConversation) => {
    return conversation.name || "Cuộc trò chuyện";
  };

  const getConversationAvatar = (conversation: IConversation) => {
    return conversation.avatarUrl;
  };

  return (
    <div className="chat-header">
      <div className="user-details">
        <div className="d-xl-none">
          <Link className="text-muted chat-close me-2" to="#">
            <i className="fas fa-arrow-left" />
          </Link>
        </div>

        {selectedConversation ? (
          <>
            <div className="avatar avatar-lg online flex-shrink-0">
              <Avatar
                src={getConversationAvatar(selectedConversation)}
                name={getConversationName(selectedConversation)}
                className="rounded-circle"
              />
            </div>
            <div className="ms-2 overflow-hidden flex-grow-1">
              <h6 className="text-truncate mb-0" style={{ maxWidth: "200px" }}>
                {getConversationName(selectedConversation)}
              </h6>
              <span className="last-seen">Online</span>
            </div>
          </>
        ) : (
          <>
            <div className="avatar avatar-lg flex-shrink-0">
              <Avatar name="Select chat" className="rounded-circle" />
            </div>
            <div className="ms-2 overflow-hidden">
              <h6>Chọn cuộc trò chuyện</h6>
              <span className="last-seen">Bắt đầu nhắn tin</span>
            </div>
          </>
        )}
      </div>

      <div className="chat-options">
        <ul>
          <li>
            <Tooltip title="Tìm kiếm" placement="bottom">
              <Link
                to="#"
                className="btn chat-search-btn"
                onClick={onToggleSearch}
              >
                <i className="ti ti-search" />
              </Link>
            </Tooltip>
          </li>
          <li>
            <Tooltip title="Video Call" placement="bottom">
              <Link
                to="#"
                className="btn"
                data-bs-toggle="modal"
                data-bs-target="#video-call"
              >
                <i className="ti ti-video" />
              </Link>
            </Tooltip>
          </li>
          <li>
            <Tooltip title="Voice Call" placement="bottom">
              <Link
                to="#"
                className="btn"
                data-bs-toggle="modal"
                data-bs-target="#voice_call"
              >
                <i className="ti ti-phone" />
              </Link>
            </Tooltip>
          </li>
          <li>
            <Tooltip title="Thông tin liên hệ" placement="bottom">
              <Link
                to="#"
                className="btn"
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
              <li>
                <Link to={all_routes.dashboard} className="dropdown-item">
                  <i className="ti ti-x me-2" />
                  Đóng Chat
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item"
                  data-bs-toggle="modal"
                  data-bs-target="#mute-notification"
                >
                  <i className="ti ti-volume-off me-2" />
                  Tắt thông báo
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  className="dropdown-item"
                  data-bs-toggle="modal"
                  data-bs-target="#clear-chat"
                >
                  <i className="ti ti-clear-all me-2" />
                  Xóa tin nhắn
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ChatHeader;
