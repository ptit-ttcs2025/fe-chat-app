import { useEffect, useState } from 'react';

interface NewMessagesBadgeProps {
  unreadCount: number;
  onScrollToBottom: () => void;
}

const NewMessagesBadge = ({ unreadCount, onScrollToBottom }: NewMessagesBadgeProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsVisible(true);
    } else {
      // Fade out animation
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        zIndex: 60,
        animation: unreadCount > 0 ? 'slideUpFadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out',
      }}
    >
      <button
        onClick={onScrollToBottom}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.2s ease',
          minWidth: 'fit-content',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
        }}
      >
        <span
          style={{
            background: '#fff',
            color: '#667eea',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
        <span>tin nhắn mới</span>
        <i className="ti ti-arrow-down" style={{ fontSize: '16px' }} />
      </button>

      {/* CSS Animations - inline styles */}
      <style>{`
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NewMessagesBadge;

