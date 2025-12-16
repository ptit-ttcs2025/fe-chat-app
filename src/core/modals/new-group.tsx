import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../common/imageWithBasePath'
import ImageFallback from '@/components/ImageFallback'

const NewGroup = () => {
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupType, setGroupType] = useState<'public' | 'private'>('public')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNext = () => {
    // Validation
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm')
      return
    }
    // Chuyển sang modal thêm thành viên
    const newGroupModal = document.getElementById('new-group')
    const addGroupModal = document.getElementById('add-group')
    if (newGroupModal && addGroupModal) {
      const bsModal1 = (window as any).bootstrap?.Modal?.getInstance(newGroupModal)
      const bsModal2 = (window as any).bootstrap?.Modal?.getInstance(addGroupModal)
      bsModal1?.hide()
      setTimeout(() => {
        bsModal2?.show()
      }, 300)
    }
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
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form>
                {/* Avatar Upload */}
                <div className="d-flex justify-content-center align-items-center mb-4">
                  <div className="position-relative">
                    <label
                      htmlFor="avatar-upload"
                      className="set-pro avatar avatar-xxl rounded-circle mb-0 p-2 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={handleAvatarClick}
                    >
                      {avatarPreview ? (
                        <ImageFallback
                          src={avatarPreview}
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
                        {avatarPreview ? (
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
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
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
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                    />
                    <span className="icon-addon">
                      <i className="ti ti-users-group text-primary" />
                    </span>
                  </div>
                  <small className="text-muted">
                    {groupName.length}/50 ký tự
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
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      maxLength={200}
                      style={{ resize: 'none' }}
                    />
                    <span className="icon-addon" style={{ top: '12px' }}>
                      <i className="ti ti-info-circle text-primary" />
                    </span>
                  </div>
                  <small className="text-muted">
                    {groupDescription.length}/200 ký tự
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
                        checked={groupType === 'public'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label 
                        className="form-check-label w-100 p-3 border rounded-3 cursor-pointer"
                        htmlFor="groupTypePublic"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: groupType === 'public' ? '#6338F6' : '#E8E8E9',
                          backgroundColor: groupType === 'public' ? '#F1EDFE' : 'transparent',
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
                        checked={groupType === 'private'}
                        onChange={(e) => setGroupType(e.target.value as 'public' | 'private')}
                      />
                      <label 
                        className="form-check-label w-100 p-3 border rounded-3 cursor-pointer"
                        htmlFor="groupTypePrivate"
                        style={{ 
                          cursor: 'pointer',
                          borderColor: groupType === 'private' ? '#6338F6' : '#E8E8E9',
                          backgroundColor: groupType === 'private' ? '#F1EDFE' : 'transparent',
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

                {/* Action Buttons */}
                <div className="row g-3 mt-4">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      data-bs-dismiss="modal"
                      aria-label="Close"
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
                      disabled={!groupName.trim()}
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
