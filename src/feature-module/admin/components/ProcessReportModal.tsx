/**
 * Process Report Modal (Admin)
 * Modal xử lý report với 4 actions: SUSPEND, BAN, REJECT_REPORT, RESTORE
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

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-gavel me-2" />
              Xử lý báo cáo vi phạm
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isPending}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <strong>Người bị báo cáo:</strong> {targetUserName}
              </div>

              {/* Action Type */}
              <div className="mb-3">
                <label className="form-label">
                  Hành động <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value as AdminActionType,
                    })
                  }
                  required
                >
                  <option value={AdminActionType.SUSPEND}>
                    Tạm khóa tài khoản (SUSPEND)
                  </option>
                  <option value={AdminActionType.BAN}>
                    Cấm vĩnh viễn (BAN)
                  </option>
                  <option value={AdminActionType.REJECT_REPORT}>
                    Từ chối báo cáo (REJECT)
                  </option>
                  <option value={AdminActionType.RESTORE}>
                    Khôi phục tài khoản (RESTORE)
                  </option>
                </select>
                <small className="text-muted d-block mt-2">
                  {getActionDescription()}
                </small>
              </div>

              {/* Suspend Duration (only for SUSPEND action) */}
              {formData.action === AdminActionType.SUSPEND && (
                <div className="mb-3">
                  <label className="form-label">
                    Thời gian khóa <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.suspendDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suspendDuration: e.target.value as SuspendDuration,
                      })
                    }
                    required
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
              <div className="mb-3">
                <label className="form-label">
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
                  placeholder="Nhập lý do chi tiết cho quyết định này (tối đa 500 ký tự)"
                  required
                />
                <small className="text-muted">
                  {formData.reason.length}/500 ký tự
                </small>
              </div>

              {/* Warning */}
              {(formData.action === AdminActionType.SUSPEND ||
                formData.action === AdminActionType.BAN) && (
                <div className="alert alert-warning mb-0">
                  <i className="ti ti-alert-triangle me-2" />
                  <strong>Cảnh báo:</strong> Người dùng sẽ bị logout ngay lập tức và
                  nhận được thông báo qua email.
                </div>
              )}

              {formData.action === AdminActionType.BAN && (
                <div className="alert alert-danger mt-2 mb-0">
                  <i className="ti ti-alert-circle me-2" />
                  <strong>Lưu ý:</strong> Hành động cấm vĩnh viễn không thể hoàn tác
                  dễ dàng. Hãy chắc chắn về quyết định này.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`btn btn-${getActionColor()}`}
                disabled={isPending || !formData.reason.trim()}
              >
                {isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-2" />
                    Xác nhận
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

