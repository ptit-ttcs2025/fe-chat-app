# 📋 Tài Liệu Tích Hợp Luồng Báo Cáo (Report) - Frontend

## 📑 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [API Endpoints](#api-endpoints)
3. [Cấu Trúc Dữ Liệu](#cấu-trúc-dữ-liệu)
4. [Luồng Xử Lý](#luồng-xử-lý)
5. [WebSocket Notifications](#websocket-notifications)
6. [Validation Rules](#validation-rules)
7. [Error Handling](#error-handling)
8. [Ví Dụ Code](#ví-dụ-code)

---

## 🎯 Tổng Quan

Hệ thống báo cáo cho phép người dùng báo cáo các hành vi vi phạm trong ứng dụng chat. Admin có thể xem, xử lý và thực hiện các hành động phù hợp.

### Tính Năng Chính
- ✅ User tạo báo cáo vi phạm
- ✅ User xem lịch sử báo cáo đã gửi
- ✅ Admin xem danh sách báo cáo với filter
- ✅ Admin xem chi tiết báo cáo và lịch sử vi phạm
- ✅ Admin xử lý báo cáo (tạm khóa, cấm, từ chối, khôi phục)
- ✅ Real-time notification qua WebSocket

### Giới Hạn
- ⚠️ Tối đa **10 báo cáo/ngày** cho mỗi user
- ⚠️ Không thể tự báo cáo chính mình
- ⚠️ Không thể tạo báo cáo trùng lặp (PENDING/UNDER_REVIEW) cho cùng một user

---

## 🔌 API Endpoints

### Base URL
```
/api/v1
```

### Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

### 👤 User APIs

#### 1. Tạo Báo Cáo Vi Phạm

**Endpoint:** `POST /reports`

**Description:** Tạo báo cáo mới về một user vi phạm.

**Request Body:**
```json
{
  "targetUserId": "string (required)",
  "violationType": "SPAM | SCAM | HARASSMENT | INAPPROPRIATE_CONTENT | FAKE_ACCOUNT | OTHER",
  "description": "string (required, max 500 chars)",
  "evidenceUrl": "string (optional, URL của file đính kèm)",
  "chatLogSnapshot": "string (optional, max 2000 chars)"
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Báo cáo đã được gửi thành công",
  "data": {
    "id": "report-uuid",
    "reporterId": "current-user-id",
    "targetUserId": "target-user-id",
    "violationType": "SPAM",
    "description": "User này spam tin nhắn quảng cáo",
    "evidenceUrl": "https://example.com/evidence.jpg",
    "status": "PENDING",
    "createdAt": "2025-12-30T10:00:00Z"
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `403 Forbidden`: Tự report chính mình, vượt quá giới hạn 10 reports/ngày
- `404 Not Found`: Target user không tồn tại
- `409 Conflict`: Đã có báo cáo PENDING/UNDER_REVIEW cho user này

---

#### 2. Xem Báo Cáo Đã Gửi

**Endpoint:** `GET /reports/my?page=0&size=20`

**Description:** Lấy danh sách báo cáo mà user hiện tại đã gửi.

**Query Parameters:**
- `page` (optional, default: 0): Số trang
- `size` (optional, default: 20): Số items mỗi trang

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Lấy danh sách báo cáo thành công",
  "data": {
    "results": [
      {
        "id": "report-uuid",
        "targetUserId": "target-user-id",
        "targetUserName": "Tên User",
        "violationType": "SPAM",
        "description": "Mô tả vi phạm",
        "status": "PENDING",
        "adminNote": null,
        "createdAt": "2025-12-30T10:00:00Z",
        "resolvedAt": null
      }
    ],
    "meta": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 1,
      "totalPages": 1,
      "isLast": true,
      "isFirst": true
    }
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Status Values:**
- `PENDING`: Chờ xử lý
- `UNDER_REVIEW`: Đang xem xét
- `RESOLVED`: Đã xử lý
- `REJECTED`: Từ chối

---

### 👨‍💼 Admin APIs

> **Lưu ý:** Tất cả Admin APIs yêu cầu role `ADMIN` trong JWT token.

#### 3. Danh Sách Báo Cáo (Admin)

**Endpoint:** `GET /admin/reports?status=PENDING&violationType=SPAM&page=0&size=20`

**Description:** Lấy danh sách báo cáo với filter theo status và violation type.

**Query Parameters:**
- `status` (optional): `PENDING | UNDER_REVIEW | RESOLVED | REJECTED`
- `violationType` (optional): `SPAM | SCAM | HARASSMENT | INAPPROPRIATE_CONTENT | FAKE_ACCOUNT | OTHER`
- `page` (optional, default: 0): Số trang
- `size` (optional, default: 20): Số items mỗi trang

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Lấy danh sách báo cáo thành công",
  "data": {
    "results": [
      {
        "id": "report-uuid",
        "reporterId": "reporter-user-id",
        "reporterName": "Tên Người Báo Cáo",
        "reporterEmail": "reporter@example.com",
        "targetUserId": "target-user-id",
        "targetUserName": "Tên User Vi Phạm",
        "targetUserEmail": "target@example.com",
        "violationType": "SPAM",
        "description": "Mô tả vi phạm",
        "status": "PENDING",
        "createdAt": "2025-12-30T10:00:00Z",
        "resolvedAt": null,
        "resolvedByName": null
      }
    ],
    "meta": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

---

#### 4. Chi Tiết Báo Cáo (Admin)

**Endpoint:** `GET /admin/reports/{reportId}`

**Description:** Lấy chi tiết báo cáo kèm lịch sử vi phạm của target user.

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Lấy chi tiết báo cáo thành công",
  "data": {
    "id": "report-uuid",
    "violationType": "SPAM",
    "description": "Mô tả chi tiết vi phạm",
    "evidenceUrl": "https://example.com/evidence.jpg",
    "chatLogSnapshot": "Snapshot của chat log",
    "status": "PENDING",
    "adminNote": null,
    "createdAt": "2025-12-30T10:00:00Z",
    "resolvedAt": null,
    "reporterInfo": {
      "id": "reporter-user-id",
      "username": "reporter_username",
      "fullName": "Tên Người Báo Cáo",
      "email": "reporter@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "targetUserInfo": {
      "id": "target-user-id",
      "username": "target_username",
      "fullName": "Tên User Vi Phạm",
      "email": "target@example.com",
      "avatarUrl": "https://example.com/avatar.jpg",
      "status": "ACTIVE | SUSPENDED | BANNED",
      "violationCount": 2
    },
    "violationHistory": [
      {
        "reportId": "previous-report-uuid",
        "violationType": "SCAM",
        "status": "RESOLVED",
        "createdAt": "2025-12-25T10:00:00Z",
        "resolvedAt": "2025-12-26T10:00:00Z",
        "action": "SUSPEND",
        "adminNote": "Đã tạm khóa 7 ngày"
      }
    ]
  },
  "timestamp": "2025-12-30T10:00:00Z"
}
```

---

#### 5. Xử Lý Báo Cáo (Admin)

**Endpoint:** `POST /admin/reports/{reportId}/actions`

**Description:** Admin thực hiện hành động xử lý báo cáo.

**Request Body:**
```json
{
  "action": "SUSPEND | BAN | RESTORE | REJECT_REPORT",
  "suspendDuration": "SEVEN_DAYS | THIRTY_DAYS | NINETY_DAYS | PERMANENT",
  "reason": "string (required, max 500 chars)"
}
```

**Lưu ý:**
- `suspendDuration` chỉ cần khi `action = SUSPEND`
- `action = BAN` sẽ cấm vĩnh viễn (không cần `suspendDuration`)
- `action = REJECT_REPORT` sẽ từ chối báo cáo
- `action = RESTORE` sẽ khôi phục user đã bị suspend/ban

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Xử lý báo cáo thành công",
  "data": null,
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors, action không hợp lệ
- `403 Forbidden`: Không có quyền ADMIN
- `404 Not Found`: Báo cáo không tồn tại
- `409 Conflict`: User đã bị ban, không thể suspend

---

## 📊 Cấu Trúc Dữ Liệu

### ViolationType Enum
```typescript
enum ViolationType {
  SPAM = "SPAM",                      // Spam/Quảng cáo
  SCAM = "SCAM",                      // Lừa đảo
  HARASSMENT = "HARASSMENT",          // Quấy rối
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",  // Nội dung không phù hợp
  FAKE_ACCOUNT = "FAKE_ACCOUNT",      // Tài khoản giả mạo
  OTHER = "OTHER"                     // Khác
}
```

### ReportStatus Enum
```typescript
enum ReportStatus {
  PENDING = "PENDING",        // Chờ xử lý
  UNDER_REVIEW = "UNDER_REVIEW",  // Đang xem xét
  RESOLVED = "RESOLVED",      // Đã xử lý
  REJECTED = "REJECTED"       // Từ chối
}
```

### AdminActionType Enum
```typescript
enum AdminActionType {
  SUSPEND = "SUSPEND",        // Tạm khóa tài khoản
  BAN = "BAN",                // Cấm vĩnh viễn
  RESTORE = "RESTORE",        // Khôi phục tài khoản
  REJECT_REPORT = "REJECT_REPORT"  // Từ chối báo cáo
}
```

### SuspendDuration Enum
```typescript
enum SuspendDuration {
  SEVEN_DAYS = "SEVEN_DAYS",      // 7 ngày
  THIRTY_DAYS = "THIRTY_DAYS",    // 30 ngày
  NINETY_DAYS = "NINETY_DAYS",    // 90 ngày
  PERMANENT = "PERMANENT"         // Vĩnh viễn
}
```

---

## 🔄 Luồng Xử Lý

### User Tạo Báo Cáo

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Chọn user vi phạm
     │ 2. Chọn loại vi phạm
     │ 3. Nhập mô tả (bắt buộc)
     │ 4. Upload evidence (tùy chọn)
     │ 5. Chụp chat log (tùy chọn)
     ▼
┌─────────────────────┐
│  POST /reports      │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  Backend Validation:        │
│  ✓ Không tự report mình     │
│  ✓ Không vượt quá 10/ngày   │
│  ✓ Không trùng lặp          │
│  ✓ Target user tồn tại      │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Create Report      │
│  Status: PENDING    │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Notify Admin       │
│  (WebSocket)        │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Return Report DTO  │
└─────────────────────┘
```

### Admin Xử Lý Báo Cáo

```
┌─────────┐
│  Admin  │
└────┬────┘
     │ 1. Xem danh sách báo cáo (filter)
     │ 2. Xem chi tiết báo cáo
     │ 3. Xem lịch sử vi phạm của user
     │ 4. Quyết định hành động
     ▼
┌──────────────────────────┐
│  POST /admin/reports/    │
│  {id}/actions            │
└────┬─────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│  Backend Processing:        │
│  - Update report status     │
│  - Update user status       │
│  - Record admin action      │
│  - Update violation count   │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Notify Reporter    │
│  (WebSocket)        │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Notify Target User │
│  (if suspended/banned) │
└─────────────────────┘
```

---

## 📡 WebSocket Notifications

### Kết Nối WebSocket

**Endpoint:** `ws://your-domain/ws`

**Connection Headers:**
```
Authorization: Bearer <jwt-token>
```

**Subscribe Topics:**

1. **User Notifications (Reporter):**
```
/user/queue/notifications
```

2. **Admin Notifications:**
```
/user/queue/admin-notifications
```

---

### Notification Types

#### 1. Báo Cáo Đã Được Xử Lý (Reporter)

**Topic:** `/user/queue/notifications`

**Message Type:** `REPORT_STATUS_UPDATE`

```json
{
  "type": "REPORT_STATUS_UPDATE",
  "reportId": "report-uuid",
  "status": "RESOLVED",
  "adminNote": "Đã xử lý: Tạm khóa user 7 ngày",
  "resolvedAt": "2025-12-30T11:00:00Z",
  "timestamp": "2025-12-30T11:00:00Z"
}
```

#### 2. Có Báo Cáo Mới (Admin)

**Topic:** `/user/queue/admin-notifications`

**Message Type:** `NEW_REPORT`

```json
{
  "type": "NEW_REPORT",
  "reportId": "report-uuid",
  "reporterName": "Tên Người Báo Cáo",
  "targetUserName": "Tên User Vi Phạm",
  "violationType": "SPAM",
  "createdAt": "2025-12-30T10:00:00Z",
  "timestamp": "2025-12-30T10:00:00Z"
}
```

#### 3. Cập Nhật Trạng Thái Báo Cáo (Admin)

**Topic:** `/user/queue/admin-notifications`

**Message Type:** `REPORT_STATUS_UPDATE`

```json
{
  "type": "REPORT_STATUS_UPDATE",
  "reportId": "report-uuid",
  "adminId": "admin-user-id",
  "adminName": "Tên Admin",
  "action": "SUSPEND",
  "status": "RESOLVED",
  "targetUserId": "target-user-id",
  "targetUserName": "Tên User",
  "timestamp": "2025-12-30T11:00:00Z",
  "message": "Báo cáo đã được xử lý: Tạm khóa user 7 ngày"
}
```

---

## ✅ Validation Rules

### CreateReportRequest

| Field | Required | Max Length | Notes |
|-------|----------|------------|-------|
| `targetUserId` | ✅ | - | Không được trống, không được là chính mình |
| `violationType` | ✅ | - | Phải là một trong các giá trị enum |
| `description` | ✅ | 500 chars | Không được trống |
| `evidenceUrl` | ❌ | - | URL hợp lệ (nếu có) |
| `chatLogSnapshot` | ❌ | 2000 chars | - |

### Rate Limits

- ⚠️ **10 reports/ngày** cho mỗi user
- ⚠️ Không thể tạo báo cáo trùng lặp (PENDING/UNDER_REVIEW) cho cùng target user trong cùng ngày

### AdminActionRequest

| Field | Required | When | Max Length |
|-------|----------|------|------------|
| `action` | ✅ | Always | - |
| `suspendDuration` | ⚠️ | `action = SUSPEND` | - |
| `reason` | ✅ | Always | 500 chars |

---

## ❌ Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error code",
  "timestamp": "2025-12-30T10:00:00Z"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `CANNOT_REPORT_SELF` | 403 | Không thể tự báo cáo chính mình |
| `DAILY_REPORT_LIMIT_EXCEEDED` | 403 | Đã vượt quá giới hạn 10 báo cáo/ngày |
| `DUPLICATE_REPORT` | 409 | Đã có báo cáo PENDING/UNDER_REVIEW cho user này |
| `USER_NOT_FOUND` | 404 | Target user không tồn tại |
| `REPORT_NOT_FOUND` | 404 | Báo cáo không tồn tại |
| `INVALID_ACTION` | 400 | Hành động không hợp lệ |
| `USER_ALREADY_BANNED` | 409 | User đã bị ban, không thể suspend |

---

## 💻 Ví Dụ Code

### React/TypeScript Example

```typescript
// types/report.ts
export enum ViolationType {
  SPAM = "SPAM",
  SCAM = "SCAM",
  HARASSMENT = "HARASSMENT",
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  FAKE_ACCOUNT = "FAKE_ACCOUNT",
  OTHER = "OTHER"
}

export enum ReportStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED"
}

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

// services/reportService.ts
import axios from 'axios';

const API_BASE_URL = '/api/v1';

export const reportService = {
  // Tạo báo cáo
  async createReport(data: CreateReportRequest): Promise<ReportDto> {
    const response = await axios.post(
      `${API_BASE_URL}/reports`,
      data,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.data;
  },

  // Lấy danh sách báo cáo đã gửi
  async getMyReports(page = 0, size = 20) {
    const response = await axios.get(
      `${API_BASE_URL}/reports/my`,
      {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.data;
  },

  // Admin: Lấy danh sách báo cáo
  async getReports(filters?: {
    status?: ReportStatus;
    violationType?: ViolationType;
    page?: number;
    size?: number;
  }) {
    const response = await axios.get(
      `${API_BASE_URL}/admin/reports`,
      {
        params: filters,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.data;
  },

  // Admin: Lấy chi tiết báo cáo
  async getReportDetail(reportId: string) {
    const response = await axios.get(
      `${API_BASE_URL}/admin/reports/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.data;
  },

  // Admin: Xử lý báo cáo
  async processReport(
    reportId: string,
    action: {
      action: string;
      suspendDuration?: string;
      reason: string;
    }
  ) {
    const response = await axios.post(
      `${API_BASE_URL}/admin/reports/${reportId}/actions`,
      action,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  }
};
```

### Report Form Component

```typescript
// components/ReportForm.tsx
import React, { useState } from 'react';
import { reportService } from '../services/reportService';
import { ViolationType } from '../types/report';

interface ReportFormProps {
  targetUserId: string;
  targetUserName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  targetUserId,
  targetUserName,
  onSuccess,
  onCancel
}) => {
  const [violationType, setViolationType] = useState<ViolationType>(ViolationType.SPAM);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await reportService.createReport({
        targetUserId,
        violationType,
        description,
        evidenceUrl: evidenceUrl || undefined
      });

      alert('Báo cáo đã được gửi thành công!');
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <h3>Báo cáo vi phạm: {targetUserName}</h3>

      <div>
        <label>Loại vi phạm *</label>
        <select
          value={violationType}
          onChange={(e) => setViolationType(e.target.value as ViolationType)}
          required
        >
          <option value={ViolationType.SPAM}>Spam/Quảng cáo</option>
          <option value={ViolationType.SCAM}>Lừa đảo</option>
          <option value={ViolationType.HARASSMENT}>Quấy rối</option>
          <option value={ViolationType.INAPPROPRIATE_CONTENT}>Nội dung không phù hợp</option>
          <option value={ViolationType.FAKE_ACCOUNT}>Tài khoản giả mạo</option>
          <option value={ViolationType.OTHER}>Khác</option>
        </select>
      </div>

      <div>
        <label>Mô tả vi phạm *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={500}
          rows={5}
          placeholder="Mô tả chi tiết về hành vi vi phạm..."
        />
        <small>{description.length}/500 ký tự</small>
      </div>

      <div>
        <label>Link bằng chứng (tùy chọn)</label>
        <input
          type="url"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="https://example.com/evidence.jpg"
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button type="button" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
        </button>
      </div>
    </form>
  );
};
```

### WebSocket Integration

```typescript
// hooks/useReportNotifications.ts
import { useEffect, useState } from 'react';
import { Client, Message } from '@stomp/stompjs';

export const useReportNotifications = (userId: string, isAdmin: boolean = false) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket connected');

        // Subscribe to notifications
        const topic = isAdmin 
          ? '/user/queue/admin-notifications'
          : '/user/queue/notifications';

        stompClient.subscribe(topic, (message: Message) => {
          const notification = JSON.parse(message.body);
          
          // Handle different notification types
          if (notification.type === 'REPORT_STATUS_UPDATE') {
            setNotifications(prev => [notification, ...prev]);
            
            // Show toast notification
            showToast({
              type: 'info',
              message: `Báo cáo ${notification.reportId} đã được cập nhật: ${notification.status}`
            });
          } else if (notification.type === 'NEW_REPORT' && isAdmin) {
            setNotifications(prev => [notification, ...prev]);
            
            showToast({
              type: 'warning',
              message: `Có báo cáo mới: ${notification.reporterName} báo cáo ${notification.targetUserName}`
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, [userId, isAdmin]);

  return { notifications, client };
};
```

### Admin Report List Component

```typescript
// components/AdminReportList.tsx
import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { ReportStatus, ViolationType } from '../types/report';

export const AdminReportList: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: undefined as ReportStatus | undefined,
    violationType: undefined as ViolationType | undefined,
    page: 0,
    size: 20
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports(filters);
      setReports(data.results);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (reportId: string, action: string, reason: string) => {
    try {
      await reportService.processReport(reportId, {
        action,
        reason
      });
      alert('Xử lý báo cáo thành công!');
      loadReports();
    } catch (error) {
      console.error('Error processing report:', error);
    }
  };

  return (
    <div className="admin-report-list">
      <h2>Quản Lý Báo Cáo</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as ReportStatus })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value={ReportStatus.PENDING}>Chờ xử lý</option>
          <option value={ReportStatus.UNDER_REVIEW}>Đang xem xét</option>
          <option value={ReportStatus.RESOLVED}>Đã xử lý</option>
          <option value={ReportStatus.REJECTED}>Từ chối</option>
        </select>

        <select
          value={filters.violationType || ''}
          onChange={(e) => setFilters({ ...filters, violationType: e.target.value as ViolationType })}
        >
          <option value="">Tất cả loại vi phạm</option>
          <option value={ViolationType.SPAM}>Spam</option>
          <option value={ViolationType.SCAM}>Lừa đảo</option>
          <option value={ViolationType.HARASSMENT}>Quấy rối</option>
          <option value={ViolationType.INAPPROPRIATE_CONTENT}>Nội dung không phù hợp</option>
          <option value={ViolationType.FAKE_ACCOUNT}>Tài khoản giả mạo</option>
          <option value={ViolationType.OTHER}>Khác</option>
        </select>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người báo cáo</th>
              <th>Người vi phạm</th>
              <th>Loại vi phạm</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.reporterName}</td>
                <td>{report.targetUserName}</td>
                <td>{report.violationType}</td>
                <td>{report.status}</td>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => {/* View detail */}}>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## 📝 Checklist Tích Hợp

### User Features
- [ ] Form tạo báo cáo vi phạm
- [ ] Upload file bằng chứng (tùy chọn)
- [ ] Validation form (description max 500 chars)
- [ ] Hiển thị lịch sử báo cáo đã gửi
- [ ] Filter báo cáo theo status
- [ ] Hiển thị trạng thái cập nhật real-time (WebSocket)
- [ ] Toast notification khi báo cáo được xử lý

### Admin Features
- [ ] Danh sách báo cáo với filter (status, violationType)
- [ ] Pagination cho danh sách báo cáo
- [ ] Chi tiết báo cáo kèm lịch sử vi phạm
- [ ] Form xử lý báo cáo (SUSPEND/BAN/REJECT/RESTORE)
- [ ] Chọn thời gian suspend (7/30/90 ngày hoặc vĩnh viễn)
- [ ] Nhập lý do xử lý (bắt buộc, max 500 chars)
- [ ] Real-time notification khi có báo cáo mới
- [ ] Dashboard thống kê báo cáo

---

## 🔗 Related Documentation

- [WebSocket Integration Guide](./WEBSOCKET_GUIDE.md)
- [Authentication Guide](./AUTH_GUIDE.md)
- [API Error Codes](./ERROR_CODES.md)

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ:
- Email: support@example.com
- Documentation: https://api-docs.example.com

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-30

