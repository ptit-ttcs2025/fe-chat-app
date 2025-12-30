/**
 * Report API Client
 * REST API endpoints cho User Report System
 * Theo API_DOCUMENTATION.md - Report APIs (User)
 */

import http from '@/lib/apiBase';
import type {
  CreateReportRequest,
  ReportDto,
  MyReportDto,
  ApiResponse,
  PaginatedResponse,
} from './report.type';

const URI = '';

// ===========================
// USER REPORT APIs
// ===========================

/**
 * Tạo báo cáo vi phạm
 * POST /reports
 */
export const createReport = async (
  data: CreateReportRequest
): Promise<ApiResponse<ReportDto>> => {
  const response = await http.post<ApiResponse<ReportDto>>(
    `${URI}/reports`,
    data
  );
  
  // ✅ Xử lý response: interceptor có thể đã unwrap hoặc chưa
  const responseData = response.data as any;
  
  // Nếu response đã có cấu trúc ApiResponse (statusCode, message, data)
  if (responseData?.statusCode !== undefined && responseData?.data !== undefined) {
    return responseData as ApiResponse<ReportDto>;
  }
  
  // Nếu response đã được unwrap và chỉ còn data (có thể là ReportDto trực tiếp)
  // Wrap lại thành ApiResponse format
  return {
    statusCode: 201,
    message: 'Tạo báo cáo vi phạm thành công',
    timestamp: new Date().toISOString(),
    data: responseData as ReportDto,
  };
};

/**
 * Lấy danh sách báo cáo đã gửi
 * GET /reports/my?page=0&size=20
 */
export const getMyReports = async (
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PaginatedResponse<MyReportDto>>> => {
  const response = await http.get<ApiResponse<PaginatedResponse<MyReportDto>>>(
    `${URI}/reports/my`,
    {
      params: { page, size },
    }
  );
  
  // ✅ Xử lý response: interceptor có thể đã unwrap hoặc chưa
  const responseData = response.data as any;
  
  // Nếu response đã có cấu trúc ApiResponse (statusCode, message, data)
  if (responseData?.statusCode !== undefined && responseData?.data !== undefined) {
    return responseData as ApiResponse<PaginatedResponse<MyReportDto>>;
  }
  
  // Nếu response đã được unwrap và chỉ còn data
  // Wrap lại thành ApiResponse format
  return {
    statusCode: 200,
    message: 'Lấy danh sách báo cáo thành công',
    timestamp: new Date().toISOString(),
    data: responseData as PaginatedResponse<MyReportDto>,
  };
};

// ===========================
// EXPORT ALL
// ===========================

export const reportApi = {
  createReport,
  getMyReports,
};

export default reportApi;

