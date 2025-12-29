/**
 * My Reports Page
 * Danh sách báo cáo mà user đã gửi
 */

import React, { useState } from 'react';
import { useMyReports } from '@/hooks/useReports';
import {
  ViolationTypeLabels,
  ReportStatusLabels,
} from '@/apis/report/report.type';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const MyReports: React.FC = () => {
  const [page, setPage] = useState(0);
  const size = 20;

  const { data: response, isLoading, error } = useMyReports(page, size);

  const reports = response?.data?.results || [];
  const meta = response?.data?.meta;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <i className="ti ti-alert-circle me-2" />
        Không thể tải danh sách báo cáo
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
                Báo cáo của tôi
              </h4>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                {reports.length === 0 ? (
                  <div className="text-center p-5">
                    <i className="ti ti-inbox text-muted" style={{ fontSize: '48px' }} />
                    <p className="text-muted mt-3">Bạn chưa gửi báo cáo nào</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Người bị báo cáo</th>
                            <th>Loại vi phạm</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Ngày gửi</th>
                            <th>Ghi chú admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => (
                            <tr key={report.id}>
                              <td>
                                <strong>{report.targetUserName}</strong>
                              </td>
                              <td>
                                <span className="badge bg-warning">
                                  {ViolationTypeLabels[report.violationType]}
                                </span>
                              </td>
                              <td>
                                <div
                                  style={{
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
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
                                {report.adminNote ? (
                                  <small className="text-muted">{report.adminNote}</small>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
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
                            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 0}
                              >
                                Trước
                              </button>
                            </li>
                            {Array.from({ length: meta.totalPages }, (_, i) => (
                              <li
                                key={i}
                                className={`page-item ${page === i ? 'active' : ''}`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => setPage(i)}
                                >
                                  {i + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${
                                page === meta.totalPages - 1 ? 'disabled' : ''
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setPage(page + 1)}
                                disabled={page === meta.totalPages - 1}
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

export default MyReports;

