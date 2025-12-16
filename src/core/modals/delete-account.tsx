import { Link, useNavigate } from 'react-router-dom'
import { useDeleteAccount, useGetProfile } from '@/apis/user/user.api'
import { useState } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

// Type definition for Bootstrap Modal
interface BootstrapModal {
  getInstance: (element: HTMLElement | null) => { hide: () => void } | null
}

interface WindowWithBootstrap extends Window {
  bootstrap?: {
    Modal: BootstrapModal
  }
}

const DeleteAccount = () => {
  const navigate = useNavigate()
  const { data: profile } = useGetProfile()
  const deleteAccountMutation = useDeleteAccount()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const MySwal = withReactContent(Swal)

  const handleDeleteAccount = async () => {
    if (!profile?.id) {
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        html: '<div style="font-size: 13px; line-height: 1.4;">Không tìm thấy thông tin tài khoản</div>',
        showConfirmButton: false,
        timer: 3000,
        width: '350px',
        padding: '0.75rem',
      })
      return
    }

    try {
      await deleteAccountMutation.mutateAsync(profile.id)
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        html: '<div style="font-size: 13px; line-height: 1.4;">Tài khoản đã được xóa thành công</div>',
        showConfirmButton: false,
        timer: 3000,
        width: '350px',
        padding: '0.75rem',
      })
      // Đóng modal
      const modalElement = document.getElementById('delete-account')
      const modalInstance = (window as WindowWithBootstrap).bootstrap?.Modal.getInstance(modalElement)
      modalInstance?.hide()
      // Chuyển hướng về trang đăng nhập
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi xóa tài khoản'
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        html: `<div style="font-size: 13px; line-height: 1.4;">${errorMessage}</div>`,
        showConfirmButton: false,
        timer: 3000,
        width: '350px',
        padding: '0.75rem',
      })
    }
  }

  return (
    <>
      {/* Delete  Account */}
  <div className="modal fade" id="delete-account">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Xóa tài khoản</h4>
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
          <form onSubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }}>
            <div className="block-wrap mb-3">
              <h6 className="fs-16">
                Bạn có chắc chắn muốn xóa tài khoản ?{" "}
              </h6>
              <p className="text-grya-9">
                Hành động này không thể hoàn tác và toàn bộ dữ liệu
                của bạn sẽ bị xóa vĩnh viễn
              </p>
            </div>
            <div className="mb-3">
              <ul>
                <li className="d-flex align-items-center fs-16 mb-2">
                  <i className="ti ti-arrow-badge-right me-2 fs-20 text-primary" />
                  Xóa thông tin tài khoản và ảnh hồ sơ của bạn
                </li>
                <li className="d-flex align-items-center fs-16 mb-2">
                  <i className="ti ti-arrow-badge-right me-2 fs-20 text-primary" />
                  Xóa bạn khỏi tất cả các nhóm dreamschat
                </li>
                <li className="d-flex fs-16 mb-2">
                  <i className="ti ti-arrow-badge-right me-2 fs-20 text-primary" />
                  Xóa lịch sử tin nhắn của bạn trên điện thoại này
                  và bản sao lưu icloud của bạn
                </li>
              </ul>
            </div>
            <div className="d-flex mb-3">
              <div>
                <input 
                  type="checkbox" 
                  className="me-2" 
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                />
              </div>
              <div>
                <p className="text-grya-9">
                  Tôi hiểu rằng việc xóa tài khoản của tôi là không thể đảo ngược
                  và tất cả dữ liệu của tôi sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <Link
                  to="#"
                  className="btn btn-outline-primary w-100"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  Hủy
                </Link>
              </div>
              <div className="col-6">
                <button 
                  type="submit" 
                  className="btn btn-danger w-100"
                  disabled={!isConfirmed || deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  {/* /Delete Account */}
    </>
  )
}

export default DeleteAccount