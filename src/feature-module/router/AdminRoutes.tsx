/**
 * Admin Route Wrapper
 * Wrap admin routes với AdminGuard để protect
 */

import React from 'react';
import { AdminGuard } from '@/core/guards/AdminGuard';
import ReportManagement from '@/feature-module/admin/pages/ReportManagement';
import { AdminDashboard } from '@/feature-module/admin/pages/dashboard/adminDashboard';

// Wrapper components cho admin routes
export const AdminReportManagementRoute: React.FC = () => (
  <AdminGuard>
    <ReportManagement />
  </AdminGuard>
);

export const AdminDashboardRoute: React.FC = () => (
  <AdminGuard>
    <AdminDashboard />
  </AdminGuard>
);

export default {
  AdminReportManagementRoute,
  AdminDashboardRoute,
};

