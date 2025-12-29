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
  return response.data;
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
  return response.data;
};

// ===========================
// EXPORT ALL
// ===========================

export const reportApi = {
  createReport,
  getMyReports,
};

export default reportApi;

