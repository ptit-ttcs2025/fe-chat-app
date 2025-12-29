/**
 * React Query Hooks for Admin Reports
 * Theo best practices: cache 30s + invalidate on WebSocket
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReportApi } from '@/apis/report/admin-report.api';
import type {
  AdminActionRequest,
  ReportListFilters,
} from '@/apis/report/report.type';
import { toast } from 'react-toastify';
import authStorage from '@/lib/authStorage';

export const ADMIN_REPORT_KEYS = {
  all: ['admin', 'reports'] as const,
  list: (filters: ReportListFilters) =>
    [...ADMIN_REPORT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...ADMIN_REPORT_KEYS.all, 'detail', id] as const,
};

/**
 * Hook lấy danh sách reports (Admin)
 */
export const useAdminReportList = (filters: ReportListFilters) => {
  return useQuery({
    queryKey: ADMIN_REPORT_KEYS.list(filters),
    queryFn: () => adminReportApi.listAllReports(filters),
    staleTime: 30000, // 30 seconds
    enabled: !!authStorage.getAccessToken(),
  });
};

/**
 * Hook lấy chi tiết report (Admin)
 */
export const useAdminReportDetail = (id: string) => {
  return useQuery({
    queryKey: ADMIN_REPORT_KEYS.detail(id),
    queryFn: () => adminReportApi.getReportDetail(id),
    enabled: !!id && !!authStorage.getAccessToken(),
  });
};

/**
 * Hook xử lý report (Admin)
 */
export const useProcessReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: AdminActionRequest }) =>
      adminReportApi.processReport(id, action),
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Xử lý báo cáo thành công');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ADMIN_REPORT_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ADMIN_REPORT_KEYS.detail(variables.id),
      });
    },
    onError: (error: any) => {
      console.error('Process report error:', error);
    },
  });
};

