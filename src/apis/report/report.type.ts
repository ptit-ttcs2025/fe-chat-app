/**
 * Report API Types & Interfaces
 * Định nghĩa types cho Report & Admin Module
 * Theo API_DOCUMENTATION.md - Report & Admin Module APIs
 */

// ===========================
// ENUMS
// ===========================

export enum ViolationType {
  SPAM = 'SPAM',
  SCAM = 'SCAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  FAKE_ACCOUNT = 'FAKE_ACCOUNT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum AdminActionType {
  SUSPEND = 'SUSPEND',
  BAN = 'BAN',
  REJECT_REPORT = 'REJECT_REPORT',
  RESTORE = 'RESTORE',
}

export enum SuspendDuration {
  SEVEN_DAYS = 'SEVEN_DAYS',
  THIRTY_DAYS = 'THIRTY_DAYS',
  NINETY_DAYS = 'NINETY_DAYS',
  PERMANENT = 'PERMANENT',
}

// ===========================
// DISPLAY LABELS
// ===========================

export const ViolationTypeLabels: Record<ViolationType, string> = {
  [ViolationType.SPAM]: 'Spam / Quảng cáo',
  [ViolationType.SCAM]: 'Lừa đảo',
  [ViolationType.HARASSMENT]: 'Quấy rối',
  [ViolationType.INAPPROPRIATE_CONTENT]: 'Nội dung không phù hợp',
  [ViolationType.FAKE_ACCOUNT]: 'Tài khoản giả mạo',
  [ViolationType.OTHER]: 'Khác',
};

export const ReportStatusLabels: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: 'Chờ xử lý',
  // [ReportStatus.UNDER_REVIEW]: 'Đang xem xét',
  [ReportStatus.RESOLVED]: 'Đã xử lý',
  [ReportStatus.REJECTED]: 'Bị từ chối',
};

export const SuspendDurationLabels: Record<SuspendDuration, string> = {
  [SuspendDuration.SEVEN_DAYS]: '7 ngày',
  [SuspendDuration.THIRTY_DAYS]: '30 ngày',
  [SuspendDuration.NINETY_DAYS]: '90 ngày',
  [SuspendDuration.PERMANENT]: 'Vĩnh viễn',
};

// ===========================
// RESPONSE TYPES
// ===========================

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  data?: T;
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  sortBy: string;
  isDescending: boolean;
}

export interface PaginatedResponse<T> {
  meta: PaginationMeta;
  results: T[];
}

// ===========================
// USER INFO TYPES
// ===========================

export interface UserBasicInfo {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  violationCount?: number;
}

// ===========================
// VIOLATION HISTORY
// ===========================

export interface ViolationHistory {
  id: string;
  actionType: AdminActionType;
  reason: string;
  adminName: string;
  createdAt: string;
  metadata?: string; // JSON string
}

// ===========================
// USER REPORT DTOs
// ===========================

export interface CreateReportRequest {
  targetUserId: string;
  violationType: ViolationType;
  description: string;
  evidenceUrl?: string;
  chatLogSnapshot?: string;
}

export interface ReportDto {
  id: string;
  reporterId: string;
  targetUserId: string;
  violationType: ViolationType;
  description: string;
  evidenceUrl?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface MyReportDto {
  id: string;
  targetUserId: string;
  targetUserName: string;
  violationType: ViolationType;
  description: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ===========================
// ADMIN REPORT DTOs
// ===========================

export interface ReportListItem {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterAvatar?: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  targetUserAvatar?: string;
  violationType: ViolationType;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
}

export interface ReportDetail {
  id: string;
  violationType: ViolationType;
  description: string;
  evidenceUrl?: string;
  chatLogSnapshot?: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
  reporterInfo: UserBasicInfo;
  targetUserInfo: UserBasicInfo;
  violationHistory: ViolationHistory[];
}

export interface AdminActionRequest {
  action: AdminActionType;
  suspendDuration?: SuspendDuration; // Required if action = SUSPEND
  reason: string;
}

// ===========================
// WEBSOCKET DTOs
// ===========================

export interface ForceLogoutMessage {
  reason: string;
  timestamp: string;
  message: string;
}

export interface AccountRestoredMessage {
  message: string;
  timestamp: string;
}

export interface NewReportNotification {
  reportId: string;
  reporterName: string;
  reporterEmail: string;
  targetUserName: string;
  targetUserEmail: string;
  violationType: ViolationType;
  description: string;
  createdAt: string;
}

// ===========================
// FILTER PARAMS
// ===========================

export interface ReportListFilters {
  status?: ReportStatus;
  violationType?: ViolationType;
  page?: number;
  size?: number;
}

