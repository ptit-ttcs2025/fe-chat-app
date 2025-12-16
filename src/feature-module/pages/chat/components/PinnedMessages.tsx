import { useState } from "react";
import type { IMessage } from "@/apis/chat/chat.type";
import Avatar from "./Avatar";

interface PinnedMessagesProps {
  pinnedMessages: IMessage[];
  onMessageClick: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }
};

const formatFullDate = (timestamp: string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
  });
};

const PinnedMessages = ({ pinnedMessages, onMessageClick, onUnpin }: PinnedMessagesProps) => {
  const [showModal, setShowModal] = useState(false);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  // Lấy tin nhắn ghim gần nhất
  const latestPinned = pinnedMessages[0];
  const hasMultiple = pinnedMessages.length > 1;

  const handleClick = (messageId: string) => {
    // Scroll to message
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight message
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
    onMessageClick(messageId);
    setShowModal(false);
  };

  const handleBarClick = () => {
    if (hasMultiple) {
      setShowModal(true);
    } else {
      handleClick(latestPinned.id);
    }
  };

  return (
    <>
      {/* Pinned Message Bar - Hiển thị ở đầu chat */}
      <div 
        className="pinned-message-bar"
        onClick={handleBarClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        {/* Pin Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="ti ti-pin-filled" style={{ color: '#fff', fontSize: '16px' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '2px',
          }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#667eea',
            }}>
              Tin nhắn đã ghim
            </span>
            {hasMultiple && (
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#667eea',
                padding: '2px 6px',
                borderRadius: '10px',
              }}>
                {pinnedMessages.length}
              </span>
            )}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 500, color: '#374151' }}>
              {latestPinned.senderName}:
            </span>{' '}
            {latestPinned.type === 'IMAGE' && '📷 Hình ảnh'}
            {latestPinned.type === 'FILE' && '📎 File đính kèm'}
            {latestPinned.type === 'TEXT' && latestPinned.content}
          </div>
        </div>

        {/* Arrow */}
        <i 
          className={`ti ti-chevron-${hasMultiple ? 'down' : 'right'}`} 
          style={{ color: '#9ca3af', fontSize: '18px' }} 
        />
      </div>

      {/* Modal hiển thị tất cả tin nhắn đã ghim */}
      {showModal && (
        <div 
          className="pinned-modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div 
            className="pinned-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '480px',
              maxHeight: '70vh',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 600,
                color: '#1f2937',
              }}>
                Tin nhắn đã ghim
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f3f4f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                <i className="ti ti-x" style={{ fontSize: '18px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Modal Body - Danh sách tin nhắn đã ghim */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
            }}>
              {pinnedMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="pinned-message-item"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    marginBottom: index < pinnedMessages.length - 1 ? '4px' : 0,
                  }}
                  onClick={() => handleClick(msg.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <Avatar 
                    src={msg.senderAvatarUrl} 
                    name={msg.senderName} 
                    size={44} 
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#1f2937',
                      }}>
                        {msg.senderName}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#9ca3af',
                      }}>
                        {formatFullDate(msg.createdAt)}
                      </span>
                    </div>
                    
                    {/* Message Preview */}
                    <div style={{
                      padding: '10px 14px',
                      backgroundColor: '#f0f2f5',
                      borderRadius: '18px',
                      fontSize: '14px',
                      color: '#1f2937',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {msg.type === 'IMAGE' && (
                        <span style={{ color: '#667eea' }}>📷 Hình ảnh</span>
                      )}
                      {msg.type === 'FILE' && (
                        <span style={{ color: '#667eea' }}>📎 {msg.attachment?.fileName || 'File đính kèm'}</span>
                      )}
                      {msg.type === 'TEXT' && (
                        <span style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {msg.content}
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      marginTop: '6px',
                      gap: '8px',
                    }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {onUnpin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnpin(msg.id);
                          }}
                          style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Bỏ ghim
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .pinned-modal::-webkit-scrollbar {
          width: 6px;
        }
        
        .pinned-modal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .pinned-modal::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .pinned-modal::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </>
  );
};

export default PinnedMessages;
