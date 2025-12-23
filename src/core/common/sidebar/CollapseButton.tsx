import React from 'react';
import { Tooltip } from 'antd';

interface CollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  variant?: 'header' | 'floating';
  className?: string;
}

/**
 * Redesigned Collapse Button - Header Variant (Discord/Slack style)
 * - Placed in sidebar header for better accessibility
 * - Clear icons (panel-left-close / menu-2)
 * - Smooth hover effects
 */
const CollapseButton: React.FC<CollapseButtonProps> = ({ 
  isCollapsed, 
  onToggle, 
  variant = 'header',
  className = ''
}) => {
  if (variant === 'header') {
    return (
      <Tooltip 
        title={isCollapsed ? 'Mở sidebar (Ctrl+B)' : 'Thu gọn sidebar (Ctrl+B)'} 
        placement="bottom"
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className={`sidebar-toggle-btn ${className}`}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: '#6b7280',
            zIndex: 100,
            position: 'relative',
            flexShrink: 0,
            padding: 0,
            margin: 0,
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6338F615';
            e.currentTarget.style.color = '#6338F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <i 
            className={`ti ${isCollapsed ? 'ti-menu-2' : 'ti-chevron-left'}`}
            style={{ 
              fontSize: '20px', 
              display: 'block',
              lineHeight: '1',
              width: '20px',
              height: '20px',
            }}
          />
        </button>
      </Tooltip>
    );
  }

  // Floating variant - REMOVED (Legacy)
  return null;
};

export default CollapseButton;

