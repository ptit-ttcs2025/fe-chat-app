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
import authStorage from '@/lib/authStorage';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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
    keepPreviousData: true, // ✅ Giữ data cũ khi filter thay đổi để smooth transition
    refetchOnWindowFocus: false, // ✅ Không refetch khi focus window
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
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Xử lý báo cáo thành công!',
        text: response.message || 'Báo cáo đã được xử lý',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ADMIN_REPORT_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ADMIN_REPORT_KEYS.detail(variables.id),
      });
    },
    onError: (error: any) => {
      console.error('Process report error:', error);
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || 'Không thể xử lý báo cáo',
        showConfirmButton: false,
        timer: 3000,
      });
    },
  });
};

