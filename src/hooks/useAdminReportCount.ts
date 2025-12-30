/**
 * useAdminReportCount Hook
 * Get count of pending reports for admin notification badge
 */

import { useQuery } from '@tanstack/react-query';
import { adminReportApi } from '@/apis/report/admin-report.api';
import { ReportStatus } from '@/apis/report/report.type';
import authStorage from '@/lib/authStorage';
import { useIsAdmin } from './useIsAdmin';

export const useAdminReportCount = () => {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['admin', 'reports', 'pending-count'],
    queryFn: async () => {
      try {
        const response = await adminReportApi.listAllReports({
          status: ReportStatus.PENDING,
          page: 0,
          size: 1, // Only need count, not actual data
        });
        return response.data?.meta?.totalElements || 0;
      } catch (error) {
        console.error('Failed to fetch pending reports count:', error);
        return 0;
      }
    },
    staleTime: 30000, // 30 seconds
    enabled: !!authStorage.getAccessToken() && isAdmin,
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });
};

export default useAdminReportCount;

