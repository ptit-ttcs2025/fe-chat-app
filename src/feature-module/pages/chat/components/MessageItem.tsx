import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import Avatar from "./Avatar";
import DateMarker from "./DateMarker";

interface MessageItemProps {
  message: IMessage;
  previousMessage: IMessage | null;
  isOwnMessage: boolean;
  currentUserId?: string;
  userAvatarUrl?: string;
  userFullName?: string;
  userUsername?: string;
  selectedConversation: IConversation | null;
  onTogglePin: (messageId: string, currentlyPinned: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb >= 1024) {
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }
  return `${kb.toFixed(1)} KB`;
};

const shouldShowDateMarker = (
  currentMessage: IMessage,
  previousMessage: IMessage | null
): boolean => {
  if (!previousMessage) return true; // Tin nhắn đầu tiên

  const currentDate = new Date(currentMessage.createdAt);
  const previousDate = new Date(previousMessage.createdAt);

  // So sánh ngày (không tính giờ)
  const currentDateOnly = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const previousDateOnly = new Date(
    previousDate.getFullYear(),
    previousDate.getMonth(),
    previousDate.getDate()
  );

  return currentDateOnly.getTime() !== previousDateOnly.getTime();
};

const MessageItem = ({
  message,
  previousMessage,
  isOwnMessage,
  userAvatarUrl,
  userFullName,
  userUsername,
  onTogglePin,
  onDeleteMessage,
}: MessageItemProps) => {
  const showDateMarker = shouldShowDateMarker(message, previousMessage);

  // ✅ Render status icon
  const renderStatusIcon = () => {
    if (!isOwnMessage || !message.status) return null;

    const iconStyle = {
      marginLeft: "4px",
      fontSize: "14px",
    };

    switch (message.status) {
      case "sending":
        return (
          <i
            className="ti ti-loader"
            style={{
              ...iconStyle,
              color: "#3b82f6",
              animation: "spin 1s linear infinite",
            }}
            title="Đang gửi..."
          />
        );
      case "sent":
        return (
          <i
            className="ti ti-check"
            style={{ ...iconStyle, color: "#10b981" }}
            title="Đã gửi"
          />
        );
      case "delivered":
        return (
          <i
            className="ti ti-checks"
            style={{ ...iconStyle, color: "#10b981" }}
            title="Đã nhận"
          />
        );
      case "failed":
        return (
          <i
            className="ti ti-x"
            style={{ ...iconStyle, color: "#ef4444" }}
            title="Gửi thất bại"
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Date Marker */}
      {showDateMarker && <DateMarker timestamp={message.createdAt} />}

      <div
        key={message.id}
        data-message-id={message.id}
        className={`chats ${isOwnMessage ? "chats-right" : ""}`}
        style={{
          display: "flex",
          flexDirection: isOwnMessage ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: "10px",
          maxWidth: "70%",
          position: "relative",
          animation: "slideIn 0.2s ease-out",
          flexShrink: 0,
          visibility: "visible",
          opacity: 1,
          width: "fit-content",
          boxSizing: "border-box",
          marginBottom: "8px",
          padding: 0,
          ...(isOwnMessage && {
            justifyContent: "flex-end",
            alignSelf: "flex-end",
            marginLeft: "auto",
            marginRight: 0,
          }),
        }}
      >
        {!isOwnMessage && (
          <div
            className="chat-avatar"
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              minWidth: "36px",
              minHeight: "36px",
              maxWidth: "36px",
              maxHeight: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0",
              padding: 0,
              overflow: "visible",
            }}
          >
            <Avatar
              src={message.senderAvatarUrl}
              name={message.senderName}
              size={36}
              className="rounded-circle"
            />
          </div>
        )}

        <div
          className="chat-content"
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: isOwnMessage ? "flex-end" : "flex-start",
          }}
        >
          {!isOwnMessage && (
            <div
              className="chat-profile-name"
              style={{
                marginBottom: "4px",
                lineHeight: 1.2,
                paddingLeft: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#667eea",
                }}
              >
                {message.senderName}
              </span>
            </div>
          )}

          <div
            className="chat-info"
            style={{ position: "relative", width: "100%" }}
          >
            {/* Message Actions - Hiển thị khi hover */}
            <div
              className="chat-actions-wrapper"
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                right: isOwnMessage ? "calc(100% + 6px)" : "auto",
                left: isOwnMessage ? "auto" : "calc(100% + 6px)",
                opacity: 0,
                transition: "opacity 0.15s ease",
                zIndex: 100,
              }}
            >
              {/* Dropup để menu hiển thị ở trên, tránh bị che bởi footer */}
              <div className="dropup">
                <button
                  type="button"
                  className="btn-message-action"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    padding: 0,
                  }}
                >
                  <i
                    className="ti ti-dots-vertical"
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  />
                </button>

                {/* Dropdown Menu - Hiển thị phía trên button */}
                <ul
                  className="dropdown-menu message-dropdown-menu"
                  style={{
                    minWidth: "150px",
                    padding: "6px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
                    background: "#ffffff",
                    marginBottom: "4px",
                    bottom: "100%",
                    top: "auto",
                  }}
                >
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => onTogglePin(message.id, message.pinned)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#374151",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <i
                        className={`ti ti-pin${
                          message.pinned ? "-filled" : ""
                        }`}
                        style={{
                          fontSize: "16px",
                          color: message.pinned ? "#667eea" : "#6b7280",
                        }}
                      />
                      <span>
                        {message.pinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                      </span>
                    </button>
                  </li>
                  {isOwnMessage && (
                    <li>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => onDeleteMessage(message.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#ef4444",
                          background: "transparent",
                          border: "none",
                          width: "100%",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <i
                          className="ti ti-trash"
                          style={{ fontSize: "16px" }}
                        />
                        <span>Xóa tin nhắn</span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div
              className="message-content"
              style={{
                borderRadius: isOwnMessage
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                background: isOwnMessage
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#ffffff",
                padding: "10px 14px 8px 14px",
                color: isOwnMessage ? "white" : "#1f2937",
                fontSize: "14px",
                fontWeight: 400,
                wordWrap: "break-word",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                display: "inline-block",
                maxWidth: "100%",
                minWidth: "60px",
                lineHeight: "1.5",
                boxSizing: "border-box",
                hyphens: "auto",
                boxShadow: isOwnMessage
                  ? "0 1px 2px rgba(0,0,0,0.1)"
                  : "0 1px 2px rgba(0,0,0,0.05)",
                border: isOwnMessage ? "none" : "1px solid #e5e7eb",
              }}
            >
              {/* Hiển thị ảnh */}
              {message.type === "IMAGE" && message.attachment && (
                <div
                  className="message-image"
                  style={{ marginBottom: message.content ? "8px" : "0" }}
                >
                  <img
                    src={
                      message.attachment.url.startsWith("http")
                        ? message.attachment.url
                        : `${import.meta.env.VITE_IMG_PATH || ""}${
                            message.attachment.url
                          }`
                    }
                    alt="Ảnh"
                    style={{
                      maxWidth: "300px",
                      maxHeight: "300px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Mở ảnh trong modal hoặc tab mới
                      window.open(
                        message.attachment!.url.startsWith("http")
                          ? message.attachment!.url
                          : `${import.meta.env.VITE_IMG_PATH || ""}${
                              message.attachment!.url
                            }`,
                        "_blank"
                      );
                    }}
                  />
                </div>
              )}

              {/* Hiển thị file */}
              {message.type === "FILE" && message.attachment && (
                <div
                  className="message-file"
                  style={{ marginBottom: message.content ? "8px" : "0" }}
                >
                  <div
                    className="file-attach"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      backgroundColor: isOwnMessage
                        ? "rgba(255,255,255,0.2)"
                        : "#f0f0f0",
                      borderRadius: "12px",
                      maxWidth: "300px",
                    }}
                  >
                    <div
                      className="file-icon"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: isOwnMessage
                          ? "rgba(255,255,255,0.3)"
                          : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      <i className="ti ti-file" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: "500",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {message.attachment.fileName || "Tệp đính kèm"}
                      </p>
                      <small
                        style={{
                          fontSize: "12px",
                          opacity: 0.7,
                        }}
                      >
                        {formatFileSize(message.attachment.fileSize)}
                      </small>
                    </div>
                    <a
                      href={
                        message.attachment.url.startsWith("http")
                          ? message.attachment.url
                          : `${import.meta.env.VITE_IMG_PATH || ""}${
                              message.attachment.url
                            }`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: isOwnMessage
                          ? "rgba(255,255,255,0.3)"
                          : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        color: "inherit",
                        flexShrink: 0,
                      }}
                      title="Mở tệp"
                    >
                      <i className="ti ti-download" />
                    </a>
                  </div>
                </div>
              )}

              {/* Hiển thị nội dung text */}
              {message.content && (
                <div
                  style={{
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    display: "block",
                    maxWidth: "100%",
                    lineHeight: "1.5",
                    marginBottom: "4px",
                  }}
                >
                  {message.content}
                </div>
              )}

              {/* Timestamp và read status - hiển thị riêng dòng dưới */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                  gap: "4px",
                  marginTop: message.content ? "2px" : "0",
                  fontSize: "11px",
                  color: isOwnMessage ? "rgba(255,255,255,0.7)" : "#9ca3af",
                  lineHeight: 1,
                }}
              >
                <span
                  className="chat-time"
                  style={{
                    fontSize: "11px",
                    lineHeight: 1,
                  }}
                >
                  {formatTime(message.createdAt)}
                </span>
                {/* ✅ NEW: Message status indicator */}
                {isOwnMessage && renderStatusIcon()}
                {isOwnMessage && message.readCount > 0 && (
                  <span
                    className="msg-read success"
                    style={{
                      marginLeft: "2px",
                      display: "inline-flex",
                      lineHeight: 1,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <i className="ti ti-checks" style={{ fontSize: "12px" }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageItem;
