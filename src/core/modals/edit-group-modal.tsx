/**
 * Edit Group Modal
 * Modal chỉnh sửa thông tin nhóm (chỉ admin)
 */

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import type { IGroup, UpdateGroupRequest } from "@/apis/group/group.type";
import { groupApi } from "@/apis/group/group.api";
import { uploadApi, validateFile } from "@/apis/upload/upload.api";
import { IMAGE_VALIDATION } from "@/apis/upload/upload.type";

// Helper interface for upload response
interface UploadResponse {
  data?: { fileUrl?: string; url?: string };
  fileUrl?: string;
  url?: string;
}

interface EditGroupModalProps {
  show: boolean;
  onHide: () => void;
  groupId: string | null; // ✅ Changed from group to groupId
  onUpdate: (data: UpdateGroupRequest) => Promise<void>;
}

const EditGroupModal = ({
  show,
  onHide,
  groupId,
  onUpdate,
}: EditGroupModalProps) => {
  // Form states
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSendMessageAllowed, setIsSendMessageAllowed] = useState(true);

  // UI states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch group data when modal opens
  useEffect(() => {
    const fetchGroupData = async () => {
      console.log('🔍 [EditGroupModal] useEffect triggered:', {
        show,
        groupId,
        hasGroupId: !!groupId,
      });

      if (!show || !groupId) {
        console.log('⚠️ [EditGroupModal] Skip fetch:', {
          show,
          groupId,
          reason: !show ? 'Modal not shown' : 'No groupId'
        });
        return;
      }

      console.log('🚀 [EditGroupModal] Starting fetch for groupId:', groupId);
      setIsLoading(true);
      setValidationError(null);

      try {
        console.log('📡 [EditGroupModal] Calling groupApi.getGroup...');
        const response = await groupApi.getGroup(groupId);

        console.log('📦 [EditGroupModal] Raw response:', response);

        // API returns IGroup directly (not wrapped in ApiResponse.data)
        // Type cast to handle the actual API behavior
        const groupData = response as unknown as IGroup;

        console.log('📦 [EditGroupModal] Group data extracted:', groupData);

        if (!groupData || !groupData.id) {
          console.error('❌ [EditGroupModal] groupData is null/undefined or missing id');
          console.error('❌ [EditGroupModal] Full response:', JSON.stringify(response, null, 2));
          setValidationError('Không tìm thấy thông tin nhóm.');
          return;
        }

        console.log('✅ [EditGroupModal] Group data fetched successfully:', {
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          avatarUrl: groupData.avatarUrl,
          isPublic: groupData.isPublic,
          isSendMessageAllowed: groupData.isSendMessageAllowed,
        });

        // Pre-fill form
        console.log('📝 [EditGroupModal] Pre-filling form...');
        setGroupName(groupData.name || "");
        setDescription(groupData.description || "");
        setAvatarUrl(groupData.avatarUrl || "");
        setAvatarPreview(groupData.avatarUrl || null);
        setIsPublic(groupData.isPublic || false);
        setIsSendMessageAllowed(groupData.isSendMessageAllowed ?? true);
        setAvatarFile(null);

        console.log('✅ [EditGroupModal] Form pre-filled successfully');
      } catch (error) {
        console.error('❌ [EditGroupModal] Failed to fetch group data:', error);
        console.error('❌ [EditGroupModal] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          error,
        });
        setValidationError('Không thể tải thông tin nhóm. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
        console.log('🏁 [EditGroupModal] Fetch completed');
      }
    };

    fetchGroupData();
  }, [show, groupId]);

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, IMAGE_VALIDATION);
    if (!validation.valid) {
      setValidationError(validation.error || "File không hợp lệ");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Clear error
    setValidationError(null);
    setAvatarFile(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setValidationError("Vui lòng nhập tên nhóm");
      return;
    }

    setIsUpdating(true);
    setValidationError(null);

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if exists
      if (avatarFile) {
        try {
          console.log("📤 Uploading avatar...", {
            fileName: avatarFile.name,
            fileSize: avatarFile.size,
            fileType: avatarFile.type,
          });

          const uploadResult = await uploadApi.uploadFile({
            file: avatarFile,
            folder: "GROUP_AVATARS",
          });

          console.log("✅ Upload result:", uploadResult);

          // Extract fileUrl from response
          const result = uploadResult as UploadResponse;
          const fileUrl =
            result.data?.fileUrl ||
            result.fileUrl ||
            result.data?.url ||
            result.url;

          if (!fileUrl) {
            throw new Error("Không thể lấy URL của file đã upload");
          }

          finalAvatarUrl = fileUrl;
          console.log("✅ Avatar uploaded successfully, URL:", finalAvatarUrl);
        } catch (uploadError: unknown) {
          console.error("❌ Error uploading avatar:", uploadError);
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Không thể upload avatar";
          setValidationError(errorMessage);
          setIsUpdating(false);
          return;
        }
      }

      // Update group
      await onUpdate({
        name: groupName.trim(),
        description: description.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        isPublic,
        isSendMessageAllowed,
      });

      // Success notification handled in parent component
    } catch (error: unknown) {
      console.error("❌ Error updating group:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật nhóm. Vui lòng thử lại.";
      setValidationError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setValidationError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header className="border-0 pb-3" style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
        <div className="w-100">
          <Modal.Title className="fw-bold mb-1" style={{ fontSize: '24px', color: '#1a1a1a' }}>
            Chỉnh sửa nhóm
          </Modal.Title>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            Cập nhật thông tin nhóm của bạn
          </p>
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
              Đang tải thông tin nhóm...
            </p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
          {/* Validation Error Alert */}
          {validationError && (
            <div
              className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4"
              role="alert"
              style={{ borderRadius: '12px', border: 'none', padding: '12px 16px' }}
            >
              <i className="ti ti-alert-circle me-2 fs-18" />
              <span style={{ fontSize: '14px', flex: 1 }}>{validationError}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />

          {/* Avatar Upload Section */}
          <div className="mb-4">
            <div className="d-flex justify-content-center align-items-center">
              <div className="position-relative" style={{ marginBottom: '8px' }}>
                {/* Avatar Container */}
                <div
                  onClick={handleAvatarClick}
                  className="position-relative"
                  style={{
                    cursor: 'pointer',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #f0f0f0',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6338F6';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#f0f0f0';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Group avatar preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center w-100 h-100">
                      <i className="ti ti-users-group" style={{ fontSize: '48px', color: '#6338F6', opacity: 0.5 }} />
                    </div>
                  )}
                </div>

                {/* Upload/Edit/Remove Button */}
                <div
                  className="position-absolute"
                  style={{
                    bottom: '0',
                    right: '0',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: avatarPreview ? '#dc3545' : '#6338F6',
                    border: '3px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={avatarPreview ? handleRemoveAvatar : handleAvatarClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i
                    className={avatarPreview ? 'ti ti-x' : 'ti ti-camera'}
                    style={{ fontSize: '16px', color: '#fff' }}
                  />
                </div>
              </div>
            </div>

            {/* File Info Text */}
            <div className="text-center mt-2">
              <small className="text-muted" style={{ fontSize: '12px' }}>
                <i className="ti ti-photo me-1" />
                Chấp nhận: JPG, PNG, GIF, WebP (tối đa 5MB)
              </small>
            </div>
          </div>

          {/* Group Name */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#1a1a1a' }}>
              Tên nhóm <span className="text-danger">*</span>
            </Form.Label>
            <div className="input-group">
              <span
                className="input-group-text bg-light border-end-0"
                style={{
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px',
                  borderColor: '#e0e0e0',
                  paddingLeft: '16px',
                  paddingRight: '12px',
                }}
              >
                <i className="ti ti-users-group text-primary" style={{ fontSize: '18px' }} />
              </span>
              <Form.Control
                type="text"
                placeholder="Nhập tên nhóm"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                required
                className="border-start-0"
                style={{
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px',
                  borderColor: '#e0e0e0',
                  paddingLeft: '12px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  height: '48px',
                }}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted" style={{ fontSize: '12px' }}>
                <i className="ti ti-info-circle me-1" />
                Tên nhóm sẽ hiển thị cho tất cả thành viên
              </small>
              <small className="text-muted fw-medium" style={{ fontSize: '12px' }}>
                {groupName.length}/50
              </small>
            </div>
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#1a1a1a' }}>
              Mô tả nhóm
              <span className="text-muted fw-normal ms-1" style={{ fontSize: '12px' }}>(Tùy chọn)</span>
            </Form.Label>
            <div className="input-group">
              <span
                className="input-group-text bg-light border-end-0 align-items-start"
                style={{
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px',
                  borderColor: '#e0e0e0',
                  paddingTop: '12px',
                  paddingLeft: '16px',
                  paddingRight: '12px',
                }}
              >
                <i className="ti ti-info-circle text-primary mt-1" style={{ fontSize: '18px' }} />
              </span>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Mô tả ngắn về nhóm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="border-start-0"
                style={{
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px',
                  borderColor: '#e0e0e0',
                  paddingLeft: '12px',
                  paddingRight: '16px',
                  paddingTop: '12px',
                  fontSize: '14px',
                  resize: 'none',
                }}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted" style={{ fontSize: '12px' }}>
                <i className="ti ti-lightbulb me-1" />
                Giúp thành viên hiểu rõ hơn về nhóm
              </small>
              <small className="text-muted fw-medium" style={{ fontSize: '12px' }}>
                {description.length}/200
              </small>
            </div>
          </Form.Group>

          {/* Group Type */}
          <div className="mb-4">
            <Form.Label className="fw-semibold mb-3" style={{ fontSize: '14px', color: '#1a1a1a' }}>
              Loại nhóm
            </Form.Label>
            <div className="d-flex gap-3">
              {/* Public Group */}
              <div className="form-check flex-fill" style={{ margin: 0 }}>
                <input
                  className="form-check-input d-none"
                  type="radio"
                  name="groupType"
                  id="groupTypePublic"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                />
                <label
                  htmlFor="groupTypePublic"
                  className="w-100 p-3 border rounded-3 cursor-pointer d-block"
                  style={{
                    cursor: 'pointer',
                    borderColor: isPublic ? '#6338F6' : '#e0e0e0',
                    backgroundColor: isPublic ? '#f1edfe' : '#fff',
                    transition: 'all 0.2s ease',
                    margin: 0,
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: isPublic ? '#6338F6' : '#f0f0f0',
                        color: isPublic ? '#fff' : '#666',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ti ti-world" style={{ fontSize: '20px' }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                        Công khai
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        Mọi người có thể tìm thấy và tham gia nhóm
                      </small>
                    </div>
                    {isPublic && (
                      <i className="ti ti-check text-primary" style={{ fontSize: '20px', marginLeft: '8px' }} />
                    )}
                  </div>
                </label>
              </div>

              {/* Private Group */}
              <div className="form-check flex-fill" style={{ margin: 0 }}>
                <input
                  className="form-check-input d-none"
                  type="radio"
                  name="groupType"
                  id="groupTypePrivate"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                />
                <label
                  htmlFor="groupTypePrivate"
                  className="w-100 p-3 border rounded-3 cursor-pointer d-block"
                  style={{
                    cursor: 'pointer',
                    borderColor: !isPublic ? '#6338F6' : '#e0e0e0',
                    backgroundColor: !isPublic ? '#f1edfe' : '#fff',
                    transition: 'all 0.2s ease',
                    margin: 0,
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: !isPublic ? '#6338F6' : '#f0f0f0',
                        color: !isPublic ? '#fff' : '#666',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ti ti-lock" style={{ fontSize: '20px' }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                        Riêng tư
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        Chỉ thành viên được mời mới có thể tham gia
                      </small>
                    </div>
                    {!isPublic && (
                      <i className="ti ti-check text-primary" style={{ fontSize: '20px', marginLeft: '8px' }} />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Allow Send Message Setting */}
          <div className="mb-4">
            <div
              className="p-3 border rounded-3"
              style={{
                borderColor: isSendMessageAllowed ? '#e0e0e0' : '#ffc107',
                backgroundColor: isSendMessageAllowed ? '#fff' : '#fffbf0',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="form-check d-flex align-items-start" style={{ margin: 0 }}>
                <input
                  className="form-check-input mt-1"
                  type="checkbox"
                  id="allowSendMessage"
                  checked={isSendMessageAllowed}
                  onChange={(e) => setIsSendMessageAllowed(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    marginTop: '2px',
                  }}
                />
                <label className="form-check-label ps-3 flex-grow-1" htmlFor="allowSendMessage" style={{ cursor: 'pointer', margin: 0 }}>
                  <div className="d-flex align-items-start">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: isSendMessageAllowed ? '#6338F6' : '#ffc107',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ti ti-message-circle" style={{ fontSize: '18px' }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                        Cho phép tất cả thành viên gửi tin nhắn
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        {isSendMessageAllowed
                          ? 'Tất cả thành viên có thể gửi tin nhắn trong nhóm'
                          : 'Chỉ admin có thể gửi tin nhắn (chế độ thông báo)'
                        }
                      </small>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 d-flex justify-content-between" style={{ padding: '16px 24px 24px 24px' }}>
        <Button
          variant="danger"
          onClick={handleClose}
          disabled={isUpdating}
          style={{
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            minWidth: '120px',
          }}
        >
          <i className="ti ti-x me-2" />
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!groupName.trim() || isUpdating}
          style={{
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            minWidth: '160px',
          }}
        >
          {isUpdating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Đang lưu...
            </>
          ) : (
            <>
              <i className="ti ti-check me-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditGroupModal;

