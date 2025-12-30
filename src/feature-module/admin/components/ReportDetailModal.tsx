/**
 * Report Detail Modal (Admin)
 * Hiển thị chi tiết report, violation history và action buttons
 */

import React, { useState } from 'react';
import { useAdminReportDetail } from '@/hooks/useAdminReports';
import {
  ViolationTypeLabels,
  ReportStatusLabels,
} from '@/apis/report/report.type';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ProcessReportModal from '@/feature-module/admin/components/ProcessReportModal';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
}) => {
  const { data: response, isLoading, error } = useAdminReportDetail(reportId);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const report = response?.data;

  if (isLoading) {
    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="ti ti-alert-circle me-2" />
                Không thể tải chi tiết báo cáo
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-flag me-2 text-danger" />
                Chi tiết báo cáo vi phạm
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {/* Report Status */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="alert alert-info">
                    <div className="row align-items-center">
                      <div className="col">
                        <strong>Trạng thái:</strong>{' '}
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
                      </div>
                      <div className="col-auto">
                        <strong>Ngày tạo:</strong>{' '}
                        {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: vi,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="ti ti-user me-2" />
                        Người báo cáo
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        {report.reporterInfo.avatarUrl ? (
                          <img
                            src={report.reporterInfo.avatarUrl}
                            alt={report.reporterInfo.fullName}
                            className="avatar avatar-lg rounded-circle me-3"
                          />
                        ) : (
                          <div className="avatar avatar-lg rounded-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center">
                            {report.reporterInfo.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0">{report.reporterInfo.fullName}</h6>
                          <small className="text-muted">{report.reporterInfo.email}</small>
                        </div>
                      </div>
                      <div>
                        <small className="text-muted">Số lần vi phạm:</small>{' '}
                        <span className="badge bg-secondary">
                          {report.reporterInfo.violationCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target User Info */}
                <div className="col-md-6">
                  <div className="card border-danger">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">
                        <i className="ti ti-user-x me-2" />
                        Người bị báo cáo
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        {report.targetUserInfo.avatarUrl ? (
                          <img
                            src={report.targetUserInfo.avatarUrl}
                            alt={report.targetUserInfo.fullName}
                            className="avatar avatar-lg rounded-circle me-3"
                          />
                        ) : (
                          <div className="avatar avatar-lg rounded-circle bg-danger text-white me-3 d-flex align-items-center justify-content-center">
                            {report.targetUserInfo.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0">{report.targetUserInfo.fullName}</h6>
                          <small className="text-muted">{report.targetUserInfo.email}</small>
                        </div>
                      </div>
                      <div>
                        <small className="text-muted">Số lần vi phạm:</small>{' '}
                        <span className="badge bg-danger">
                          {report.targetUserInfo.violationCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="ti ti-file-description me-2" />
                    Thông tin báo cáo
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <strong>Loại vi phạm:</strong>{' '}
                    <span className="badge bg-warning">
                      {ViolationTypeLabels[report.violationType]}
                    </span>
                  </div>
                  <div className="mb-3">
                    <strong>Mô tả chi tiết:</strong>
                    <p className="mt-2">{report.description}</p>
                  </div>
                  {report.evidenceUrl && (
                    <div className="mb-3">
                      <strong>Bằng chứng:</strong>
                      <div className="mt-2">
                        <a
                          href={report.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="ti ti-download me-2" />
                          Tải xuống bằng chứng
                        </a>
                      </div>
                    </div>
                  )}
                  {report.chatLogSnapshot && (
                    <div className="mb-3">
                      <strong>Nhật ký chat:</strong>
                      <pre className="bg-light p-3 mt-2 rounded" style={{ maxHeight: '200px', overflow: 'auto' }}>
                        {report.chatLogSnapshot}
                      </pre>
                    </div>
                  )}
                  {report.adminNote && (
                    <div className="alert alert-warning">
                      <strong>Ghi chú từ admin:</strong>
                      <p className="mb-0 mt-2">{report.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Violation History */}
              {report.violationHistory && report.violationHistory.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="ti ti-history me-2" />
                      Lịch sử vi phạm của người bị báo cáo
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Hành động</th>
                            <th>Lý do</th>
                            <th>Admin xử lý</th>
                            <th>Ngày</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.violationHistory.map((violation) => (
                            <tr key={violation.id}>
                              <td>
                                <span
                                  className={`badge ${
                                    violation.actionType === 'SUSPEND'
                                      ? 'bg-warning'
                                      : violation.actionType === 'BAN'
                                      ? 'bg-danger'
                                      : 'bg-success'
                                  }`}
                                >
                                  {violation.actionType}
                                </span>
                              </td>
                              <td>{violation.reason}</td>
                              <td>{violation.adminName}</td>
                              <td>
                                {format(new Date(violation.createdAt), 'dd/MM/yyyy HH:mm', {
                                  locale: vi,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
              {(report.status === 'PENDING' || report.status === 'UNDER_REVIEW') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowProcessModal(true)}
                >
                  <i className="ti ti-gavel me-2" />
                  Xử lý báo cáo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Process Report Modal */}
      {showProcessModal && (
        <ProcessReportModal
          reportId={reportId}
          targetUserName={report.targetUserInfo.fullName}
          onClose={() => setShowProcessModal(false)}
          onSuccess={() => {
            setShowProcessModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default ReportDetailModal;

