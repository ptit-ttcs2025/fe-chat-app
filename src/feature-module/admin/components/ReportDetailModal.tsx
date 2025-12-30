/**
 * Report Detail Modal (Admin) - Modern Redesign
 * Beautiful, modern modal design với improved UX và no CSS conflicts
 */

import React, { useState } from 'react';
import { useAdminReportDetail, useProcessReport } from '@/hooks/useAdminReports';
import {
  ViolationTypeLabels,
  ReportStatusLabels,
  AdminActionType,
  SuspendDuration,
  SuspendDurationLabels,
  type AdminActionRequest,
} from '@/apis/report/report.type';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
}) => {
  const { data: response, isLoading, error } = useAdminReportDetail(reportId);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [formData, setFormData] = useState<AdminActionRequest>({
    action: AdminActionType.SUSPEND,
    suspendDuration: SuspendDuration.SEVEN_DAYS,
    reason: '',
  });

  const { mutate: processReport, isPending: isProcessing } = useProcessReport();

  const report = response?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#6c757d', text: '#fff', light: 'rgba(108, 117, 125, 0.1)' };
      case 'UNDER_REVIEW':
        return { bg: '#0dcaf0', text: '#fff', light: 'rgba(13, 202, 240, 0.1)' };
      case 'RESOLVED':
        return { bg: '#198754', text: '#fff', light: 'rgba(25, 135, 84, 0.1)' };
      case 'REJECTED':
        return { bg: '#dc3545', text: '#fff', light: 'rgba(220, 53, 69, 0.1)' };
      default:
        return { bg: '#6c757d', text: '#fff', light: 'rgba(108, 117, 125, 0.1)' };
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'SPAM':
        return { bg: '#ffc107', text: '#000' };
      case 'SCAM':
        return { bg: '#dc3545', text: '#fff' };
      case 'HARASSMENT':
        return { bg: '#9d4edd', text: '#fff' };
      case 'INAPPROPRIATE_CONTENT':
        return { bg: '#f77f00', text: '#fff' };
      case 'FAKE_ACCOUNT':
        return { bg: '#212529', text: '#fff' };
      default:
        return { bg: '#6c757d', text: '#fff' };
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SUSPEND':
        return { bg: '#ffc107', text: '#000', icon: 'ti-clock-pause' };
      case 'BAN':
        return { bg: '#dc3545', text: '#fff', icon: 'ti-user-off' };
      case 'RESTORE':
        return { bg: '#198754', text: '#fff', icon: 'ti-refresh' };
      case 'REJECT_REPORT':
        return { bg: '#6c757d', text: '#fff', icon: 'ti-x' };
      default:
        return { bg: '#6c757d', text: '#fff', icon: 'ti-help' };
    }
  };

  const getFormActionColor = () => {
    switch (formData.action) {
      case AdminActionType.BAN:
        return { bg: '#f5576c', text: '#fff' };
      case AdminActionType.SUSPEND:
        return { bg: '#ffc107', text: '#000' };
      case AdminActionType.RESTORE:
        return { bg: '#198754', text: '#fff' };
      case AdminActionType.REJECT_REPORT:
        return { bg: '#6c757d', text: '#fff' };
      default:
        return { bg: '#667eea', text: '#fff' };
    }
  };

  const getFormActionIcon = () => {
    switch (formData.action) {
      case AdminActionType.SUSPEND:
        return 'ti-clock-pause';
      case AdminActionType.BAN:
        return 'ti-user-off';
      case AdminActionType.REJECT_REPORT:
        return 'ti-x';
      case AdminActionType.RESTORE:
        return 'ti-refresh';
      default:
        return 'ti-gavel';
    }
  };

  const getActionDescription = () => {
    switch (formData.action) {
      case AdminActionType.SUSPEND:
        return 'Tạm khóa tài khoản người dùng. Họ sẽ bị logout ngay lập tức và không thể đăng nhập cho đến khi hết thời gian khóa.';
      case AdminActionType.BAN:
        return 'Cấm vĩnh viễn tài khoản. Người dùng sẽ bị logout ngay lập tức và không thể đăng nhập lại.';
      case AdminActionType.REJECT_REPORT:
        return 'Từ chối báo cáo này. Không có hành động nào được thực hiện với người bị báo cáo.';
      case AdminActionType.RESTORE:
        return 'Khôi phục tài khoản đã bị khóa/cấm. Người dùng có thể đăng nhập lại.';
      default:
        return '';
    }
  };

  const getActionAlertColor = () => {
    switch (formData.action) {
      case AdminActionType.SUSPEND:
        return { bg: 'rgba(255, 193, 7, 0.1)', border: '#ffc107', text: '#856404' };
      case AdminActionType.BAN:
        return { bg: 'rgba(220, 53, 69, 0.1)', border: '#dc3545', text: '#721c24' };
      default:
        return { bg: 'rgba(13, 202, 240, 0.1)', border: '#0dcaf0', text: '#055160' };
    }
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      return;
    }

    if (formData.action === AdminActionType.SUSPEND && !formData.suspendDuration) {
      return;
    }

    processReport(
      {
        id: reportId,
        action: formData,
      },
      {
        onSuccess: () => {
          setShowProcessForm(false);
          setFormData({
            action: AdminActionType.SUSPEND,
            suspendDuration: SuspendDuration.SEVEN_DAYS,
            reason: '',
          });
          // Close modal after success
          setTimeout(() => {
            onClose();
          }, 1500);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055, backdropFilter: 'blur(4px)' }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0 fw-semibold">Đang tải chi tiết báo cáo...</p>
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
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055, backdropFilter: 'blur(4px)' }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="modal-body p-4">
              <div className="alert alert-danger d-flex align-items-start mb-0" style={{ borderRadius: '12px', border: 'none' }}>
                <i className="ti ti-alert-circle me-3 mt-1" style={{ fontSize: '1.5rem' }} />
                <div>
                  <h6 className="alert-heading mb-2 fw-bold">Không thể tải chi tiết báo cáo</h6>
                  <p className="mb-0">Vui lòng thử lại sau hoặc liên hệ quản trị viên.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 bg-light">
              <button className="btn btn-secondary" onClick={onClose}>
                <i className="ti ti-x me-2" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(report.status);
  const violationColor = getViolationColor(report.violationType);

  return (
    <>
      <div
        className="modal fade show d-block report-detail-modal"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055, backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            {/* Modern Header */}
            <div 
              className="modal-header border-0 pb-4 position-relative"
              style={{ 
                background: `linear-gradient(135deg, ${statusColor.bg} 0%, ${statusColor.bg}dd 100%)`,
                padding: '2rem 2rem 1.5rem'
              }}
            >
              <div className="w-100">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div>
                    <h4 className="modal-title text-white mb-2 fw-bold">
                      <i className="ti ti-flag me-2" />
                      Chi tiết báo cáo vi phạm
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span 
                        className="badge px-3 py-2"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <i className="ti ti-calendar me-1" />
                        {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                      <span className="text-white-50 small">
                        ({formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={onClose}
                    style={{ 
                      opacity: 1,
                      fontSize: '1.2rem',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span 
                    className="badge px-3 py-2"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: statusColor.bg,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}
                  >
                    {ReportStatusLabels[report.status]}
                  </span>
                  <span 
                    className="badge px-3 py-2"
                    style={{ 
                      background: violationColor.bg,
                      color: violationColor.text,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderRadius: '8px'
                    }}
                  >
                    <i className="ti ti-shield-off me-1" />
                    {ViolationTypeLabels[report.violationType]}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-body p-4" style={{ background: '#f8f9fa' }}>
              {/* Users Section - Side by Side */}
              <div className="row g-4 mb-4">
                {/* Reporter Card */}
                <div className="col-md-6">
                  <div 
                    className="card border-0 shadow-sm h-100"
                    style={{ 
                      borderRadius: '16px',
                      borderLeft: '4px solid #667eea',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="card-header border-0 py-3"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '12px 12px 0 0'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#667eea' }}>
                        <i className="ti ti-user me-2" />
                        Người báo cáo
                      </h6>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-4">
                        {report.reporterInfo.avatarUrl ? (
                          <img
                            src={report.reporterInfo.avatarUrl}
                            alt={report.reporterInfo.fullName}
                            className="rounded-circle"
                            style={{ 
                              width: '64px', 
                              height: '64px', 
                              objectFit: 'cover',
                              border: '3px solid #667eea',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              width: '64px',
                              height: '64px',
                              fontSize: '1.5rem',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                          >
                            {report.reporterInfo.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ms-3 flex-grow-1">
                          <h5 className="mb-1 fw-bold">{report.reporterInfo.fullName}</h5>
                          <small className="text-muted d-block">
                            <i className="ti ti-mail me-1" />
                            {report.reporterInfo.email}
                          </small>
                        </div>
                      </div>
                      <div 
                        className="d-flex align-items-center justify-content-between p-3 rounded"
                        style={{ background: '#f8f9fa' }}
                      >
                        <span className="text-muted fw-semibold">Số lần vi phạm:</span>
                        <span 
                          className="badge px-3 py-2 fw-bold"
                          style={{ 
                            background: '#6c757d',
                            color: '#fff',
                            fontSize: '0.875rem',
                            borderRadius: '8px'
                          }}
                        >
                          {report.reporterInfo.violationCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target User Card */}
                <div className="col-md-6">
                  <div 
                    className="card border-0 shadow-sm h-100"
                    style={{ 
                      borderRadius: '16px',
                      borderLeft: '4px solid #f5576c',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="card-header border-0 py-3"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(220, 53, 69, 0.1) 100%)',
                        borderRadius: '12px 12px 0 0'
                      }}
                    >
                      <h6 className="mb-0 fw-bold" style={{ color: '#f5576c' }}>
                        <i className="ti ti-user-x me-2" />
                        Người bị báo cáo
                      </h6>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-4">
                        {report.targetUserInfo.avatarUrl ? (
                          <img
                            src={report.targetUserInfo.avatarUrl}
                            alt={report.targetUserInfo.fullName}
                            className="rounded-circle"
                            style={{ 
                              width: '64px', 
                              height: '64px', 
                              objectFit: 'cover',
                              border: '3px solid #f5576c',
                              boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)'
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              width: '64px',
                              height: '64px',
                              fontSize: '1.5rem',
                              boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)'
                            }}
                          >
                            {report.targetUserInfo.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ms-3 flex-grow-1">
                          <h5 className="mb-1 fw-bold">{report.targetUserInfo.fullName}</h5>
                          <small className="text-muted d-block">
                            <i className="ti ti-mail me-1" />
                            {report.targetUserInfo.email}
                          </small>
                        </div>
                      </div>
                      <div 
                        className="d-flex align-items-center justify-content-between p-3 rounded"
                        style={{ background: '#f8f9fa' }}
                      >
                        <span className="text-muted fw-semibold">Số lần vi phạm:</span>
                        <span 
                          className="badge px-3 py-2 fw-bold"
                          style={{ 
                            background: '#dc3545',
                            color: '#fff',
                            fontSize: '0.875rem',
                            borderRadius: '8px'
                          }}
                        >
                          {report.targetUserInfo.violationCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Details Card */}
              <div 
                className="card border-0 shadow-sm mb-4"
                style={{ borderRadius: '16px', overflow: 'hidden' }}
              >
                <div 
                  className="card-header border-0 py-3"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                  }}
                >
                  <h6 className="mb-0 fw-bold">
                    <i className="ti ti-file-description me-2 text-primary" />
                    Thông tin báo cáo
                  </h6>
                </div>
                <div className="card-body p-4">
                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-semibold mb-2 d-block">
                      Mô tả chi tiết
                    </label>
                    <div 
                      className="p-4 rounded"
                      style={{ 
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        lineHeight: '1.8',
                        fontSize: '0.95rem'
                      }}
                    >
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Evidence & Chat Log */}
                  <div className="row g-3">
                    {report.evidenceUrl && (
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-semibold mb-2 d-block">
                          Bằng chứng
                        </label>
                        <a
                          href={report.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary w-100"
                          style={{ borderRadius: '10px' }}
                        >
                          <i className="ti ti-download me-2" />
                          Tải xuống bằng chứng
                        </a>
                      </div>
                    )}
                    {report.chatLogSnapshot && (
                      <div className="col-12">
                        <label className="form-label text-muted small fw-semibold mb-2 d-block">
                          Nhật ký chat
                        </label>
                        <div
                          className="p-3 rounded"
                          style={{
                            background: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            maxHeight: '200px',
                            overflow: 'auto',
                            fontSize: '0.875rem',
                            lineHeight: '1.7',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace'
                          }}
                        >
                          {report.chatLogSnapshot}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Note */}
                  {report.adminNote && (
                    <div className="mt-4">
                      <div 
                        className="alert alert-warning border-0 mb-0"
                        style={{ 
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
                          borderLeft: '4px solid #ffc107'
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className="ti ti-info-circle me-3 mt-1" style={{ fontSize: '1.25rem', color: '#ff9800' }} />
                          <div>
                            <strong className="d-block mb-2">Ghi chú từ admin:</strong>
                            <p className="mb-0" style={{ lineHeight: '1.7' }}>{report.adminNote}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Violation History - Timeline Design */}
              {report.violationHistory && report.violationHistory.length > 0 && (
                <div 
                  className="card border-0 shadow-sm mb-4"
                  style={{ borderRadius: '16px', overflow: 'hidden' }}
                >
                  <div 
                    className="card-header border-0 py-3"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                    }}
                  >
                    <h6 className="mb-0 fw-bold">
                      <i className="ti ti-history me-2 text-primary" />
                      Lịch sử vi phạm
                    </h6>
                  </div>
                  <div className="card-body p-4">
                    <div className="timeline-container">
                      {report.violationHistory.map((violation, index) => {
                        const actionColor = getActionColor(violation.actionType);
                        const isLast = index === report.violationHistory.length - 1;
                        return (
                          <div key={violation.id} className="d-flex mb-4" style={{ position: 'relative' }}>
                            {/* Timeline Line */}
                            {!isLast && (
                              <div 
                                className="position-absolute"
                                style={{
                                  left: '24px',
                                  top: '48px',
                                  width: '2px',
                                  height: 'calc(100% + 1rem)',
                                  background: '#e9ecef',
                                  zIndex: 0
                                }}
                              />
                            )}
                            
                            {/* Icon Circle */}
                            <div 
                              className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: '48px',
                                height: '48px',
                                background: actionColor.bg,
                                color: actionColor.text,
                                fontSize: '1.1rem',
                                zIndex: 1,
                                boxShadow: `0 2px 8px ${actionColor.bg}40`
                              }}
                            >
                              <i className={`ti ${actionColor.icon}`} />
                            </div>

                            {/* Content */}
                            <div className="ms-3 flex-grow-1">
                              <div 
                                className="p-3 rounded"
                                style={{ 
                                  background: '#f8f9fa',
                                  border: '1px solid #e9ecef'
                                }}
                              >
                                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                  <span 
                                    className="badge px-3 py-2 fw-semibold"
                                    style={{
                                      background: actionColor.bg,
                                      color: actionColor.text,
                                      fontSize: '0.875rem',
                                      borderRadius: '8px'
                                    }}
                                  >
                                    {violation.actionType}
                                  </span>
                                  <small className="text-muted">
                                    <i className="ti ti-calendar me-1" />
                                    {format(new Date(violation.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                  </small>
                                </div>
                                <p className="mb-2" style={{ lineHeight: '1.6' }}>
                                  <strong>Lý do:</strong> {violation.reason}
                                </p>
                                <div className="text-muted small">
                                  <i className="ti ti-user me-1" />
                                  <strong>Admin:</strong> {violation.adminName}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Process Report Form - Integrated */}
              {(report.status === 'PENDING' || report.status === 'UNDER_REVIEW') && (
                <div 
                  className="card border-0 shadow-sm"
                  style={{ 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: showProcessForm ? 1 : 0.95
                  }}
                >
                  <div 
                    className="card-header border-0 py-3 cursor-pointer"
                    onClick={() => !isProcessing && setShowProcessForm(!showProcessForm)}
                    style={{ 
                      background: showProcessForm 
                        ? `linear-gradient(135deg, ${getFormActionColor().bg}dd 0%, ${getFormActionColor().bg} 100%)`
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      cursor: isProcessing ? 'default' : 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="mb-0 fw-bold" style={{ color: showProcessForm ? '#fff' : 'inherit' }}>
                        <i className={`ti ${showProcessForm ? getFormActionIcon() : 'ti-gavel'} me-2`} />
                        Xử lý báo cáo
                      </h6>
                      <i 
                        className={`ti ti-chevron-${showProcessForm ? 'up' : 'down'}`}
                        style={{ 
                          color: showProcessForm ? '#fff' : 'inherit',
                          transition: 'transform 0.3s ease',
                          fontSize: '1.25rem'
                        }}
                      />
                    </div>
                  </div>
                  
                  {showProcessForm && (
                    <form onSubmit={handleProcessSubmit}>
                      <div 
                        className="card-body p-4"
                        style={{
                          animation: 'slideDown 0.3s ease-out'
                        }}
                      >
                        {/* Target User Info */}
                        <div 
                          className="mb-4 p-3 rounded"
                          style={{ 
                            background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.08) 0%, rgba(220, 53, 69, 0.08) 100%)',
                            border: '1px solid rgba(245, 87, 108, 0.2)'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <i className="ti ti-user-x me-3" style={{ fontSize: '1.5rem', color: '#f5576c' }} />
                            <div>
                              <strong className="d-block mb-1">Người bị báo cáo:</strong>
                              <p className="mb-0 text-muted">{report.targetUserInfo.fullName}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Type */}
                        <div className="mb-4">
                          <label className="form-label fw-semibold mb-2 d-block">
                            <i className="ti ti-gavel me-2 text-primary" />
                            Hành động <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-select-lg"
                            style={{ borderRadius: '10px', border: '1px solid #e9ecef' }}
                            value={formData.action}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                action: e.target.value as AdminActionType,
                              })
                            }
                            required
                            disabled={isProcessing}
                          >
                            <option value={AdminActionType.SUSPEND}>
                              🔒 Tạm khóa tài khoản (SUSPEND)
                            </option>
                            <option value={AdminActionType.BAN}>
                              🚫 Cấm vĩnh viễn (BAN)
                            </option>
                            <option value={AdminActionType.REJECT_REPORT}>
                              ❌ Từ chối báo cáo (REJECT)
                            </option>
                            <option value={AdminActionType.RESTORE}>
                              ✅ Khôi phục tài khoản (RESTORE)
                            </option>
                          </select>
                          <div 
                            className="mt-3 p-3 rounded"
                            style={{ 
                              background: '#f8f9fa',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            <small className="text-muted d-flex align-items-start">
                              <i className="ti ti-info-circle me-2 mt-1" />
                              <span>{getActionDescription()}</span>
                            </small>
                          </div>
                        </div>

                        {/* Suspend Duration (only for SUSPEND action) */}
                        {formData.action === AdminActionType.SUSPEND && (
                          <div className="mb-4">
                            <label className="form-label fw-semibold mb-2 d-block">
                              <i className="ti ti-clock me-2 text-primary" />
                              Thời gian khóa <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select form-select-lg"
                              style={{ borderRadius: '10px', border: '1px solid #e9ecef' }}
                              value={formData.suspendDuration}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  suspendDuration: e.target.value as SuspendDuration,
                                })
                              }
                              required
                              disabled={isProcessing}
                            >
                              {Object.entries(SuspendDurationLabels).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Reason */}
                        <div className="mb-4">
                          <label className="form-label fw-semibold mb-2 d-block">
                            <i className="ti ti-file-text me-2 text-primary" />
                            Lý do <span className="text-danger">*</span>
                          </label>
                          <textarea
                            className="form-control"
                            rows={4}
                            maxLength={500}
                            value={formData.reason}
                            onChange={(e) =>
                              setFormData({ ...formData, reason: e.target.value })
                            }
                            placeholder="Nhập lý do chi tiết cho quyết định này (tối đa 500 ký tự)..."
                            required
                            disabled={isProcessing}
                            style={{ 
                              resize: 'vertical',
                              borderRadius: '10px',
                              border: '1px solid #e9ecef'
                            }}
                          />
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">
                              Giải thích rõ ràng lý do thực hiện hành động này sẽ giúp cải thiện minh bạch và công bằng.
                            </small>
                            <small className={formData.reason.length > 450 ? 'text-danger fw-semibold' : 'text-muted'}>
                              {formData.reason.length}/500 ký tự
                            </small>
                          </div>
                        </div>

                        {/* Warning */}
                        {(formData.action === AdminActionType.SUSPEND ||
                          formData.action === AdminActionType.BAN) && (
                          <div 
                            className="mb-4 p-4 rounded border-0"
                            style={{ 
                              borderRadius: '12px',
                              background: getActionAlertColor().bg,
                              borderLeft: `4px solid ${getActionAlertColor().border} !important`
                            }}
                          >
                            <div className="d-flex align-items-start">
                              <i 
                                className="ti ti-alert-triangle me-3 mt-1" 
                                style={{ fontSize: '1.25rem', color: getActionAlertColor().border }} 
                              />
                              <div>
                                <strong className="d-block mb-2" style={{ color: getActionAlertColor().text }}>
                                  Cảnh báo:
                                </strong>
                                <p className="mb-0" style={{ color: getActionAlertColor().text, lineHeight: '1.7' }}>
                                  Người dùng sẽ bị logout ngay lập tức và nhận được thông báo qua email.
                                  {formData.action === AdminActionType.BAN && (
                                    <>
                                      <br />
                                      <strong className="text-danger">Hành động cấm vĩnh viễn không thể hoàn tác dễ dàng. Hãy chắc chắn về quyết định này.</strong>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {formData.action === AdminActionType.REJECT_REPORT && (
                          <div 
                            className="mb-4 p-4 rounded"
                            style={{ 
                              borderRadius: '12px',
                              background: 'rgba(108, 117, 125, 0.1)',
                              borderLeft: '4px solid #6c757d'
                            }}
                          >
                            <div className="d-flex align-items-start">
                              <i className="ti ti-info-circle me-3 mt-1" style={{ fontSize: '1.25rem', color: '#6c757d' }} />
                              <div>
                                <strong className="d-block mb-2">Lưu ý:</strong>
                                <p className="mb-0" style={{ lineHeight: '1.7' }}>
                                  Khi từ chối báo cáo, không có hành động nào được thực hiện với người bị báo cáo.
                                  Báo cáo sẽ được đánh dấu là "Từ chối" và không thể xử lý lại sau đó.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Form Actions */}
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => {
                              setShowProcessForm(false);
                              setFormData({
                                action: AdminActionType.SUSPEND,
                                suspendDuration: SuspendDuration.SEVEN_DAYS,
                                reason: '',
                              });
                            }}
                            disabled={isProcessing}
                            style={{ borderRadius: '10px', padding: '0.5rem 1.5rem' }}
                          >
                            <i className="ti ti-x me-2" />
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="btn btn-lg"
                            disabled={isProcessing || !formData.reason.trim()}
                            style={{ 
                              borderRadius: '10px', 
                              padding: '0.5rem 1.5rem',
                              background: getFormActionColor().bg,
                              color: getFormActionColor().text,
                              border: 'none'
                            }}
                          >
                            {isProcessing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <i className={`ti ${getFormActionIcon()} me-2`} />
                                Xác nhận {formData.action === AdminActionType.BAN ? 'cấm' : formData.action === AdminActionType.SUSPEND ? 'khóa' : formData.action === AdminActionType.RESTORE ? 'khôi phục' : 'từ chối'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="modal-footer border-0 bg-white"
              style={{ padding: '1.5rem 2rem' }}
            >
              <button 
                type="button" 
                className="btn btn-light" 
                onClick={onClose}
                style={{ borderRadius: '10px', padding: '0.5rem 1.5rem' }}
              >
                <i className="ti ti-x me-2" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Fix CSS conflicts */
        .report-detail-modal .modal-content {
          border: none !important;
        }
        
        .report-detail-modal .card {
          border: none !important;
        }
        
        .report-detail-modal .card-header {
          border-bottom: none !important;
        }
        
        /* Smooth scroll */
        .modal-dialog-scrollable .modal-body {
          max-height: calc(100vh - 250px);
        }
        
        /* Timeline animation */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Form slide down animation */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 2000px;
          }
        }
        
        .timeline-container > div {
          animation: slideIn 0.3s ease-out;
          animation-fill-mode: both;
        }
        
        .timeline-container > div:nth-child(1) { animation-delay: 0.1s; }
        .timeline-container > div:nth-child(2) { animation-delay: 0.2s; }
        .timeline-container > div:nth-child(3) { animation-delay: 0.3s; }
        .timeline-container > div:nth-child(4) { animation-delay: 0.4s; }
        .timeline-container > div:nth-child(5) { animation-delay: 0.5s; }
        
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default ReportDetailModal;
