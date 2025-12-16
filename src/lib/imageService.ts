/**
 * Image Service - Picsum Photos và UI Avatars
 * Tạo URLs cho ảnh từ Picsum Photos API và UI Avatars cho fallback
 */

/**
 * Tạo hash đơn giản từ string để dùng làm seed
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Lấy avatar URL từ Picsum Photos với seed dựa trên tên
 * Sử dụng IDs từ 0-49 cho avatars
 * @param name - Tên người dùng để tạo seed
 * @param size - Kích thước ảnh (mặc định 200x200)
 */
export const getPicsumAvatarUrl = (name: string, size: number = 200): string => {
  const seed = hashString(name);
  const id = seed % 50; // Sử dụng IDs từ 0-49
  return `https://picsum.photos/id/${id}/${size}/${size}`;
};

/**
 * Lấy ảnh status/story từ Picsum Photos
 * Sử dụng IDs từ 50-99 cho status images
 * @param seed - Seed để đảm bảo consistency
 * @param width - Chiều rộng (mặc định 800)
 * @param height - Chiều cao (mặc định 1000)
 */
export const getPicsumStatusImageUrl = (
  seed: string | number,
  width: number = 800,
  height: number = 1000
): string => {
  const seedValue = typeof seed === 'string' ? hashString(seed) : seed;
  const id = 50 + (seedValue % 50); // Sử dụng IDs từ 50-99
  return `https://picsum.photos/id/${id}/${width}/${height}`;
};

/**
 * Lấy ảnh group từ Picsum Photos
 * Sử dụng IDs từ 0-49 (có thể overlap với avatars, nhưng khác size)
 * @param groupName - Tên nhóm
 * @param size - Kích thước (mặc định 400)
 */
export const getPicsumGroupImageUrl = (groupName: string, size: number = 400): string => {
  const seed = hashString(groupName);
  const id = seed % 50; // Sử dụng IDs từ 0-49
  return `https://picsum.photos/id/${id}/${size}/${size}`;
};

/**
 * Lấy ảnh chat/image message từ Picsum Photos
 * Sử dụng IDs từ 0-49
 * @param seed - Seed để đảm bảo consistency
 * @param width - Chiều rộng (mặc định 600)
 * @param height - Chiều cao (mặc định 400)
 */
export const getPicsumChatImageUrl = (
  seed: string | number,
  width: number = 600,
  height: number = 400
): string => {
  const seedValue = typeof seed === 'string' ? hashString(seed) : seed;
  const id = seedValue % 50; // Sử dụng IDs từ 0-49
  return `https://picsum.photos/id/${id}/${width}/${height}`;
};

/**
 * UI Avatars - Fallback cho avatars khi Picsum Photos không load được
 * @param name - Tên người dùng
 * @param size - Kích thước (mặc định 200)
 */
export const getUIAvatarUrl = (name: string, size: number = 200): string => {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=6338F6&color=fff&bold=true`;
};

/**
 * Backward compatibility: Giữ lại các function cũ để không break code
 * @deprecated Sử dụng getPicsumAvatarUrl thay thế
 */
export const getUnsplashAvatarUrl = (name: string, size: number = 200): string => {
  return getPicsumAvatarUrl(name, size);
};

/**
 * Backward compatibility: Giữ lại các function cũ để không break code
 * @deprecated Sử dụng getPicsumStatusImageUrl thay thế
 */
export const getUnsplashStatusImageUrl = (
  seed: string | number,
  width: number = 800,
  height: number = 1000
): string => {
  return getPicsumStatusImageUrl(seed, width, height);
};

/**
 * Backward compatibility: Giữ lại các function cũ để không break code
 * @deprecated Sử dụng getPicsumGroupImageUrl thay thế
 */
export const getUnsplashGroupImageUrl = (groupName: string, size: number = 200): string => {
  return getPicsumGroupImageUrl(groupName, size);
};

/**
 * Backward compatibility: Giữ lại các function cũ để không break code
 * @deprecated Sử dụng getPicsumChatImageUrl thay thế
 */
export const getUnsplashChatImageUrl = (
  seed: string | number,
  width: number = 600,
  height: number = 400
): string => {
  return getPicsumChatImageUrl(seed, width, height);
};

/**
 * Backward compatibility
 * @deprecated Sử dụng getPicsumAvatarUrl thay thế
 */
export const getRandomAvatarUrl = (name: string, size: number = 200): string => {
  return getPicsumAvatarUrl(name, size);
};

/**
 * Fallback: Nếu Picsum Photos không load được, trả về placeholder SVG
 */
export const getImageFallbackUrl = (type: 'avatar' | 'status' | 'group' | 'chat'): string => {
  switch (type) {
    case 'avatar':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzYzMzhmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VTwvdGV4dD48L3N2Zz4=';
    case 'status':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEwMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIxMDAwIiBmaWxsPSIjNjY3ZWVhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
    case 'group':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2E1NTVlYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RzwvdGV4dD48L3N2Zz4=';
    case 'chat':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzc2NGJhMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
    default:
      return '';
  }
};
