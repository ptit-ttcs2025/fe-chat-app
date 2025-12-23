/**
 * Group Chat Footer Component
 * Input area để gửi tin nhắn, file, emoji
 */

import { RefObject } from "react";
import { Link } from "react-router-dom";
import type { IConversation } from "@/apis/chat/chat.type";

interface GroupChatFooterProps {
  footerRef: RefObject<HTMLDivElement>;
  selectedConversation: IConversation | null;
  inputMessage: string;
  inputRef: RefObject<HTMLInputElement>;
  imageInputRef: RefObject<HTMLInputElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  isUploading: boolean;
  isSending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerImageInput: () => void;
  onTriggerFileInput: () => void;
  footerHeight: number;
  onEmojiSelect: (emoji: string) => void;
}

const GroupChatFooter = ({
  footerRef,
  selectedConversation,
  inputMessage,
  inputRef,
  imageInputRef,
  fileInputRef,
  isUploading,
  isSending,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onImageSelect,
  onFileSelect,
  onTriggerImageInput,
  onTriggerFileInput,
  footerHeight: _footerHeight,
  onEmojiSelect: _onEmojiSelect,
}: GroupChatFooterProps) => {
  if (!selectedConversation) {
    return null;
  }

  return (
    <div className="chat-footer" ref={footerRef}>
      <form className="footer-form" onSubmit={onSendMessage}>
        <div className="chat-footer-wrap">
          {/* Voice Message Button */}
          <div className="form-item">
            <Link
              to="#"
              className="action-circle"
              onClick={(e) => e.preventDefault()}
            >
              <i className="ti ti-microphone" />
            </Link>
          </div>

          {/* Message Input */}
          <div className="form-wrap">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn của bạn"
              value={inputMessage}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              disabled={isUploading || isSending}
            />
          </div>

          {/* Emoji Picker Button */}
          <div className="form-item emoj-action-foot">
            <Link
              to="#"
              className="action-circle"
              onClick={(e) => e.preventDefault()}
            >
              <i className="ti ti-mood-smile" />
            </Link>
          </div>

          {/* File Upload Button */}
          <div className="form-item position-relative d-flex align-items-center justify-content-center">
            <Link
              to="#"
              className="action-circle file-action position-absolute"
              onClick={(e) => {
                e.preventDefault();
                onTriggerFileInput();
              }}
            >
              <i className="ti ti-folder" />
            </Link>
            <input
              ref={fileInputRef}
              type="file"
              className="open-file position-relative"
              style={{ display: "none" }}
              onChange={onFileSelect}
              accept="*/*"
            />
          </div>

          {/* Image Upload (hidden input) */}
          <input
            ref={imageInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={onImageSelect}
            accept="image/*"
          />

          {/* More Actions Dropdown */}
          <div className="form-item">
            <Link to="#" data-bs-toggle="dropdown">
              <i className="ti ti-dots-vertical" />
            </Link>
            <div className="dropdown-menu dropdown-menu-end p-3">
              <Link
                to="#"
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  onTriggerFileInput();
                }}
              >
                <i className="ti ti-file-text me-2" />
                Tài liệu
              </Link>
              <Link
                to="#"
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  onTriggerImageInput();
                }}
              >
                <i className="ti ti-photo-up me-2" />
                Hình ảnh
              </Link>
              <Link
                to="#"
                className="dropdown-item"
                onClick={(e) => e.preventDefault()}
              >
                <i className="ti ti-music me-2" />
                Âm thanh
              </Link>
              <Link
                to="#"
                className="dropdown-item"
                onClick={(e) => e.preventDefault()}
              >
                <i className="ti ti-map-pin-share me-2" />
                Vị trí
              </Link>
              <Link
                to="#"
                className="dropdown-item"
                onClick={(e) => e.preventDefault()}
              >
                <i className="ti ti-user-check me-2" />
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Send Button */}
          <div className="form-btn">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                !inputMessage.trim() || isUploading || isSending
              }
            >
              {isSending || isUploading ? (
                <span className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Đang gửi...</span>
                </span>
              ) : (
                <i className="ti ti-send" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GroupChatFooter;

