/**
 * Image Helper Utilities - Xử lý ảnh default và fallback
 */

import { getAvatarColor, getInitial } from './avatarHelper';

/**
 * Kiểu ảnh để xác định placeholder phù hợp
 */
export type ImageType = 'avatar' | 'story' | 'chat-image' | 'group-avatar';

/**
 * Interface cho fallback image
 */
export interface FallbackImageProps {
  type: ImageType;
  name?: string;
  size?: number;
}

/**
 * Tạo placeholder cho story/image với gradient background
 */
export const getStoryPlaceholder = (name?: string): React.CSSProperties => {
  const bgColor = name ? getAvatarColor(name) : '#6338F6';
  return {
    background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -30)} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: '400px',
  };
};

/**
 * Tạo placeholder cho chat image với gradient và icon
 */
export const getChatImagePlaceholder = (): React.CSSProperties => {
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '200px',
    minHeight: '200px',
  };
};

/**
 * Tạo default avatar với chữ cái đầu
 */
export const getAvatarFallback = (name?: string, size: number = 40): React.CSSProperties => {
  const avatarName = name || 'User';
  const bgColor = getAvatarColor(avatarName);
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    backgroundColor: bgColor,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: `${Math.max(12, Math.round(size * 0.4))}px`,
    flexShrink: 0,
  };
};

/**
 * Lấy default path cho các loại ảnh
 */
export const getDefaultImagePath = (type: ImageType): string => {
  switch (type) {
    case 'avatar':
      return 'assets/img/profiles/avatar-default.jpg';
    case 'group-avatar':
      return 'assets/img/groups/group-default.jpg';
    case 'story':
      return 'assets/img/status/status-default.jpg';
    case 'chat-image':
      return 'assets/img/gallery/image-default.jpg';
    default:
      return 'assets/img/placeholder.jpg';
  }
};

/**
 * Kiểm tra xem URL có tồn tại và hợp lệ không
 */
export const isValidImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  // Kiểm tra nếu là URL hoàn chỉnh
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  // Kiểm tra nếu là đường dẫn assets
  if (url.startsWith('assets/')) {
    return true;
  }
  return false;
};

/**
 * Lấy full URL cho image
 */
export const getFullImageUrl = (url?: string | null, basePath: string = ''): string | null => {
  if (!url) return null;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  if (url.startsWith('assets/')) {
    return basePath ? `${basePath}${url}` : url;
  }
  
  return url;
};

/**
 * Điều chỉnh màu sáng/tối
 */
function adjustColor(color: string, amount: number): string {
  const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
  
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Tạo initials từ tên để hiển thị trong avatar fallback
 */
export const getAvatarInitials = (name?: string): string => {
  return getInitial(name);
};

/**
 * Component Props cho ImageFallback
 */
export interface ImageFallbackConfig {
  showIcon?: boolean;
  iconClass?: string;
  customStyles?: React.CSSProperties;
}

/**
 * Lấy config cho fallback dựa trên type
 */
export const getFallbackConfig = (type: ImageType): ImageFallbackConfig => {
  switch (type) {
    case 'story':
      return {
        showIcon: true,
        iconClass: 'ti ti-photo',
        customStyles: {
          fontSize: '48px',
          color: 'rgba(255, 255, 255, 0.8)',
        },
      };
    case 'chat-image':
      return {
        showIcon: true,
        iconClass: 'ti ti-photo',
        customStyles: {
          fontSize: '32px',
          color: 'rgba(255, 255, 255, 0.8)',
        },
      };
    case 'avatar':
    case 'group-avatar':
      return {
        showIcon: false,
      };
    default:
      return {
        showIcon: true,
        iconClass: 'ti ti-photo',
      };
  }
};

