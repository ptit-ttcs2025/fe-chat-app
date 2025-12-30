/**
 * Process Report Modal (Admin) - Redesigned
 * Modern modal design với improved UX
 */

import React, { useState } from 'react';
import { useProcessReport } from '@/hooks/useAdminReports';
import {
  AdminActionType,
  SuspendDuration,
  SuspendDurationLabels,
  type AdminActionRequest,
} from '@/apis/report/report.type';

interface ProcessReportModalProps {
  reportId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProcessReportModal: React.FC<ProcessReportModalProps> = ({
  reportId,
  targetUserName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<AdminActionRequest>({
    action: AdminActionType.SUSPEND,
    suspendDuration: SuspendDuration.SEVEN_DAYS,
    reason: '',
  });

  const { mutate: processReport, isPending } = useProcessReport();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.reason.trim()) {
      return;
    }

    if (formData.action === AdminActionType.SUSPEND && !formData.suspendDuration) {
      return;
    }

    // Submit
    processReport(
      {
        id: reportId,
        action: formData,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const getActionColor = () => {
    switch (formData.action) {
      case AdminActionType.SUSPEND:
        return 'warning';
      case AdminActionType.BAN:
        return 'danger';
      case AdminActionType.REJECT_REPORT:
        return 'secondary';
      case AdminActionType.RESTORE:
        return 'success';
      default:
        return 'primary';
    }
  };

  const getActionIcon = () => {
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
        return 'warning';
      case AdminActionType.BAN:
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          {/* Header */}
          <div
            className="modal-header border-0 pb-0"
            style={{
              background: `linear-gradient(135deg, ${
                formData.action === AdminActionType.BAN
                  ? '#f5576c 0%, #dc3545 100%'
                  : formData.action === AdminActionType.SUSPEND
                  ? '#ffc107 0%, #ff9800 100%'
                  : formData.action === AdminActionType.RESTORE
                  ? '#28a745 0%, #20c997 100%'
                  : '#6c757d 0%, #495057 100%'
              })`,
              borderRadius: '16px 16px 0 0',
            }}
          >
            <div className="w-100">
              <h5 className="modal-title text-white mb-0">
                <i className={`ti ${getActionIcon()} me-2`} />
                Xử lý báo cáo vi phạm
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isPending}
              style={{ opacity: 1 }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-4">
              {/* Target User Info */}
              <div className="alert alert-info border-0 mb-4" style={{ borderRadius: '12px' }}>
                <div className="d-flex align-items-center">
                  <i className="ti ti-user-x me-3" style={{ fontSize: '1.5rem' }} />
                  <div>
                    <strong>Người bị báo cáo:</strong>
                    <p className="mb-0 mt-1">{targetUserName}</p>
                  </div>
                </div>
              </div>

              {/* Action Type */}
              <div className="mb-4">
                <label className="form-label fw-semibold mb-3">
                  <i className="ti ti-gavel me-2 text-primary" />
                  Hành động <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value as AdminActionType,
                    })
                  }
                  required
                  disabled={isPending}
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
                <div className="mt-3 p-3 bg-light rounded border">
                  <small className="text-muted d-flex align-items-start">
                    <i className="ti ti-info-circle me-2 mt-1" />
                    <span>{getActionDescription()}</span>
                  </small>
                </div>
              </div>

              {/* Suspend Duration (only for SUSPEND action) */}
              {formData.action === AdminActionType.SUSPEND && (
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-3">
                    <i className="ti ti-clock me-2 text-primary" />
                    Thời gian khóa <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.suspendDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suspendDuration: e.target.value as SuspendDuration,
                      })
                    }
                    required
                    disabled={isPending}
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
                <label className="form-label fw-semibold mb-3">
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
                  disabled={isPending}
                  style={{ resize: 'vertical' }}
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <small className="text-muted">
                    Giải thích rõ ràng lý do thực hiện hành động này sẽ giúp cải thiện minh bạch và công bằng.
                  </small>
                  <small className={`${formData.reason.length > 450 ? 'text-danger' : 'text-muted'}`}>
                    {formData.reason.length}/500 ký tự
                  </small>
                </div>
              </div>

              {/* Warning */}
              {(formData.action === AdminActionType.SUSPEND ||
                formData.action === AdminActionType.BAN) && (
                <div className={`alert alert-${getActionAlertColor()} border-0 mb-0`} style={{ borderRadius: '12px' }}>
                  <div className="d-flex align-items-start">
                    <i className={`ti ti-alert-triangle me-3 mt-1`} style={{ fontSize: '1.25rem' }} />
                    <div>
                      <strong>Cảnh báo:</strong>
                      <p className="mb-0 mt-2">
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
                <div className="alert alert-secondary border-0 mb-0" style={{ borderRadius: '12px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ti ti-info-circle me-3 mt-1" style={{ fontSize: '1.25rem' }} />
                    <div>
                      <strong>Lưu ý:</strong>
                      <p className="mb-0 mt-2">
                        Khi từ chối báo cáo, không có hành động nào được thực hiện với người bị báo cáo.
                        Báo cáo sẽ được đánh dấu là "Từ chối" và không thể xử lý lại sau đó.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 bg-light" style={{ borderRadius: '0 0 16px 16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isPending}
              >
                <i className="ti ti-x me-2" />
                Hủy
              </button>
              <button
                type="submit"
                className={`btn btn-${getActionColor()} btn-lg`}
                disabled={isPending || !formData.reason.trim()}
              >
                {isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className={`ti ${getActionIcon()} me-2`} />
                    Xác nhận {formData.action === AdminActionType.BAN ? 'cấm' : formData.action === AdminActionType.SUSPEND ? 'khóa' : formData.action === AdminActionType.RESTORE ? 'khôi phục' : 'từ chối'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcessReportModal;
