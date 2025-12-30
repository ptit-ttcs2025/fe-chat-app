import { useState, useEffect, useRef } from 'react';
import { reportApi } from '@/apis/report/report.api';
import { uploadApi, validateFile } from '@/apis/upload/upload.api';
import { EVIDENCE_VALIDATION } from '@/apis/upload/upload.type';
import { ViolationType, ViolationTypeLabels, type CreateReportRequest } from '@/apis/report/report.type';
import type { IMessage } from '@/apis/chat/chat.type';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface ReportFormModalProps {
  targetUserId: string;
  targetUserName?: string;
  messageContext?: IMessage;
  modalId?: string; // Bootstrap modal ID (default: 'report-form-modal')
  onClose?: () => void;
}

const ReportFormModal = ({
  targetUserId,
  targetUserName,
  messageContext,
  modalId = 'report-form-modal',
  onClose,
}: ReportFormModalProps) => {
  const [violationType, setViolationType] = useState<ViolationType>(ViolationType.SPAM);
  const [description, setDescription] = useState('');
  const [chatLogSnapshot, setChatLogSnapshot] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill chatLogSnapshot from message context
  useEffect(() => {
    if (messageContext?.content) {
      setChatLogSnapshot(messageContext.content);
    }
  }, [messageContext]);

  // Create preview URL for evidence file
  useEffect(() => {
    if (evidenceFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(evidenceFile);
    } else {
      setEvidencePreview(null);
    }
  }, [evidenceFile]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (evidencePreview && evidencePreview.startsWith('data:')) {
        URL.revokeObjectURL(evidencePreview);
      }
    };
  }, [evidencePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEvidenceFile(null);
      setEvidencePreview(null);
      setEvidenceUrl(undefined);
      return;
    }

    // Validate file
    const validation = validateFile(file, EVIDENCE_VALIDATION);
    if (!validation.valid) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Lỗi!',
        text: validation.error || 'File không hợp lệ',
        showConfirmButton: false,
        timer: 3000,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setEvidenceFile(file);
    setErrors(prev => ({ ...prev, evidenceUrl: '' }));
  };

  const handleRemoveFile = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!violationType) {
      newErrors.violationType = 'Vui lòng chọn loại vi phạm';
    }

    if (!description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả vi phạm';
    } else if (description.length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
    }

    if (chatLogSnapshot && chatLogSnapshot.length > 2000) {
      newErrors.chatLogSnapshot = 'Snapshot không được vượt quá 2000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let finalEvidenceUrl = evidenceUrl;

      // Upload file if exists
      if (evidenceFile && !finalEvidenceUrl) {
        try {
          console.log('📤 Uploading evidence file...', { 
            fileName: evidenceFile.name, 
            fileSize: evidenceFile.size,
            fileType: evidenceFile.type 
          });
          
          const uploadResult = await uploadApi.uploadFile({
            file: evidenceFile,
            folder: 'OTHERS',
          });
          
          console.log('✅ Upload result:', uploadResult);
          console.log('✅ Upload result keys:', Object.keys(uploadResult));
          console.log('✅ Upload result type:', typeof uploadResult);
          
          // Kiểm tra an toàn response structure
          if (!uploadResult) {
            throw new Error('Response từ server là undefined hoặc null');
          }
          
          // Xử lý cả nhiều format response có thể:
          // Format 1: {statusCode, message, data: {id, fileUrl, ...}}
          // Format 2: {id, fileUrl, version, createdAt, ...} (trực tiếp)
          // Format 3: {url: "...", ...}
          let fileUrl: string | undefined;
          
          const result = uploadResult as any;
          
          // Thử tìm fileUrl trong nhiều vị trí
          if (result.data?.fileUrl) {
            fileUrl = result.data.fileUrl;
            console.log('✅ Found fileUrl in result.data.fileUrl');
          } else if (result.fileUrl) {
            fileUrl = result.fileUrl;
            console.log('✅ Found fileUrl in result.fileUrl');
          } else if (result.data?.url) {
            fileUrl = result.data.url;
            console.log('✅ Found url in result.data.url');
          } else if (result.url) {
            fileUrl = result.url;
            console.log('✅ Found url in result.url');
          } else if (result.data?.path) {
            fileUrl = result.data.path;
            console.log('✅ Found path in result.data.path');
          } else if (result.path) {
            fileUrl = result.path;
            console.log('✅ Found path in result.path');
          }
          
          if (!fileUrl) {
            console.error('❌ Không tìm thấy fileUrl/url/path trong response:', uploadResult);
            console.error('❌ Available fields:', Object.keys(uploadResult));
            throw new Error('Response không chứa fileUrl, url hoặc path');
          }
          
          finalEvidenceUrl = fileUrl;
          console.log('✅ File uploaded successfully, URL:', finalEvidenceUrl);
        } catch (uploadError: any) {
          console.error('❌ Error uploading file:', uploadError);
          console.error('❌ Upload error details:', {
            error: uploadError,
            errorMessage: uploadError?.message,
            response: uploadError?.response,
            responseData: uploadError?.response?.data,
            stack: uploadError?.stack,
          });
          
          MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Lỗi upload file!',
            text: uploadError?.response?.data?.message || uploadError?.message || 'Không thể upload file bằng chứng',
            showConfirmButton: false,
            timer: 3000,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create report
      const reportData: CreateReportRequest = {
        targetUserId,
        violationType,
        description: description.trim(),
        evidenceUrl: finalEvidenceUrl,
        chatLogSnapshot: chatLogSnapshot.trim() || undefined,
      };

      const response = await reportApi.createReport(reportData);

      console.log('✅ Report created successfully:', response);
      console.log('✅ Report response statusCode:', response.statusCode);
      console.log('✅ Report response data:', response.data);
      console.log('✅ Report response id:', (response as any)?.id);

      // Kiểm tra response thành công
      // Backend có thể trả về nhiều format:
      // 1. {statusCode: 201, data: {...}}
      // 2. {id, reporterId, ...} (trực tiếp)
      const isSuccess = response && (
        response.statusCode === 201 || 
        response.data || 
        (response as any).id || 
        (response as any).reporterId
      );
      
      console.log('✅ isSuccess:', isSuccess);
      
      if (isSuccess) {
        // Reset form TRƯỚC khi đóng modal
        setViolationType(ViolationType.SPAM);
        setDescription('');
        setChatLogSnapshot(messageContext?.content || '');
        setEvidenceFile(null);
        setEvidencePreview(null);
        setEvidenceUrl(undefined);
        setErrors({});
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Reset submitting state
        setIsSubmitting(false);

        // Show success toast notification (không await để không block)
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Báo cáo đã được gửi thành công!',
          html: `<div style="text-align: left;">
            <p style="margin: 0; font-size: 14px;">
              Báo cáo của bạn đã được gửi đến admin. Admin sẽ xem xét trong thời gian sớm nhất.
            </p>
          </div>`,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          showClass: {
            popup: 'animate__animated animate__fadeInRight'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutRight'
          },
          customClass: {
            popup: 'colored-toast'
          }
        });

        // Close modal bằng Bootstrap API sau một chút delay để đảm bảo toast đã hiển thị
        setTimeout(() => {
          const modalElement = document.getElementById(modalId);
          if (modalElement) {
            const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
            if (bsModal) {
              bsModal.hide();
            } else {
              // Nếu không có instance, tạo mới và đóng ngay
              const Modal = (window as any).bootstrap?.Modal;
              if (Modal) {
                const newModal = new Modal(modalElement);
                newModal.hide();
              }
            }
          }

          // Call onClose callback if provided (sau khi đã đóng modal)
          onClose?.();
        }, 300);
      } else {
        // Response không hợp lệ
        setIsSubmitting(false);
        throw new Error('Response không hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('❌ Error creating report:', error);

      const errorMessage = error?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      const errorCode = error?.response?.data?.code;

      // Handle specific error codes
      if (error?.response?.status === 403) {
        if (errorCode === 'CANNOT_REPORT_SELF') {
          MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Lỗi!',
            text: 'Bạn không thể tự báo cáo chính mình',
            showConfirmButton: false,
            timer: 3000,
          });
        } else if (errorCode === 'DAILY_REPORT_LIMIT_EXCEEDED') {
          MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Đã vượt quá giới hạn!',
            text: 'Bạn đã đạt giới hạn 10 báo cáo/ngày. Vui lòng thử lại vào ngày mai.',
            showConfirmButton: false,
            timer: 4000,
          });
        } else {
          MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Lỗi!',
            text: errorMessage,
            showConfirmButton: false,
            timer: 3000,
          });
        }
      } else if (error?.response?.status === 409) {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Báo cáo đã tồn tại!',
          text: 'Bạn đã báo cáo người dùng này. Vui lòng đợi admin xử lý.',
          showConfirmButton: false,
          timer: 4000,
        });
      } else if (error?.response?.status === 429) {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Quá nhiều yêu cầu!',
          text: 'Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau.',
          showConfirmButton: false,
          timer: 4000,
        });
      } else {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi!',
          text: errorMessage,
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setViolationType(ViolationType.SPAM);
    setDescription('');
    setChatLogSnapshot(messageContext?.content || '');
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(undefined);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose?.();
  };

  return (
    <div className="modal fade" id={modalId} tabIndex={-1} aria-labelledby={`${modalId}Label`} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-bottom">
            <h4 className="modal-title fw-semibold" id={`${modalId}Label`}>
              Báo cáo {targetUserName ? `- ${targetUserName}` : ''}
            </h4>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleClose}
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Violation Type */}
              <div className="mb-3">
                <label htmlFor="violationType" className="form-label fw-semibold">
                  Loại vi phạm <span className="text-danger">*</span>
                </label>
                <select
                  id="violationType"
                  className={`form-select ${errors.violationType ? 'is-invalid' : ''}`}
                  value={violationType}
                  onChange={(e) => {
                    setViolationType(e.target.value as ViolationType);
                    setErrors(prev => ({ ...prev, violationType: '' }));
                  }}
                  disabled={isSubmitting}
                >
                  {Object.entries(ViolationTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.violationType && (
                  <div className="invalid-feedback d-block">{errors.violationType}</div>
                )}
              </div>

              {/* Description */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label fw-semibold">
                  Mô tả vi phạm <span className="text-danger">*</span>
                </label>
                <textarea
                  id="description"
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Mô tả chi tiết về hành vi vi phạm..."
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.description ? (
                    <small className="text-danger">{errors.description}</small>
                  ) : (
                    <small className="text-muted">
                      Mô tả chi tiết giúp admin xử lý báo cáo nhanh chóng hơn
                    </small>
                  )}
                  <small className="text-muted">
                    {description.length}/500 ký tự
                  </small>
                </div>
              </div>

              {/* Evidence File Upload */}
              <div className="mb-3">
                <label htmlFor="evidenceFile" className="form-label fw-semibold">
                  File bằng chứng (tùy chọn)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="evidenceFile"
                  className={`form-control ${errors.evidenceUrl ? 'is-invalid' : ''}`}
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                {errors.evidenceUrl && (
                  <div className="invalid-feedback d-block">{errors.evidenceUrl}</div>
                )}
                <small className="text-muted d-block mt-1">
                  Chấp nhận file ảnh (JPEG, PNG, GIF, WebP), tối đa 10MB
                </small>

                {/* File Preview */}
                {evidencePreview && (
                  <div className="mt-3 position-relative" style={{ maxWidth: '300px' }}>
                    <img
                      src={evidencePreview}
                      alt="Evidence preview"
                      className="img-thumbnail"
                      style={{ maxHeight: '200px', width: 'auto' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                      onClick={handleRemoveFile}
                      disabled={isSubmitting}
                      style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
                    >
                      <i className="ti ti-x" style={{ fontSize: '14px' }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Log Snapshot */}
              <div className="mb-4">
                <label htmlFor="chatLogSnapshot" className="form-label fw-semibold">
                  Snapshot chat log (tùy chọn)
                </label>
                <textarea
                  id="chatLogSnapshot"
                  className={`form-control ${errors.chatLogSnapshot ? 'is-invalid' : ''}`}
                  rows={4}
                  value={chatLogSnapshot}
                  onChange={(e) => {
                    setChatLogSnapshot(e.target.value);
                    setErrors(prev => ({ ...prev, chatLogSnapshot: '' }));
                  }}
                  placeholder="Nội dung tin nhắn hoặc đoạn hội thoại vi phạm..."
                  maxLength={2000}
                  disabled={isSubmitting}
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.chatLogSnapshot ? (
                    <small className="text-danger">{errors.chatLogSnapshot}</small>
                  ) : (
                    <small className="text-muted">
                      {messageContext ? 'Đã tự động điền từ tin nhắn được chọn' : 'Có thể sao chép nội dung tin nhắn vi phạm vào đây'}
                    </small>
                  )}
                  <small className="text-muted">
                    {chatLogSnapshot.length}/2000 ký tự
                  </small>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row g-3">
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    data-bs-dismiss="modal"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="submit"
                    className="btn btn-danger w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-send me-2" />
                        Gửi báo cáo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFormModal;
