/**
 * Admin Report API Client
 * REST API endpoints cho Admin Report Management
 * Theo API_DOCUMENTATION.md - Admin Report APIs
 */

import http from '@/lib/apiBase';
import type {
  ReportListItem,
  ReportDetail,
  AdminActionRequest,
  ApiResponse,
  PaginatedResponse,
  ReportListFilters,
} from './report.type';

const URI = '';

// ===========================
// ADMIN REPORT APIs
// ===========================

/**
 * Lấy danh sách tất cả reports (Admin)
 * GET /admin/reports?status=PENDING&violationType=SPAM&page=0&size=20
 */
export const listAllReports = async (
  filters: ReportListFilters
): Promise<ApiResponse<PaginatedResponse<ReportListItem>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<ReportListItem>>>(
    `${URI}/admin/reports`,
    {
      params: filters,
    }
  );
  return response.data;
};

/**
 * Lấy chi tiết report (Admin)
 * GET /admin/reports/{id}
 */
export const getReportDetail = async (
  id: string
): Promise<ApiResponse<ReportDetail>> => {
  const response = await http.get<ApiResponse<ReportDetail>>(
    `${URI}/admin/reports/${id}`
  );
  return response.data;
};

/**
 * Xử lý report (Admin)
 * POST /admin/reports/{id}/actions
 */
export const processReport = async (
  id: string,
  action: AdminActionRequest
): Promise<ApiResponse<void>> => {
  const response = await http.post<ApiResponse<void>>(
    `${URI}/admin/reports/${id}/actions`,
    action
  );
  return response.data;
};

// ===========================
// EXPORT ALL
// ===========================

export const adminReportApi = {
  listAllReports,
  getReportDetail,
  processReport,
};

export default adminReportApi;

