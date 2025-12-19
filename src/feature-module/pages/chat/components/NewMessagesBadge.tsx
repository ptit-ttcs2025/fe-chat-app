import { useEffect, useState } from 'react';

interface NewMessagesBadgeProps {
  show: boolean;
  unreadCount: number;
  onScrollToBottom: () => void;
}

const NewMessagesBadge = ({ show, unreadCount, onScrollToBottom }: NewMessagesBadgeProps) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '70px',
        right: '20px',
        zIndex: 1000,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
      }}
    >
      <button
        onClick={onScrollToBottom}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: '#fff',
          color: '#667eea',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          pointerEvents: 'auto',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        }}
        title="Cuộn xuống tin nhắn mới"
      >
        <i className="ti ti-chevrons-down" style={{ fontSize: '20px' }} />
        
        {/* Badge number */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '0',
              background: '#ff4d4f',
              color: '#fff',
              borderRadius: '10px',
              padding: '0 5px',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NewMessagesBadge;
