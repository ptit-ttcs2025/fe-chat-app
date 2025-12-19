import React, { useState } from 'react';
import { Tooltip } from 'antd';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  isResizing: boolean;
}

/**
 * Redesigned ResizeHandle - VS Code style
 * - Gradient background on hover
 * - Clear visual indicator (dots)
 * - Helpful tooltip
 * - Smooth transitions
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  onMouseDown, 
  onDoubleClick, 
  isResizing 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Tooltip 
      title="Kéo để thay đổi độ rộng • Double-click để reset về 400px" 
      placement="right"
      open={isHovered && !isResizing}
      styles={{ root: { fontSize: '12px' } }}
    >
      <div
        className="sidebar-resize-handle"
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '6px',
          cursor: 'col-resize',
          background: isResizing || isHovered
            ? 'linear-gradient(90deg, rgba(99, 56, 246, 0.15) 0%, rgba(99, 56, 246, 0.3) 50%, rgba(99, 56, 246, 0.15) 100%)'
            : 'transparent',
          transition: isResizing ? 'none' : 'all 0.2s ease',
          zIndex: 1000,
        }}
      >
        {/* Visual indicator - dots (like VS Code) */}
        {(isHovered || isResizing) && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              padding: '8px 0',
            }}
          >
            <div style={{ 
              width: '3px', 
              height: '3px', 
              borderRadius: '50%', 
              backgroundColor: isResizing ? '#6338F6' : '#9ca3af',
              transition: 'background-color 0.2s',
            }} />
            <div style={{ 
              width: '3px', 
              height: '3px', 
              borderRadius: '50%', 
              backgroundColor: isResizing ? '#6338F6' : '#9ca3af',
              transition: 'background-color 0.2s',
            }} />
            <div style={{ 
              width: '3px', 
              height: '3px', 
              borderRadius: '50%', 
              backgroundColor: isResizing ? '#6338F6' : '#9ca3af',
              transition: 'background-color 0.2s',
            }} />
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default ResizeHandle;

