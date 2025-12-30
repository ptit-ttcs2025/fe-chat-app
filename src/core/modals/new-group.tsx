import { useState, useRef, useEffect } from 'react'
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
      {/* New Group Modal */}
      <div className="modal fade" id="new-group" tabIndex={-1} aria-labelledby="newGroupModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="modal-header border-0 pb-3" style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
              <div className="w-100">
                <h4 className="modal-title fw-bold mb-1" style={{ fontSize: '24px', color: '#1a1a1a' }}>
                  Tạo nhóm mới
                </h4>
                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                  Thiết lập thông tin cơ bản cho nhóm của bạn
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCancel}
                style={{ fontSize: '12px', opacity: 0.6 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <form>
                {/* Validation Error Alert */}
                {validationError && (
                  <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '12px', border: 'none', padding: '12px 16px' }}>
                    <i className="ti ti-alert-circle me-2 fs-18" />
                    <span style={{ fontSize: '14px', flex: 1 }}>{validationError}</span>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setValidationError(null)}
                      style={{ fontSize: '10px' }}
                    />
                  </div>
                )}

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
                          e.currentTarget.style.borderColor = '#6338F6'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#f0f0f0'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {groupData.avatarPreview ? (
                          <img
                            src={groupData.avatarPreview}
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

                      {/* Upload/Remove Button */}
                      <div
                        className="position-absolute"
                        style={{
                          bottom: '0',
                          right: '0',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: groupData.avatarPreview ? '#dc3545' : '#6338F6',
                          border: '3px solid #fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={groupData.avatarPreview ? handleRemoveAvatar : handleAvatarClick}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <i
                          className={groupData.avatarPreview ? 'ti ti-x' : 'ti ti-plus'}
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
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                    Tên nhóm <span className="text-danger">*</span>
                  </label>
                  <div className="input-group" style={{ position: 'relative' }}>
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
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Nhập tên nhóm của bạn"
                      value={groupData.name}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
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
                      {groupData.name.length}/50
                    </small>
                  </div>
                </div>

                {/* Group Description */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                    Mô tả nhóm
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: '12px' }}>(Tùy chọn)</span>
                  </label>
                  <div className="input-group" style={{ position: 'relative' }}>
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
                    <textarea
                      className="form-control border-start-0"
                      rows={3}
                      placeholder="Thêm mô tả về nhóm của bạn (ví dụ: mục đích, quy tắc, ...)"
                      value={groupData.description}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      maxLength={200}
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
                      {groupData.description.length}/200
                    </small>
                  </div>
                </div>

                {/* Group Type */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-3" style={{ fontSize: '14px', color: '#1a1a1a' }}>
                    Loại nhóm
                  </label>
                  <div className="d-flex gap-3">
                    {/* Public Group */}
                    <div className="form-check flex-fill" style={{ margin: 0 }}>
                      <input
                        className="form-check-input d-none"
                        type="radio"
                        name="groupType"
                        id="groupTypePublic"
                        value="public"
                        checked={groupData.groupType === 'public'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label
                        htmlFor="groupTypePublic"
                        className="w-100 p-3 border rounded-3 cursor-pointer d-block"
                        style={{
                          cursor: 'pointer',
                          borderColor: groupData.groupType === 'public' ? '#6338F6' : '#e0e0e0',
                          backgroundColor: groupData.groupType === 'public' ? '#f1edfe' : '#fff',
                          transition: 'all 0.2s ease',
                          margin: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (groupData.groupType !== 'public') {
                            e.currentTarget.style.borderColor = '#6338F6'
                            e.currentTarget.style.backgroundColor = '#faf9ff'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (groupData.groupType !== 'public') {
                            e.currentTarget.style.borderColor = '#e0e0e0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: groupData.groupType === 'public' ? '#6338F6' : '#f0f0f0',
                              color: groupData.groupType === 'public' ? '#fff' : '#666',
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
                          {groupData.groupType === 'public' && (
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
                        value="private"
                        checked={groupData.groupType === 'private'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label
                        htmlFor="groupTypePrivate"
                        className="w-100 p-3 border rounded-3 cursor-pointer d-block"
                        style={{
                          cursor: 'pointer',
                          borderColor: groupData.groupType === 'private' ? '#6338F6' : '#e0e0e0',
                          backgroundColor: groupData.groupType === 'private' ? '#f1edfe' : '#fff',
                          transition: 'all 0.2s ease',
                          margin: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (groupData.groupType !== 'private') {
                            e.currentTarget.style.borderColor = '#6338F6'
                            e.currentTarget.style.backgroundColor = '#faf9ff'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (groupData.groupType !== 'private') {
                            e.currentTarget.style.borderColor = '#e0e0e0'
                            e.currentTarget.style.backgroundColor = '#fff'
                          }
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: groupData.groupType === 'private' ? '#6338F6' : '#f0f0f0',
                              color: groupData.groupType === 'private' ? '#fff' : '#666',
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
                          {groupData.groupType === 'private' && (
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
                      borderColor: groupData.isSendMessageAllowed ? '#e0e0e0' : '#ffc107',
                      backgroundColor: groupData.isSendMessageAllowed ? '#fff' : '#fffbf0',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="form-check d-flex align-items-start" style={{ margin: 0 }}>
                      <input
                        className="form-check-input mt-1"
                        type="checkbox"
                        id="allowSendMessage"
                        checked={groupData.isSendMessageAllowed}
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
                              backgroundColor: groupData.isSendMessageAllowed ? '#6338F6' : '#ffc107',
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
                              {groupData.isSendMessageAllowed
                                ? 'Tất cả thành viên có thể gửi tin nhắn trong nhóm'
                                : 'Chỉ admin mới có thể gửi tin nhắn (phù hợp cho nhóm thông báo)'}
                            </small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={handleCancel}
                    style={{
                      height: '48px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderColor: '#e0e0e0',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6338F6'
                      e.currentTarget.style.color = '#6338F6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.color = '#6c757d'
                    }}
                  >
                    <i className="ti ti-x me-2" />
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={handleNext}
                    disabled={!groupData.name.trim()}
                    style={{
                      height: '48px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      backgroundColor: !groupData.name.trim() ? '#ccc' : '#6338F6',
                      borderColor: !groupData.name.trim() ? '#ccc' : '#6338F6',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Tiếp theo
                    <i className="ti ti-arrow-right ms-2" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="avatar-upload"
        style={{ display: 'none' }}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleAvatarChange}
      />
    </>
  )
}

export default NewGroup
