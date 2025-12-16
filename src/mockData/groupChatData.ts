/**
 * Mock data cho Group Chat feature - Tiếng Việt
 */

import { mockUsers } from './usersData';
import { getPicsumGroupImageUrl, getPicsumChatImageUrl } from '@/lib/imageService';

export type MessageType = 'text' | 'image' | 'file' | 'voice';

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: MessageType;
  timestamp: string;
  isOwn: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  role?: 'admin' | 'member';
}

export interface GroupInfo {
  id: string;
  name: string;
  avatar: string;
  totalMembers: number;
  onlineMembers: number;
  members: GroupMember[];
}

// Helper để format thời gian
const formatTime = (hoursAgo: number): string => {
  const now = new Date();
  now.setHours(now.getHours() - hoursAgo);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Thông tin nhóm
export const mockGroupInfo: GroupInfo = {
  id: 'group-1',
  name: 'Nhóm Dự Án Chat App',
  avatar: getPicsumGroupImageUrl('Nhóm Dự Án Chat App'),
  totalMembers: 40,
  onlineMembers: 24,
  members: [
    {
      id: mockUsers[0].id,
      name: mockUsers[0].name,
      avatar: mockUsers[0].avatar,
      isOnline: true,
      role: 'admin',
    },
    {
      id: mockUsers[1].id,
      name: mockUsers[1].name,
      avatar: mockUsers[1].avatar,
      isOnline: true,
      role: 'member',
    },
    {
      id: mockUsers[2].id,
      name: mockUsers[2].name,
      avatar: mockUsers[2].avatar,
      isOnline: false,
      role: 'member',
    },
    {
      id: mockUsers[3].id,
      name: mockUsers[3].name,
      avatar: mockUsers[3].avatar,
      isOnline: true,
      role: 'member',
    },
    {
      id: mockUsers[4].id,
      name: mockUsers[4].name,
      avatar: mockUsers[4].avatar,
      isOnline: false,
      role: 'member',
    },
    {
      id: mockUsers[5].id,
      name: mockUsers[5].name,
      avatar: mockUsers[5].avatar,
      isOnline: true,
      role: 'member',
    },
    {
      id: mockUsers[6].id,
      name: mockUsers[6].name,
      avatar: mockUsers[6].avatar,
      isOnline: true,
      role: 'admin',
    },
    {
      id: mockUsers[7].id,
      name: mockUsers[7].name,
      avatar: mockUsers[7].avatar,
      isOnline: false,
      role: 'member',
    },
    {
      id: mockUsers[8].id,
      name: mockUsers[8].name,
      avatar: mockUsers[8].avatar,
      isOnline: true,
      role: 'member',
    },
    {
      id: mockUsers[9].id,
      name: mockUsers[9].name,
      avatar: mockUsers[9].avatar,
      isOnline: true,
      role: 'member',
    },
  ],
};

// Current user ID (giả sử là user đầu tiên)
const currentUserId = mockUsers[0].id;

// Tin nhắn trong nhóm
export const mockGroupMessages: GroupMessage[] = [
  {
    id: 'msg-1',
    senderId: mockUsers[1].id,
    senderName: mockUsers[1].name,
    senderAvatar: mockUsers[1].avatar,
    content: 'Chào mọi người! Dự án chat app đang tiến triển tốt 🎉',
    type: 'text',
    timestamp: formatTime(5),
    isOwn: false,
  },
  {
    id: 'msg-2',
    senderId: mockUsers[2].id,
    senderName: mockUsers[2].name,
    senderAvatar: mockUsers[2].avatar,
    content: 'Tuyệt vời! Khi nào có thể test được nhỉ?',
    type: 'text',
    timestamp: formatTime(4.5),
    isOwn: false,
  },
  {
    id: 'msg-3',
    senderId: currentUserId,
    senderName: 'Bạn',
    senderAvatar: mockUsers[0].avatar,
    content: 'Khoảng tuần sau sẽ có bản beta để test. Mọi người chuẩn bị feedback nhé!',
    type: 'text',
    timestamp: formatTime(4),
    isOwn: true,
  },
  {
    id: 'msg-4',
    senderId: mockUsers[3].id,
    senderName: mockUsers[3].name,
    senderAvatar: mockUsers[3].avatar,
    content: getPicsumChatImageUrl('group-image-1', 600, 400),
    type: 'image',
    timestamp: formatTime(3.5),
    isOwn: false,
  },
  {
    id: 'msg-5',
    senderId: mockUsers[4].id,
    senderName: mockUsers[4].name,
    senderAvatar: mockUsers[4].avatar,
    content: 'Ảnh mockup UI trông đẹp quá! 👍',
    type: 'text',
    timestamp: formatTime(3),
    isOwn: false,
  },
  {
    id: 'msg-6',
    senderId: mockUsers[5].id,
    senderName: mockUsers[5].name,
    senderAvatar: mockUsers[5].avatar,
    content: 'Tôi đã hoàn thành phần authentication. Ai review giúp tôi nhé!',
    type: 'text',
    timestamp: formatTime(2.5),
    isOwn: false,
  },
  {
    id: 'msg-7',
    senderId: currentUserId,
    senderName: 'Bạn',
    senderAvatar: mockUsers[0].avatar,
    content: 'Tôi sẽ review ngay. Gửi link PR đi!',
    type: 'text',
    timestamp: formatTime(2),
    isOwn: true,
  },
  {
    id: 'msg-8',
    senderId: mockUsers[6].id,
    senderName: mockUsers[6].name,
    senderAvatar: mockUsers[6].avatar,
    content: 'document.pdf',
    type: 'file',
    timestamp: formatTime(1.5),
    isOwn: false,
  },
  {
    id: 'msg-9',
    senderId: mockUsers[6].id,
    senderName: mockUsers[6].name,
    senderAvatar: mockUsers[6].avatar,
    content: 'Đây là tài liệu spec mới nhất. Mọi người xem và cho ý kiến nhé!',
    type: 'text',
    timestamp: formatTime(1.4),
    isOwn: false,
  },
  {
    id: 'msg-10',
    senderId: mockUsers[7].id,
    senderName: mockUsers[7].name,
    senderAvatar: mockUsers[7].avatar,
    content: 'Cảm ơn bạn! Tôi sẽ đọc ngay.',
    type: 'text',
    timestamp: formatTime(1.2),
    isOwn: false,
  },
  {
    id: 'msg-11',
    senderId: mockUsers[8].id,
    senderName: mockUsers[8].name,
    senderAvatar: mockUsers[8].avatar,
    content: getPicsumChatImageUrl('group-image-2', 600, 400),
    type: 'image',
    timestamp: formatTime(1),
    isOwn: false,
  },
  {
    id: 'msg-12',
    senderId: currentUserId,
    senderName: 'Bạn',
    senderAvatar: mockUsers[0].avatar,
    content: 'Ảnh này là từ design mới phải không?',
    type: 'text',
    timestamp: formatTime(0.8),
    isOwn: true,
  },
  {
    id: 'msg-13',
    senderId: mockUsers[9].id,
    senderName: mockUsers[9].name,
    senderAvatar: mockUsers[9].avatar,
    content: 'Đúng rồi! Đây là design cho dark mode.',
    type: 'text',
    timestamp: formatTime(0.5),
    isOwn: false,
  },
  {
    id: 'msg-14',
    senderId: mockUsers[1].id,
    senderName: mockUsers[1].name,
    senderAvatar: mockUsers[1].avatar,
    content: 'voice-message.mp3',
    type: 'voice',
    timestamp: formatTime(0.3),
    isOwn: false,
  },
  {
    id: 'msg-15',
    senderId: currentUserId,
    senderName: 'Bạn',
    senderAvatar: mockUsers[0].avatar,
    content: 'Tuyệt! Dark mode sẽ làm app trông chuyên nghiệp hơn nhiều 🌙',
    type: 'text',
    timestamp: formatTime(0.1),
    isOwn: true,
  },
  {
    id: 'msg-16',
    senderId: mockUsers[3].id,
    senderName: mockUsers[3].name,
    senderAvatar: mockUsers[3].avatar,
    content: 'Đồng ý! Tôi cũng thích dark mode hơn.',
    type: 'text',
    timestamp: formatTime(0.05),
    isOwn: false,
  },
  {
    id: 'msg-17',
    senderId: mockUsers[5].id,
    senderName: mockUsers[5].name,
    senderAvatar: mockUsers[5].avatar,
    content: 'Khi nào có thể release bản dark mode vậy?',
    type: 'text',
    timestamp: formatTime(0.02),
    isOwn: false,
  },
  {
    id: 'msg-18',
    senderId: currentUserId,
    senderName: 'Bạn',
    senderAvatar: mockUsers[0].avatar,
    content: 'Khoảng 2 tuần nữa. Hiện tại đang fix các bug còn lại.',
    type: 'text',
    timestamp: formatTime(0.01),
    isOwn: true,
  },
];

