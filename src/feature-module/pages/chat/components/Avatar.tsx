import { useState } from "react";
import { isValidUrl, getInitial, getAvatarColor } from "@/lib/avatarHelper";

interface AvatarProps {
  src?: string;
  name?: string;
  className?: string;
  /**
   * Kích thước avatar theo px. Mặc định 40
   */
  size?: number;
}

const Avatar = ({ src, name, className = "", size = 40 }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const avatarName = name || "User";
  const initial = getInitial(avatarName);
  const bgColor = getAvatarColor(avatarName);
  const hasValidUrl = isValidUrl(src) && !imgError;

  // Professional Avatar Styles - Đảm bảo luôn tròn, không méo, không bị crop
  const avatarContainerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    maxWidth: `${size}px`,
    maxHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: bgColor,
    boxSizing: 'border-box',
    border: 'none',
    padding: 0,
    margin: 0,
  };

  const avatarImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
    borderRadius: '50%',
    margin: 0,
    padding: 0,
  };

  const avatarTextStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: bgColor,
    color: '#fff',
    fontWeight: 600,
    fontSize: `${Math.max(12, Math.round(size * 0.4))}px`,
    lineHeight: 1,
    userSelect: 'none',
  };

  if (hasValidUrl && src) {
    const fullSrc = src.startsWith('http') ? src : `${import.meta.env.VITE_IMG_PATH || ''}${src}`;
    return (
      <div className={className} style={avatarContainerStyle}>
        <img
          src={fullSrc}
          alt={avatarName}
          onError={() => setImgError(true)}
          style={avatarImageStyle}
        />
      </div>
    );
  }

  // Fallback: Avatar với chữ cái đầu
  return (
    <div className={className} style={avatarContainerStyle}>
      <div style={avatarTextStyle}>
        {initial}
      </div>
    </div>
  );
};

export default Avatar;

