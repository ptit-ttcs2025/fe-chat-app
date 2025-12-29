import { RefObject, useState, useRef, useEffect } from "react";
import { Tooltip } from "antd";
import type { IConversation } from "@/apis/chat/chat.type";

// Emoji data - các emoji phổ biến theo category
const EMOJI_DATA = {
  "Thường dùng": [
    "😀",
    "😂",
    "😊",
    "🥰",
    "😍",
    "😘",
    "😜",
    "😎",
    "🤩",
    "😴",
    "😢",
    "😭",
    "😤",
    "😡",
    "🤔",
    "🤫",
    "🤗",
    "🙄",
    "😬",
    "🤯",
  ],
  "Cảm xúc": [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "💔",
    "💕",
    "💖",
    "💗",
    "💝",
    "💘",
    "✨",
    "⭐",
    "🌟",
    "💫",
    "🔥",
    "💯",
    "👍",
  ],
  "Cử chỉ": [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👋",
    "🖐️",
    "✋",
    "👏",
    "🙌",
    "🤲",
    "🙏",
    "💪",
    "🤝",
    "👊",
    "✊",
    "🖕",
  ],
  "Đồ vật": [
    "🎉",
    "🎊",
    "🎁",
    "🎈",
    "🎂",
    "🍕",
    "🍔",
    "🍟",
    "🍿",
    "☕",
    "🍺",
    "🍷",
    "🍰",
    "🍩",
    "🍪",
    "🌹",
    "🌸",
    "🌺",
    "🍀",
    "🌈",
  ],
  "Động vật": [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🦋",
    "🐢",
  ],
};

type PendingUploadItem = {
  id: string;
  kind: "image" | "file";
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  previewUrl?: string;
  serverUrl?: string;
  error?: string;
};

interface ChatFooterProps {
  footerRef: RefObject<HTMLDivElement | null>;
  selectedConversation: IConversation | null;
  inputMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  imageInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  isSending: boolean;
  pendingUploads: PendingUploadItem[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerImageInput: () => void;
  onTriggerFileInput: () => void;
  footerHeight: number;
  onRemovePending: (id: string) => void;
  onEmojiSelect?: (emoji: string) => void;
}

const ChatFooter = ({
  footerRef,
  selectedConversation,
  inputMessage,
  inputRef,
  imageInputRef,
  fileInputRef,
  isUploading,
  isSending,
  pendingUploads,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onImageSelect,
  onFileSelect,
  onTriggerImageInput,
  onTriggerFileInput,
  footerHeight,
  onRemovePending,
  onEmojiSelect,
}: ChatFooterProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Thường dùng");
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji);
    } else {
      // Fallback: Insert emoji at cursor position
      if (inputRef.current) {
        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        const newValue =
          inputMessage.slice(0, start) + emoji + inputMessage.slice(end);

        // Trigger input change event
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputRef.current, newValue);
          const ev = new Event("input", { bubbles: true });
          inputRef.current.dispatchEvent(ev);
        }

        // Set cursor position after emoji
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(
              start + emoji.length,
              start + emoji.length
            );
          }
        }, 0);
      }
    }
  };

  return (
    <div
      className="chat-footer"
      ref={footerRef}
      style={
        {
          "--footer-height": `${footerHeight}px`,
          position: "relative",
          zIndex: 100,
          background: "#fff",
          borderTop: "1px solid #e9ecef",
          padding: "16px 20px",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
          flexShrink: 0,
          width: "100%",
          boxSizing: "border-box",
          visibility: "visible",
          opacity: 1,
          display: "block",
        } as React.CSSProperties
      }
    >
      <form className="footer-form" onSubmit={onSendMessage}>
        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onImageSelect}
          disabled={isUploading || !selectedConversation}
        />
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={onFileSelect}
          disabled={isUploading || !selectedConversation}
        />

        {/* Pending upload preview */}
        {pendingUploads.length > 0 && (
          <div
            style={{
              width: "100%",
              margin: "8px 0 12px",
              overflowX: "auto",
              overflowY: "hidden",
              display: "flex",
              gap: "10px",
              paddingBottom: "4px",
            }}
          >
            {pendingUploads.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  minWidth: "320px",
                  maxWidth: "420px",
                  flexShrink: 0,
                }}
              >
                {item.kind === "image" ? (
                  <>
                    {/* Image Thumbnail - Larger size */}
                    <div
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={item.serverUrl || item.previewUrl}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          background: "#e5e7eb",
                        }}
                      />
                    </div>
                    {/* Image Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color:
                            item.status === "error"
                              ? "#dc2626"
                              : item.status === "done"
                              ? "#16a34a"
                              : "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {item.status === "uploading" && "Đang tải lên..."}
                        {item.status === "done" && `✓ Đã tải lên • ${formatFileSize(item.size)}`}
                        {item.status === "error" && "✗ Lỗi tải lên"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* File Icon */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        background: "#e0e7ff",
                        color: "#4338ca",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "24px",
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </div>
                    {/* File Info - More space for name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color:
                            item.status === "error"
                              ? "#dc2626"
                              : item.status === "done"
                              ? "#16a34a"
                              : "#6b7280",
                          fontWeight: 500,
                        }}
                      >
                        {item.status === "uploading" && "Đang tải lên..."}
                        {item.status === "done" && `✓ Đã tải lên • ${formatFileSize(item.size)}`}
                        {item.status === "error" && "✗ Lỗi tải lên"}
                      </div>
                    </div>
                  </>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemovePending(item.id)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f3f4f6",
                    cursor: "pointer",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                    e.currentTarget.style.color = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  <i className="ti ti-x" style={{ fontSize: "18px" }} />
                </button>

                {/* Error message */}
                {item.status === "error" && item.error && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: item.kind === "image" ? "104px" : "72px",
                      right: "48px",
                      fontSize: "11px",
                      color: "#dc2626",
                      background: "#fee2e2",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {item.error}
                  </div>
                )}

                {/* Loading overlay */}
                {item.status === "uploading" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(255,255,255,0.7)",
                      display: "grid",
                      placeItems: "center",
                      backdropFilter: "blur(2px)",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      className="spinner-border"
                      role="status"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderWidth: "3px",
                        color: "#667eea",
                      }}
                    >
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="chat-footer-wrap">
          {/* Left side: Upload buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Tooltip title="Gửi ảnh" placement="top">
              <button
                type="button"
                className="action-circle"
                onClick={onTriggerImageInput}
                disabled={isUploading || isSending || !selectedConversation}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#f5f5f5",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = "#667eea";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.color = "#666";
                  }
                }}
              >
                {isUploading ? (
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                ) : (
                  <i className="ti ti-photo" style={{ fontSize: "18px" }} />
                )}
              </button>
            </Tooltip>

            <Tooltip title="Gửi file" placement="top">
              <button
                type="button"
                className="action-circle"
                onClick={onTriggerFileInput}
                disabled={isUploading || isSending || !selectedConversation}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#f5f5f5",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = "#667eea";
                    e.currentTarget.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.color = "#666";
                  }
                }}
              >
                <i className="ti ti-paperclip" style={{ fontSize: "18px" }} />
              </button>
            </Tooltip>
          </div>

          {/* Emoji Picker Button */}
          <div style={{ position: "relative" }} ref={emojiPickerRef}>
            <Tooltip title="Biểu tượng cảm xúc" placement="top">
              <button
                type="button"
                className="action-circle"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={!selectedConversation}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: showEmojiPicker ? "#667eea" : "#f5f5f5",
                  color: showEmojiPicker ? "#fff" : "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="ti ti-mood-smile" style={{ fontSize: "20px" }} />
              </button>
            </Tooltip>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div
                style={{
                  position: "absolute",
                  bottom: "50px",
                  left: "0",
                  width: "320px",
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
                  border: "1px solid #e5e7eb",
                  zIndex: 1000,
                  animation: "fadeInUp 0.2s ease",
                }}
              >
                {/* Category Tabs */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                    gap: "4px",
                    overflowX: "auto",
                  }}
                >
                  {Object.keys(EMOJI_DATA).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "16px",
                        border: "none",
                        background:
                          selectedCategory === category
                            ? "#667eea"
                            : "transparent",
                        color: selectedCategory === category ? "#fff" : "#666",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div
                  style={{
                    padding: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {EMOJI_DATA[selectedCategory as keyof typeof EMOJI_DATA].map(
                    (emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleEmojiClick(emoji);
                          setShowEmojiPicker(false);
                        }}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "none",
                          background: "transparent",
                          fontSize: "22px",
                          cursor: "pointer",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.transform = "scale(1.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Center: Message Input */}
          <div className="form-wrap" style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              disabled={isUploading || !selectedConversation}
              autoFocus
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "21px",
                padding: "0 18px",
                border: "1px solid #d0d0d0",
                background: "#f8f9fa",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            />
          </div>

          {/* Right side: Send Button */}
          <div
            className="form-btn"
            style={{
              margin: 0,
              padding: 0,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                (!inputMessage.trim() &&
                  pendingUploads.filter((u) => u.status === "done").length ===
                    0) ||
                isSending ||
                isUploading ||
                !selectedConversation
              }
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              tabIndex={0}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "none",
                background:
                  inputMessage.trim() ||
                  pendingUploads.filter((u) => u.status === "done").length > 0
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#d0d0d0",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                  (!inputMessage.trim() &&
                    pendingUploads.filter((u) => u.status === "done").length ===
                      0) ||
                  isSending ||
                  isUploading ||
                  !selectedConversation
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
                boxShadow:
                  inputMessage.trim() ||
                  pendingUploads.filter((u) => u.status === "done").length > 0
                    ? "0 2px 8px rgba(102, 126, 234, 0.3)"
                    : "none",
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (
                  !e.currentTarget.disabled &&
                  (inputMessage.trim() ||
                    pendingUploads.filter((u) => u.status === "done").length >
                      0)
                ) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {isSending || isUploading ? (
                <div
                  className="spinner-border spinner-border-sm"
                  role="status"
                  style={{ width: "16px", height: "16px", borderWidth: "2px" }}
                >
                  <span className="visually-hidden">Đang gửi...</span>
                </div>
              ) : (
                <i className="ti ti-send" style={{ fontSize: "18px" }} />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatFooter;
