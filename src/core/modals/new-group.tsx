import { useState, useRef, useEffect } from 'react'
import ImageFallback from '@/components/ImageFallback'
import { useGroupCreation } from '@/contexts/GroupCreationContext'
import { IMAGE_VALIDATION } from '@/apis/upload/upload.type'
import { validateFile } from '@/apis/upload/upload.api'

const NewGroup = () => {
  const {
    groupData,
    setGroupName,
    setGroupDescription,
    setGroupType,
    setAvatarFile,
    setAvatarPreview,
    setIsSendMessageAllowed,
    resetGroupData
  } = useGroupCreation()

  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync local state với context khi modal đóng/mở
  useEffect(() => {
    const modalElement = document.getElementById('new-group')
    const handleModalHidden = () => {
      // Reset validation error khi đóng modal
      setValidationError(null)
    }

    modalElement?.addEventListener('hidden.bs.modal', handleModalHidden)
    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', handleModalHidden)
    }
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateFile(file, IMAGE_VALIDATION)
    if (!validation.valid) {
      setValidationError(validation.error || 'File không hợp lệ')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Clear error
    setValidationError(null)

    // Set file vào context
    setAvatarFile(file)

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setValidationError(null)
  }

  const handleNext = () => {
    // Validation
    if (!groupData.name.trim()) {
      setValidationError('Vui lòng nhập tên nhóm')
      return
    }

    // Clear error
    setValidationError(null)

    console.log('✅ Validation passed, navigating to step 2...')

    // ⭐ FIX: Remove focus from button BEFORE closing modal to avoid ARIA warning
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement.blur) {
      activeElement.blur()
    }

    // Chuyển sang modal thêm thành viên
    const newGroupModal = document.getElementById('new-group')
    const addGroupModal = document.getElementById('add-group')

    if (newGroupModal && addGroupModal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bootstrap = (window as any).bootstrap

      if (!bootstrap || !bootstrap.Modal) {
        console.error('❌ Bootstrap Modal not found')
        return
      }

      // Get or create modal instances
      let bsModal1 = bootstrap.Modal.getInstance(newGroupModal)
      if (!bsModal1) {
        bsModal1 = new bootstrap.Modal(newGroupModal)
      }

      let bsModal2 = bootstrap.Modal.getInstance(addGroupModal)
      if (!bsModal2) {
        bsModal2 = new bootstrap.Modal(addGroupModal)
      }

      // ⭐ FIX: Use Bootstrap event for proper sequencing
      const handleModalHidden = () => {
        // Show second modal after first is completely hidden
        bsModal2.show()
        console.log('✅ Navigated to Add Members modal')

        // Remove this event listener after use
        newGroupModal.removeEventListener('hidden.bs.modal', handleModalHidden)
      }

      // Attach event listener
      newGroupModal.addEventListener('hidden.bs.modal', handleModalHidden)

      // Hide first modal (this will trigger the event)
      bsModal1.hide()
    } else {
      console.error('❌ Modal elements not found', { newGroupModal, addGroupModal })
    }
  }

  const handleCancel = () => {
    resetGroupData()
    setValidationError(null)
  }

  return (
    <>
      {/* New Group */}
      <div className="modal fade" id="new-group">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-semibold">Tạo nhóm mới</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCancel}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form>
                {/* Validation Error Alert */}
                {validationError && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="ti ti-alert-circle me-2" />
                    {validationError}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setValidationError(null)}
                    />
                  </div>
                )}

                {/* Avatar Upload */}
                <div className="d-flex justify-content-center align-items-center mb-4">
                  <div className="position-relative">
                    <label
                      htmlFor="avatar-upload"
                      className="set-pro avatar avatar-xxl rounded-circle mb-0 p-2 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={handleAvatarClick}
                    >
                      {groupData.avatarPreview ? (
                        <ImageFallback
                          src={groupData.avatarPreview}
                          alt="Group avatar"
                          type="group-avatar"
                          className="avatar avatar-xxl rounded-circle"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="avatar avatar-xxl bg-primary-transparent rounded-circle d-flex align-items-center justify-content-center">
                          <i className="ti ti-users-group fs-32 text-primary" />
                        </span>
                      )}
                      <span className="add avatar avatar-sm bg-primary text-white rounded-circle d-flex justify-content-center align-items-center position-absolute bottom-0 end-0 border border-white shadow-sm">
                        {groupData.avatarPreview ? (
                          <i
                            className="ti ti-x fs-14" 
                            onClick={handleRemoveAvatar}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <i className="ti ti-plus fs-14" />
                        )}
                      </span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="avatar-upload"
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                <div className="text-center mb-3">
                  <small className="text-muted">
                    Chấp nhận: JPG, PNG, GIF, WebP. Tối đa 5MB
                  </small>
                </div>

                {/* Group Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Tên nhóm <span className="text-danger">*</span>
                  </label>
                  <div className="input-icon position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tên nhóm"
                      value={groupData.name}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                    />
                    <span className="icon-addon">
                      <i className="ti ti-users-group text-primary" />
                    </span>
                  </div>
                  <small className="text-muted">
                    {groupData.name.length}/50 ký tự
                  </small>
                </div>

                {/* Group Description */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Mô tả nhóm
                  </label>
                  <div className="input-icon position-relative">
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Nhập mô tả về nhóm (tùy chọn)"
                      value={groupData.description}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      maxLength={200}
                      style={{ resize: 'none' }}
                    />
                    <span className="icon-addon" style={{ top: '12px' }}>
                      <i className="ti ti-info-circle text-primary" />
                    </span>
                  </div>
                  <small className="text-muted">
                    {groupData.description.length}/200 ký tự
                  </small>
                </div>

                {/* Group Type */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-3">
                    Loại nhóm
                  </label>
                  <div className="d-flex gap-3">
                    <div className="form-check form-check-card flex-fill">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="groupType"
                        id="groupTypePublic"
                        value="public"
                        checked={groupData.groupType === 'public'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label 
                        className="form-check-label w-100 p-3 border rounded-3 cursor-pointer"
                        htmlFor="groupTypePublic"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: groupData.groupType === 'public' ? '#6338F6' : '#E8E8E9',
                          backgroundColor: groupData.groupType === 'public' ? '#F1EDFE' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <i className="ti ti-world fs-20 text-primary me-2" />
                          <div>
                            <div className="fw-semibold">Công khai</div>
                            <small className="text-muted">Mọi người có thể tìm thấy và tham gia</small>
                          </div>
                        </div>
                      </label>
                    </div>
                    <div className="form-check form-check-card flex-fill">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="groupType"
                        id="groupTypePrivate"
                        value="private"
                        checked={groupData.groupType === 'private'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label 
                        className="form-check-label w-100 p-3 border rounded-3 cursor-pointer"
                        htmlFor="groupTypePrivate"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: groupData.groupType === 'private' ? '#6338F6' : '#E8E8E9',
                          backgroundColor: groupData.groupType === 'private' ? '#F1EDFE' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <i className="ti ti-lock fs-20 text-primary me-2" />
                          <div>
                            <div className="fw-semibold">Riêng tư</div>
                            <small className="text-muted">Chỉ thành viên được mời mới có thể tham gia</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Allow Send Message Setting */}
                <div className="mb-4">
                  <div className="form-check form-check-card p-3 border rounded-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="allowSendMessage"
                      checked={groupData.isSendMessageAllowed}
                      onChange={(e) => setIsSendMessageAllowed(e.target.checked)}
                    />
                    <label className="form-check-label ps-2" htmlFor="allowSendMessage">
                      <div className="d-flex align-items-start">
                        <i className="ti ti-message-circle fs-20 text-primary me-2 mt-1" />
                        <div>
                          <div className="fw-semibold">Cho phép tất cả thành viên gửi tin nhắn</div>
                          <small className="text-muted d-block mt-1">
                            Nếu tắt, chỉ admin mới có thể gửi tin nhắn (dùng cho nhóm thông báo)
                          </small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row g-3 mt-4">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                      onClick={handleCancel}
                    >
                      <i className="ti ti-x me-1" />
                      Hủy
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleNext}
                      disabled={!groupData.name.trim()}
                    >
                      Tiếp theo
                      <i className="ti ti-arrow-right ms-1" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /New Group */}
    </>
  )
}

export default NewGroup
