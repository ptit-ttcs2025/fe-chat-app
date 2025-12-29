/**
 * React Query Hooks for User Reports
 * Theo best practices: cache 30s + invalidate on WebSocket
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '@/apis/report/report.api';
import type { CreateReportRequest } from '@/apis/report/report.type';
import { toast } from 'react-toastify';
import authStorage from '@/lib/authStorage';

export const REPORT_KEYS = {
  all: ['reports'] as const,
  myReports: (page: number, size: number) =>
    [...REPORT_KEYS.all, 'my', page, size] as const,
};

/**
 * Hook tạo báo cáo vi phạm
 */
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => reportApi.createReport(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Báo cáo đã được gửi thành công');
      // Invalidate my reports list
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Create report error:', error);
      // Error handled by axios interceptor
    },
  });
};

/**
 * Hook lấy danh sách reports đã gửi
 */
export const useMyReports = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: REPORT_KEYS.myReports(page, size),
    queryFn: () => reportApi.getMyReports(page, size),
    staleTime: 30000, // 30 seconds
    enabled: !!authStorage.getAccessToken(),
  });
};

