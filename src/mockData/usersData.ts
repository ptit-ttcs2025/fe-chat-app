/**
 * Mock data cho users - Tên, avatar, nghề nghiệp tiếng Việt
 */

import { getPicsumAvatarUrl } from '@/lib/imageService';

export interface MockUser {
  id: string;
  name: string;
  avatar: string;
  job?: string;
  isOnline?: boolean;
}

export const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    name: 'Nguyễn Văn An',
    avatar: getPicsumAvatarUrl('Nguyễn Văn An'),
    job: 'Lập trình viên',
    isOnline: true,
  },
  {
    id: 'user-2',
    name: 'Trần Thị Bình',
    avatar: getPicsumAvatarUrl('Trần Thị Bình'),
    job: 'Thiết kế đồ họa',
    isOnline: true,
  },
  {
    id: 'user-3',
    name: 'Lê Minh Cường',
    avatar: getPicsumAvatarUrl('Lê Minh Cường'),
    job: 'Nhà phát triển Web',
    isOnline: false,
  },
  {
    id: 'user-4',
    name: 'Phạm Thị Dung',
    avatar: getPicsumAvatarUrl('Phạm Thị Dung'),
    job: 'Phân tích kinh doanh',
    isOnline: true,
  },
  {
    id: 'user-5',
    name: 'Hoàng Văn Em',
    avatar: getPicsumAvatarUrl('Hoàng Văn Em'),
    job: 'Quản lý dự án',
    isOnline: false,
  },
  {
    id: 'user-6',
    name: 'Vũ Thị Phương',
    avatar: getPicsumAvatarUrl('Vũ Thị Phương'),
    job: 'Nhà thiết kế UI/UX',
    isOnline: true,
  },
  {
    id: 'user-7',
    name: 'Đặng Văn Giang',
    avatar: getPicsumAvatarUrl('Đặng Văn Giang'),
    job: 'Kỹ sư phần mềm',
    isOnline: true,
  },
  {
    id: 'user-8',
    name: 'Bùi Thị Hoa',
    avatar: getPicsumAvatarUrl('Bùi Thị Hoa'),
    job: 'Marketing Manager',
    isOnline: false,
  },
  {
    id: 'user-9',
    name: 'Ngô Văn Hùng',
    avatar: getPicsumAvatarUrl('Ngô Văn Hùng'),
    job: 'Full Stack Developer',
    isOnline: true,
  },
  {
    id: 'user-10',
    name: 'Đỗ Thị Lan',
    avatar: getPicsumAvatarUrl('Đỗ Thị Lan'),
    job: 'Content Creator',
    isOnline: true,
  },
  {
    id: 'user-11',
    name: 'Phan Văn Minh',
    avatar: getPicsumAvatarUrl('Phan Văn Minh'),
    job: 'DevOps Engineer',
    isOnline: false,
  },
  {
    id: 'user-12',
    name: 'Võ Thị Nga',
    avatar: getPicsumAvatarUrl('Võ Thị Nga'),
    job: 'Product Manager',
    isOnline: true,
  },
];

/**
 * Lấy user theo ID
 */
export const getUserById = (id: string): MockUser | undefined => {
  return mockUsers.find(user => user.id === id);
};

/**
 * Lấy user theo tên
 */
export const getUserByName = (name: string): MockUser | undefined => {
  return mockUsers.find(user => user.name === name);
};

