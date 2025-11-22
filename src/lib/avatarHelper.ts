/**
 * Utility helper cho avatar
 */

/**
 * Lấy màu avatar dựa trên tên
 */
export const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Kiểm tra xem URL có hợp lệ không
 */
export const isValidUrl = (url?: string | null): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

/**
 * Lấy chữ cái đầu tiên của tên (uppercase)
 */
export const getInitial = (name?: string): string => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

