import React, { useState } from 'react';
import { img_path } from '../../../environment';
import { getUIAvatarUrl, getImageFallbackUrl } from '../../../lib/imageService';

interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?: string;
  onError?: () => void;
  onLoad?: () => void;
  style?: React.CSSProperties;
}

const resolveSrc = (src: string): string => {
  if (!src) return '';

  // Giữ nguyên các URL đã đầy đủ (blob/data/http/https) để tránh tạo request tới Vite
  if (/^(blob:|data:|https?:)/i.test(src)) {
    return src;
  }

  // Nếu đã có slash đầu, coi như đường dẫn tuyệt đối trong app
  if (src.startsWith('/')) {
    return src;
  }

  // FIX: Nếu src bắt đầu bằng 'assets/', xử lý đặc biệt
  // VD: 'assets/img/logo.png' → '/assets/img/logo.png' (production)
  // hoặc '/src/assets/img/logo.png' (development)
  if (src.startsWith('assets/')) {
    // Production: img_path = '/assets/', src = 'assets/img/logo.png'
    // → Bỏ 'assets/' từ src để tránh duplicate: '/assets/' + 'img/logo.png'
    // Development: img_path = '/src/', src = 'assets/img/logo.png'
    // → Giữ nguyên: '/src/' + 'assets/img/logo.png'
    if (import.meta.env.PROD) {
      // Production: remove 'assets/' prefix
      return img_path + src.replace(/^assets\//, '');
    }
  }

  // Ngược lại ghép với img_path mặc định
  return `${img_path}${src}`;
};

const ImageWithBasePath = (props: Image) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fullSrc = resolveSrc(props.src);

  // Kiểm tra xem có phải avatar không (dựa vào className)
  const isAvatar = props.className?.includes('avatar') || false;
  const altText = props.alt || 'Image';

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
    if (props.onError) {
      props.onError();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    if (props.onLoad) {
      props.onLoad();
    }
  };

  // Nếu ảnh lỗi và là avatar, fallback sang UI Avatars
  if (imgError && isAvatar && altText && altText !== 'Image') {
    const fallbackUrl = getUIAvatarUrl(altText, props.width || props.height || 200);
    return (
      <img
        className={props.className}
        src={fallbackUrl}
        height={props.height}
        alt={altText}
        width={props.width}
        id={props.id}
        style={props.style}
        onError={() => {
          // Nếu UI Avatars cũng lỗi, dùng SVG placeholder
          const svgPlaceholder = getImageFallbackUrl('avatar');
          const img = document.querySelector(`#${props.id || ''}`) as HTMLImageElement;
          if (img) {
            img.src = svgPlaceholder;
          }
        }}
      />
    );
  }

  // Nếu ảnh lỗi và không phải avatar, dùng SVG placeholder
  if (imgError && !isAvatar) {
    const fallbackUrl = getImageFallbackUrl('chat');
    return (
      <img
        className={props.className}
        src={fallbackUrl}
        height={props.height}
        alt={altText}
        width={props.width}
        id={props.id}
        style={props.style}
      />
    );
  }

  // Hiển thị ảnh bình thường
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={altText}
      width={props.width}
      id={props.id}
      style={props.style}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default ImageWithBasePath;
