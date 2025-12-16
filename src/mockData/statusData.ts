/**
 * Mock data cho Status feature - Tiếng Việt
 */

import { mockUsers } from './usersData';
import { getPicsumAvatarUrl, getPicsumStatusImageUrl } from '@/lib/imageService';

export interface Status {
  id: string;
  image: string;
  timestamp: string;
  viewedBy: number;
}

export interface StatusUser {
  id: string;
  name: string;
  avatar: string;
  statuses: Status[];
  viewedBy: number;
  lastStatusTime: string;
}

// Status images từ Picsum Photos
const getStatusImage = (index: number, userId: string): string => {
  return getPicsumStatusImageUrl(`${userId}-status-${index}`, 800, 1000);
};

// Helper để tạo timestamp
const getTimestamp = (hoursAgo: number): string => {
  const now = new Date();
  now.setHours(now.getHours() - hoursAgo);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Helper để format thời gian status
const getStatusTime = (hoursAgo: number): string => {
  if (hoursAgo < 1) {
    return 'Vừa xong';
  } else if (hoursAgo < 24) {
    return `Hôm nay lúc ${getTimestamp(hoursAgo)}`;
  } else if (hoursAgo < 48) {
    return `Hôm qua lúc ${getTimestamp(hoursAgo - 24)}`;
  } else {
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo} ngày trước`;
  }
};

export const mockStatusUsers: StatusUser[] = [
  {
    id: mockUsers[0].id,
    name: mockUsers[0].name,
    avatar: getPicsumAvatarUrl(mockUsers[0].name),
    viewedBy: 25,
    lastStatusTime: getStatusTime(2),
    statuses: [
      {
        id: 'status-1-1',
        image: getStatusImage(1, mockUsers[0].id),
        timestamp: getStatusTime(2),
        viewedBy: 25,
      },
      {
        id: 'status-1-2',
        image: getStatusImage(2, mockUsers[0].id),
        timestamp: getStatusTime(3),
        viewedBy: 20,
      },
    ],
  },
  {
    id: mockUsers[1].id,
    name: mockUsers[1].name,
    avatar: getPicsumAvatarUrl(mockUsers[1].name),
    viewedBy: 18,
    lastStatusTime: getStatusTime(5),
    statuses: [
      {
        id: 'status-2-1',
        image: getStatusImage(1, mockUsers[1].id),
        timestamp: getStatusTime(5),
        viewedBy: 18,
      },
      {
        id: 'status-2-2',
        image: getStatusImage(2, mockUsers[1].id),
        timestamp: getStatusTime(6),
        viewedBy: 15,
      },
      {
        id: 'status-2-3',
        image: getStatusImage(3, mockUsers[1].id),
        timestamp: getStatusTime(7),
        viewedBy: 12,
      },
    ],
  },
  {
    id: mockUsers[2].id,
    name: mockUsers[2].name,
    avatar: getPicsumAvatarUrl(mockUsers[2].name),
    viewedBy: 32,
    lastStatusTime: getStatusTime(12),
    statuses: [
      {
        id: 'status-3-1',
        image: getStatusImage(1, mockUsers[2].id),
        timestamp: getStatusTime(12),
        viewedBy: 32,
      },
      {
        id: 'status-3-2',
        image: getStatusImage(2, mockUsers[2].id),
        timestamp: getStatusTime(13),
        viewedBy: 28,
      },
    ],
  },
  {
    id: mockUsers[3].id,
    name: mockUsers[3].name,
    avatar: getPicsumAvatarUrl(mockUsers[3].name),
    viewedBy: 15,
    lastStatusTime: getStatusTime(1),
    statuses: [
      {
        id: 'status-4-1',
        image: getStatusImage(1, mockUsers[3].id),
        timestamp: getStatusTime(1),
        viewedBy: 15,
      },
    ],
  },
  {
    id: mockUsers[4].id,
    name: mockUsers[4].name,
    avatar: getPicsumAvatarUrl(mockUsers[4].name),
    viewedBy: 22,
    lastStatusTime: getStatusTime(24),
    statuses: [
      {
        id: 'status-5-1',
        image: getStatusImage(1, mockUsers[4].id),
        timestamp: getStatusTime(24),
        viewedBy: 22,
      },
      {
        id: 'status-5-2',
        image: getStatusImage(2, mockUsers[4].id),
        timestamp: getStatusTime(25),
        viewedBy: 18,
      },
      {
        id: 'status-5-3',
        image: getStatusImage(3, mockUsers[4].id),
        timestamp: getStatusTime(26),
        viewedBy: 15,
      },
    ],
  },
  {
    id: mockUsers[5].id,
    name: mockUsers[5].name,
    avatar: getPicsumAvatarUrl(mockUsers[5].name),
    viewedBy: 28,
    lastStatusTime: getStatusTime(8),
    statuses: [
      {
        id: 'status-6-1',
        image: getStatusImage(1, mockUsers[5].id),
        timestamp: getStatusTime(8),
        viewedBy: 28,
      },
      {
        id: 'status-6-2',
        image: getStatusImage(2, mockUsers[5].id),
        timestamp: getStatusTime(9),
        viewedBy: 25,
      },
    ],
  },
  {
    id: mockUsers[6].id,
    name: mockUsers[6].name,
    avatar: getPicsumAvatarUrl(mockUsers[6].name),
    viewedBy: 19,
    lastStatusTime: getStatusTime(4),
    statuses: [
      {
        id: 'status-7-1',
        image: getStatusImage(1, mockUsers[6].id),
        timestamp: getStatusTime(4),
        viewedBy: 19,
      },
      {
        id: 'status-7-2',
        image: getStatusImage(2, mockUsers[6].id),
        timestamp: getStatusTime(5),
        viewedBy: 16,
      },
      {
        id: 'status-7-3',
        image: getStatusImage(3, mockUsers[6].id),
        timestamp: getStatusTime(6),
        viewedBy: 12,
      },
      {
        id: 'status-7-4',
        image: getStatusImage(4, mockUsers[6].id),
        timestamp: getStatusTime(7),
        viewedBy: 10,
      },
    ],
  },
  {
    id: mockUsers[7].id,
    name: mockUsers[7].name,
    avatar: getPicsumAvatarUrl(mockUsers[7].name),
    viewedBy: 14,
    lastStatusTime: getStatusTime(36),
    statuses: [
      {
        id: 'status-8-1',
        image: getStatusImage(1, mockUsers[7].id),
        timestamp: getStatusTime(36),
        viewedBy: 14,
      },
    ],
  },
];

// My Status (status của chính user)
export const myStatus: StatusUser = {
  id: 'my-status',
  name: 'Trạng thái của tôi',
  avatar: getPicsumAvatarUrl('Trạng thái của tôi'),
  viewedBy: 25,
  lastStatusTime: getStatusTime(1),
  statuses: [
    {
      id: 'my-status-1',
      image: getStatusImage(1, 'my-status'),
      timestamp: getStatusTime(1),
      viewedBy: 25,
    },
    {
      id: 'my-status-2',
      image: getStatusImage(2, 'my-status'),
      timestamp: getStatusTime(2),
      viewedBy: 20,
    },
    {
      id: 'my-status-3',
      image: getStatusImage(3, 'my-status'),
      timestamp: getStatusTime(3),
      viewedBy: 18,
    },
    {
      id: 'my-status-4',
      image: getStatusImage(4, 'my-status'),
      timestamp: getStatusTime(4),
      viewedBy: 15,
    },
    {
      id: 'my-status-5',
      image: getStatusImage(5, 'my-status'),
      timestamp: getStatusTime(5),
      viewedBy: 12,
    },
  ],
};

