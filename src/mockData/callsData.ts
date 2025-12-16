/**
 * Mock data cho Calls feature - Tiếng Việt
 */

import { mockUsers } from './usersData';

export type CallType = 
  | 'missed-audio' 
  | 'missed-video' 
  | 'ended-audio' 
  | 'ended-video' 
  | 'incoming' 
  | 'progress' 
  | 'completed' 
  | 'rejected';

export interface Call {
  id: string;
  type: CallType;
  callerName: string;
  callerAvatar: string;
  duration?: string;
  timestamp: string;
  isIncoming: boolean;
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

// Helper để tạo duration ngẫu nhiên
const randomDuration = (): string => {
  const minutes = Math.floor(Math.random() * 15) + 1;
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes} phút ${seconds} giây`;
};

export const mockCalls: Call[] = [
  // Hôm nay
  {
    id: 'call-1',
    type: 'missed-audio',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '10 phút 23 giây',
    timestamp: formatTime(2),
    isIncoming: true,
  },
  {
    id: 'call-2',
    type: 'ended-audio',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '07 phút 34 giây',
    timestamp: formatTime(3),
    isIncoming: false,
  },
  {
    id: 'call-3',
    type: 'missed-video',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '10 phút 23 giây',
    timestamp: formatTime(4),
    isIncoming: true,
  },
  {
    id: 'call-4',
    type: 'ended-video',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '07 phút 34 giây',
    timestamp: formatTime(5),
    isIncoming: false,
  },
  {
    id: 'call-5',
    type: 'missed-audio',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '10 phút 23 giây',
    timestamp: formatTime(6),
    isIncoming: true,
  },
  {
    id: 'call-6',
    type: 'ended-video',
    callerName: mockUsers[0].name,
    callerAvatar: mockUsers[0].avatar,
    duration: '07 phút 34 giây',
    timestamp: formatTime(7),
    isIncoming: false,
  },
  {
    id: 'call-7',
    type: 'incoming',
    callerName: mockUsers[1].name,
    callerAvatar: mockUsers[1].avatar,
    timestamp: formatTime(1),
    isIncoming: true,
  },
  {
    id: 'call-8',
    type: 'progress',
    callerName: mockUsers[2].name,
    callerAvatar: mockUsers[2].avatar,
    timestamp: formatTime(0.5),
    isIncoming: true,
  },
  {
    id: 'call-9',
    type: 'completed',
    callerName: mockUsers[3].name,
    callerAvatar: mockUsers[3].avatar,
    duration: '10 phút 23 giây',
    timestamp: formatTime(8),
    isIncoming: false,
  },
  {
    id: 'call-10',
    type: 'rejected',
    callerName: mockUsers[4].name,
    callerAvatar: mockUsers[4].avatar,
    timestamp: formatTime(9),
    isIncoming: true,
  },
  // Hôm qua
  {
    id: 'call-11',
    type: 'ended-audio',
    callerName: mockUsers[5].name,
    callerAvatar: mockUsers[5].avatar,
    duration: '15 phút 45 giây',
    timestamp: formatTime(25),
    isIncoming: false,
  },
  {
    id: 'call-12',
    type: 'missed-video',
    callerName: mockUsers[6].name,
    callerAvatar: mockUsers[6].avatar,
    duration: '05 phút 12 giây',
    timestamp: formatTime(26),
    isIncoming: true,
  },
  {
    id: 'call-13',
    type: 'ended-video',
    callerName: mockUsers[7].name,
    callerAvatar: mockUsers[7].avatar,
    duration: '20 phút 30 giây',
    timestamp: formatTime(27),
    isIncoming: false,
  },
  {
    id: 'call-14',
    type: 'missed-audio',
    callerName: mockUsers[8].name,
    callerAvatar: mockUsers[8].avatar,
    duration: '08 phút 15 giây',
    timestamp: formatTime(28),
    isIncoming: true,
  },
  {
    id: 'call-15',
    type: 'ended-audio',
    callerName: mockUsers[9].name,
    callerAvatar: mockUsers[9].avatar,
    duration: '12 phút 50 giây',
    timestamp: formatTime(30),
    isIncoming: false,
  },
];

// Helper để lấy label tiếng Việt cho call type
export const getCallTypeLabel = (type: CallType): string => {
  const labels: Record<CallType, string> = {
    'missed-audio': 'Cuộc gọi âm thanh bị nhỡ',
    'missed-video': 'Cuộc gọi video bị nhỡ',
    'ended-audio': 'Cuộc gọi âm thanh đã kết thúc',
    'ended-video': 'Cuộc gọi video đã kết thúc',
    'incoming': 'Cuộc gọi đến',
    'progress': 'Cuộc gọi đang diễn ra',
    'completed': 'Cuộc gọi đã hoàn thành',
    'rejected': 'Cuộc gọi bị từ chối',
  };
  return labels[type];
};

// Helper để lấy icon class cho call type
export const getCallTypeIcon = (type: CallType): string => {
  const icons: Record<CallType, string> = {
    'missed-audio': 'ti ti-phone-call',
    'missed-video': 'ti ti-video',
    'ended-audio': 'ti ti-phone-incoming',
    'ended-video': 'ti ti-video',
    'incoming': 'ti ti-phone-call',
    'progress': 'ti ti-access-point',
    'completed': 'ti ti-phone-call',
    'rejected': 'ti ti-phone-off',
  };
  return icons[type];
};

// Helper để lấy background color class cho call type
export const getCallTypeBgClass = (type: CallType): string => {
  const bgClasses: Record<CallType, string> = {
    'missed-audio': 'bg-danger',
    'missed-video': 'bg-danger',
    'ended-audio': 'bg-success',
    'ended-video': 'bg-success',
    'incoming': 'bg-success',
    'progress': 'bg-success',
    'completed': 'bg-white',
    'rejected': 'bg-danger',
  };
  return bgClasses[type];
};

