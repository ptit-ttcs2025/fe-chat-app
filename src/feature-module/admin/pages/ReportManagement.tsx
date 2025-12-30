/**
 * Report Management (Admin)
 * Admin dashboard để quản lý reports với filters, pagination, real-time notifications
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminReportList } from '@/hooks/useAdminReports';
import { useQueryClient } from '@tanstack/react-query';
import { ADMIN_REPORT_KEYS } from '@/hooks/useAdminReports';
import websocketService from '@/core/services/websocket.service';
import {
  ReportStatus,
  ViolationType,
  ViolationTypeLabels,
  ReportStatusLabels,
  type NewReportNotification,
} from '@/apis/report/report.type';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';

const ReportManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    status: undefined as ReportStatus | undefined,
    violationType: undefined as ViolationType | undefined,
    page: 0,
    size: 20,
  });

  const queryClient = useQueryClient();
  const { data: response, isLoading, error } = useAdminReportList(filters);

  const reports = response?.data?.results || [];
  const meta = response?.data?.meta;

  // Subscribe to new report notifications
  useEffect(() => {
    const handleNewReport = (notification: NewReportNotification) => {
      console.log('📩 New report notification:', notification);

      toast.info(
        `Báo cáo mới từ ${notification.reporterName} về ${notification.targetUserName}`,
        {
          autoClose: 5000,
          onClick: () => {
            window.location.href = `/admin/reports/${notification.reportId}`;
          },
        }
      );

      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ADMIN_REPORT_KEYS.all });
    };

    const unsubscribe = websocketService.subscribeToNewReports(handleNewReport);

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const handleStatusFilter = (status: ReportStatus | undefined) => {
    setFilters({ ...filters, status, page: 0 });
  };

  const handleViolationTypeFilter = (violationType: ViolationType | undefined) => {
    setFilters({ ...filters, violationType, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="d-flex justify-content-center p-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="alert alert-danger">
            <i className="ti ti-alert-circle me-2" />
            Không thể tải danh sách báo cáo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        {/* Page Header */}
        <div className="page-header">
          <div className="row align-items-center">
            <div className="col">
              <h4 className="page-title">
                <i className="ti ti-flag me-2" />
                Quản lý báo cáo vi phạm
              </h4>
            </div>
            <div className="col-auto">
              <span className="badge bg-primary">
                {meta?.totalElements || 0} báo cáo
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <label className="form-label">
                  <i className="ti ti-filter me-2" />
                  Lọc theo trạng thái
                </label>
                <select
                  className="form-select"
                  value={filters.status || ''}
                  onChange={(e) =>
                    handleStatusFilter(
                      e.target.value ? (e.target.value as ReportStatus) : undefined
                    )
                  }
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(ReportStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <label className="form-label">
                  <i className="ti ti-filter me-2" />
                  Lọc theo loại vi phạm
                </label>
                <select
                  className="form-select"
                  value={filters.violationType || ''}
                  onChange={(e) =>
                    handleViolationTypeFilter(
                      e.target.value ? (e.target.value as ViolationType) : undefined
                    )
                  }
                >
                  <option value="">Tất cả loại vi phạm</option>
                  {Object.entries(ViolationTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {reports.length === 0 ? (
                  <div className="text-center p-5">
                    <i className="ti ti-inbox text-muted" style={{ fontSize: '48px' }} />
                    <p className="text-muted mt-3">Không có báo cáo nào</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Người báo cáo</th>
                            <th>Người bị báo cáo</th>
                            <th>Loại vi phạm</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Người xử lý</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => (
                            <tr key={report.id}>
                              <td>
                                <div>
                                  <strong>{report.reporterName}</strong>
                                  <br />
                                  <small className="text-muted">{report.reporterEmail}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{report.targetUserName}</strong>
                                  <br />
                                  <small className="text-muted">{report.targetUserEmail}</small>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-warning">
                                  {ViolationTypeLabels[report.violationType]}
                                </span>
                              </td>
                              <td>
                                <div
                                  style={{
                                    maxWidth: '250px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={report.description}
                                >
                                  {report.description}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    report.status === 'PENDING'
                                      ? 'bg-secondary'
                                      : report.status === 'UNDER_REVIEW'
                                      ? 'bg-info'
                                      : report.status === 'RESOLVED'
                                      ? 'bg-success'
                                      : 'bg-danger'
                                  }`}
                                >
                                  {ReportStatusLabels[report.status]}
                                </span>
                              </td>
                              <td>
                                {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', {
                                  locale: vi,
                                })}
                              </td>
                              <td>
                                {report.resolvedByName || (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <Link
                                  to={`/admin/reports/${report.id}`}
                                  className="btn btn-sm btn-primary"
                                >
                                  <i className="ti ti-eye me-1" />
                                  Xem chi tiết
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <nav>
                          <ul className="pagination">
                            <li className={`page-item ${filters.page === 0 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 0}
                              >
                                Trước
                              </button>
                            </li>
                            {Array.from({ length: Math.min(meta.totalPages, 10) }, (_, i) => {
                              const pageNum = filters.page < 5
                                ? i
                                : filters.page + i - 4;

                              if (pageNum >= meta.totalPages) return null;

                              return (
                                <li
                                  key={pageNum}
                                  className={`page-item ${
                                    filters.page === pageNum ? 'active' : ''
                                  }`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum + 1}
                                  </button>
                                </li>
                              );
                            })}
                            <li
                              className={`page-item ${
                                filters.page === meta.totalPages - 1 ? 'disabled' : ''
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page === meta.totalPages - 1}
                              >
                                Sau
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;

