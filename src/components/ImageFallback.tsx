/**
 * ImageFallback Component - Xử lý fallback cho images với Picsum Photos và UI Avatars
 */

import React, { useState } from 'react';
import { ImageType, getStoryPlaceholder, getChatImagePlaceholder, getFallbackConfig, getFullImageUrl, isValidImageUrl } from '@/lib/imageHelper';
import { getUIAvatarUrl, getImageFallbackUrl } from '@/lib/imageService';

interface ImageFallbackProps {
  src?: string | null;
  alt?: string;
  type?: ImageType;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt = 'Image',
  type = 'chat-image',
  name,
  className = '',
  style = {},
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  
  const hasValidUrl = isValidImageUrl(src) && !imgError;
  const fullSrc = hasValidUrl ? getFullImageUrl(src, import.meta.env.VITE_IMG_PATH || '') : null;

  // Nếu có URL hợp lệ, hiển thị image
  if (fullSrc && hasValidUrl) {
    return (
      <div className={className} style={{ position: 'relative', ...style }} onClick={onClick}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              zIndex: 1,
            }}
          >
            <div className="spinner-border text-white" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        )}
        <img
          src={fullSrc}
          alt={alt}
          onError={() => {
            setImgError(true);
            setIsLoading(false);
            // Nếu là avatar và có name, thử fallback sang UI Avatars
            if ((type === 'avatar' || type === 'group-avatar') && name && !fallbackAttempted) {
              setFallbackAttempted(true);
            }
          }}
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoading ? 'none' : 'block',
          }}
        />
      </div>
    );
  }

  // Nếu ảnh lỗi và là avatar với name, thử UI Avatars
  if (imgError && (type === 'avatar' || type === 'group-avatar') && name && !fallbackAttempted) {
    const uiAvatarUrl = getUIAvatarUrl(name, 200);
    return (
      <img
        src={uiAvatarUrl}
        alt={alt}
        className={className}
        style={style}
        onError={() => {
          // Nếu UI Avatars cũng lỗi, dùng SVG placeholder
          setFallbackAttempted(true);
        }}
        onClick={onClick}
      />
    );
  }

  // Fallback: Hiển thị placeholder hoặc SVG
  const config = getFallbackConfig(type);
  let placeholderStyle: React.CSSProperties = {};
  let useSvgFallback = false;
  let svgFallbackUrl = '';

  // Xác định loại fallback
  switch (type) {
    case 'story':
      placeholderStyle = getStoryPlaceholder(name);
      svgFallbackUrl = getImageFallbackUrl('status');
      break;
    case 'chat-image':
      placeholderStyle = getChatImagePlaceholder();
      svgFallbackUrl = getImageFallbackUrl('chat');
      break;
    case 'avatar':
    case 'group-avatar':
      // Nếu không có name hoặc đã thử UI Avatars, dùng SVG
      if (!name || fallbackAttempted) {
        useSvgFallback = true;
        svgFallbackUrl = getImageFallbackUrl('avatar');
      } else {
        placeholderStyle = getChatImagePlaceholder();
      }
      break;
    default:
      placeholderStyle = getChatImagePlaceholder();
      svgFallbackUrl = getImageFallbackUrl('chat');
  }

  // Nếu dùng SVG fallback
  if (useSvgFallback && svgFallbackUrl) {
    return (
      <img
        src={svgFallbackUrl}
        alt={alt}
        className={className}
        style={style}
        onClick={onClick}
      />
    );
  }

  // Hiển thị placeholder với gradient
  return (
    <div
      className={className}
      style={{
        ...placeholderStyle,
        ...style,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {config.showIcon && (
        <i className={config.iconClass} style={config.customStyles} />
      )}
    </div>
  );
};

export default ImageFallback;

