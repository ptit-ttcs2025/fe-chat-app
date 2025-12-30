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
  
  // ✅ Xử lý response: interceptor có thể đã unwrap hoặc chưa
  const responseData = response.data as any;
  
  // Nếu response đã có cấu trúc ApiResponse (statusCode, message, data)
  if (responseData?.statusCode !== undefined && responseData?.data !== undefined) {
    return responseData as ApiResponse<PaginatedResponse<ReportListItem>>;
  }
  
  // Nếu response đã được unwrap và chỉ còn data
  // Wrap lại thành ApiResponse format
  return {
    statusCode: 200,
    message: 'Lấy danh sách báo cáo thành công',
    timestamp: new Date().toISOString(),
    data: responseData as PaginatedResponse<ReportListItem>,
  };
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
  
  // ✅ Xử lý response: interceptor có thể đã unwrap hoặc chưa
  const responseData = response.data as any;
  
  // Nếu response đã có cấu trúc ApiResponse (statusCode, message, data)
  if (responseData?.statusCode !== undefined && responseData?.data !== undefined) {
    return responseData as ApiResponse<ReportDetail>;
  }
  
  // Nếu response đã được unwrap và chỉ còn data
  // Wrap lại thành ApiResponse format
  return {
    statusCode: 200,
    message: 'Lấy chi tiết báo cáo thành công',
    timestamp: new Date().toISOString(),
    data: responseData as ReportDetail,
  };
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
  
  // ✅ Xử lý response: interceptor có thể đã unwrap hoặc chưa
  const responseData = response.data as any;
  
  // Nếu response đã có cấu trúc ApiResponse (statusCode, message, data)
  if (responseData?.statusCode !== undefined) {
    return responseData as ApiResponse<void>;
  }
  
  // Nếu response đã được unwrap
  // Wrap lại thành ApiResponse format
  return {
    statusCode: 200,
    message: responseData?.message || 'Xử lý báo cáo thành công',
    timestamp: new Date().toISOString(),
    data: undefined,
  };
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

