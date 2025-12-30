/**
 * Report User Modal
 * Modal tạo báo cáo vi phạm với file upload evidence
 */

import React, { useState } from 'react';
import { useCreateReport } from '@/hooks/useReports';
import {
  ViolationType,
  ViolationTypeLabels,
  type CreateReportRequest,
} from '@/apis/report/report.type';
import { uploadApi } from '@/apis/upload/upload.api';
import { toast } from 'react-toastify';

interface ReportUserModalProps {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const EVIDENCE_VALIDATION = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  targetUserId,
  targetUserName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateReportRequest>({
    targetUserId,
    violationType: ViolationType.SPAM,
    description: '',
    evidenceUrl: '',
    chatLogSnapshot: '',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: createReport, isPending } = useCreateReport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = uploadApi.validateFile(file, EVIDENCE_VALIDATION);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload evidence if exists
    let evidenceUrl = formData.evidenceUrl;
    if (evidenceFile) {
      setIsUploading(true);
      try {
        const uploadResult = await uploadApi.uploadFile({
          file: evidenceFile,
          folder: 'FILES',
        });
        evidenceUrl = uploadResult.data.fileUrl;
      } catch {
        toast.error('Không thể tải lên file bằng chứng');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Submit report
    createReport(
      {
        ...formData,
        evidenceUrl,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-flag me-2 text-danger" />
              Báo cáo vi phạm
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isPending || isUploading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Người bị báo cáo</label>
                <input
                  type="text"
                  className="form-control"
                  value={targetUserName}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Loại vi phạm <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.violationType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      violationType: e.target.value as ViolationType,
                    })
                  }
                  required
                >
                  {Object.entries(ViolationTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Mô tả chi tiết <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả chi tiết về vi phạm (tối đa 500 ký tự)"
                  required
                />
                <small className="text-muted">
                  {formData.description.length}/500 ký tự
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Bằng chứng (tùy chọn)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isPending || isUploading}
                />
                <small className="text-muted">
                  Hỗ trợ: JPG, PNG, GIF, WEBP. Tối đa 10MB
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Nhật ký chat (tùy chọn)
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={2000}
                  value={formData.chatLogSnapshot}
                  onChange={(e) =>
                    setFormData({ ...formData, chatLogSnapshot: e.target.value })
                  }
                  placeholder="Sao chép đoạn chat liên quan (tối đa 2000 ký tự)"
                />
              </div>

              <div className="alert alert-info mb-0">
                <i className="ti ti-info-circle me-2" />
                Bạn có thể gửi tối đa 10 báo cáo mỗi ngày. Báo cáo sai sẽ bị từ chối.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isPending || isUploading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={isPending || isUploading || !formData.description}
              >
                {isPending || isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {isUploading ? 'Đang tải lên...' : 'Đang gửi...'}
                  </>
                ) : (
                  <>
                    <i className="ti ti-send me-2" />
                    Gửi báo cáo
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

