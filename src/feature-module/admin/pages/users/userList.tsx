import { useState } from 'react';
import UserModal from '../../common/modals/userModal'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import Table from "../../common/dataTable/index";
import { all_routes } from '../../../router/all_routes'
import { useAdminUserList, useUpdateUserStatus, useDeleteUser } from '@/apis/admin/admin-user.api';
import { formatDate } from '@/lib/formatter.helper';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const UserList = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [keyword, setKeyword] = useState('');

  // Fetch users from API
  const { data: usersData, isLoading, refetch } = useAdminUserList({
    name: keyword,
    page,
    size,
  });

  // Mutations
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Translate status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Hoạt động',
      'SUSPENDED': 'Đã khóa',
      'BANNED': 'Bị cấm'
    };
    return statusMap[status] || status;
  };

  // Handle block user
  const handleBlockUser = async (userId: string, userName: string) => {
    const result = await MySwal.fire({
      title: 'Khóa người dùng?',
      html: `Bạn có chắc muốn khóa <strong>${userName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Khóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await updateStatusMutation.mutateAsync({
          userId,
          payload: { status: 'SUSPENDED', reason: 'Bị khóa bởi quản trị viên' },
        });

        MySwal.fire({
          icon: 'success',
          title: 'Đã khóa',
          text: 'Người dùng đã được khóa thành công',
          timer: 2000,
          showConfirmButton: false,
        });

        refetch();
      } catch (error: any) {
        MySwal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error?.response?.data?.message || 'Không thể khóa người dùng',
        });
      }
    }
  };

  // Handle unblock user
  const handleUnblockUser = async (userId: string, userName: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        userId,
        payload: { status: 'ACTIVE', reason: 'Được mở khóa bởi quản trị viên' },
      });

      MySwal.fire({
        icon: 'success',
        title: 'Đã mở khóa',
        text: `${userName} đã được mở khóa`,
        timer: 2000,
        showConfirmButton: false,
      });

      refetch();
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error?.response?.data?.message || 'Không thể mở khóa người dùng',
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    const result = await MySwal.fire({
      title: 'Xóa người dùng?',
      html: `Bạn có chắc muốn xóa <strong>${userName}</strong>? Hành động này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await deleteUserMutation.mutateAsync(userId);

        MySwal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Người dùng đã được xóa',
          timer: 2000,
          showConfirmButton: false,
        });

        refetch();
      } catch (error: any) {
        MySwal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error?.response?.data?.message || 'Không thể xóa người dùng',
        });
      }
    }
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "fullName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src={record.avatarUrl || `assets/admin/img/users/user-01.jpg`}
              className="img-fluid rounded-circle"
              alt={text}
            />
          </Link>
          <div className="ms-2 profile-name">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
            <small className="text-muted">@{record.username}</small>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: any, b: any) => a.email.localeCompare(b.email),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      render: (phone: string) => phone || 'Chưa có',
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      render: (date: string) => formatDate(date),
      sorter: (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Trạng thái",
      dataIndex: "accountStatus",
      render: (status: string) => (
        <span className={`badge badge-sm ${
          status === 'ACTIVE' ? 'badge-success' :
          status === 'SUSPENDED' ? 'badge-warning' :
          'badge-danger'
        }`}>
          {translateStatus(status)}
        </span>
      ),
      sorter: (a: any, b: any) => a.accountStatus.localeCompare(b.accountStatus),
    },
    {
      title: "Đăng nhập gần nhất",
      dataIndex: "lastLogin",
      render: (date: string) => date ? formatDate(date) : <span className="text-muted">Chưa có</span>,
    },
    {
      title: "Thao tác",
      dataIndex: "action",
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="ti ti-dots-vertical fs-14" />
            </Link>
            <ul className="dropdown-menu dropdown-menu-right p-3">
              {record.accountStatus === 'ACTIVE' ? (
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBlockUser(record.id, record.fullName);
                    }}
                  >
                    <i className="ti ti-ban me-2" />
                    Khóa
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    className="dropdown-item rounded-1"
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnblockUser(record.id, record.fullName);
                    }}
                  >
                    <i className="ti ti-check me-2" />
                    Mở khóa
                  </Link>
                </li>
              )}
              <li>
                <Link
                  className="dropdown-item rounded-1 text-danger"
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteUser(record.id, record.fullName);
                  }}
                >
                  <i className="ti ti-trash me-2" />
                  Xóa
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
            <div className="my-auto mb-2 mb-md-0">
              <h4 className="page-title mb-1">Quản lý người dùng</h4>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.dashboard}>
                      <i className="ti ti-home text-primary" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Người dùng</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Danh sách
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="dropdown me-2 mb-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn fw-medium d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-file-export me-2" />
                  Xuất dữ liệu
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                    >
                      <i className="ti ti-file-type-pdf me-1" />
                      Xuất PDF
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                    >
                      <i className="ti ti-file-type-xls me-1" />
                      Xuất Excel
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#add_user"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Thêm người dùng
                </Link>
              </div>
            </div>
          </div>
          {/* /Page Header */}

          {/* User List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h6 className="mb-3">
                Danh sách người dùng <span className="badge badge-primary">{usersData?.meta.totalElements || 0}</span>
              </h6>
              <div className="d-flex align-items-center flex-wrap">
                {/* Search Box */}
                <div className="input-icon-start mb-3 me-2 position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(0);
                    }}
                    style={{ minWidth: '250px', paddingLeft: '35px' }}
                  />
                  <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <div className="dropdown mb-3">
                  <Link
                    to="#"
                    className="btn btn-white border dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-sort-ascending-2 me-2" />
                    Sắp xếp
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1 active"
                      >
                        Tăng dần
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Giảm dần
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Mới xem gần đây
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Mới thêm gần đây
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* User List Table */}
            <div className="card-body p-0">
              <Table columns={columns} dataSource={usersData?.results || []} Selection={false} />
            </div>

            {/* Pagination */}
            {usersData && usersData.meta.totalPages > 1 && (
              <div className="card-footer">
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${usersData.meta.pageNumber === 0 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page - 1)}
                        disabled={usersData.meta.pageNumber === 0}
                      >
                        Trước
                      </button>
                    </li>

                    {/* Page numbers */}
                    {[...Array(Math.min(usersData.meta.totalPages, 5))].map((_, i) => {
                      const pageNum = usersData.meta.totalPages <= 5
                        ? i
                        : Math.max(0, Math.min(page - 2, usersData.meta.totalPages - 5)) + i;

                      return (
                        <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPage(pageNum)}>
                            {pageNum + 1}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${usersData.meta.pageNumber === usersData.meta.totalPages - 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPage(page + 1)}
                        disabled={usersData.meta.pageNumber === usersData.meta.totalPages - 1}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Page info */}
                <div className="text-center mt-2 small text-muted">
                  Hiển thị {usersData.meta.pageNumber * usersData.meta.pageSize + 1} đến {Math.min((usersData.meta.pageNumber + 1) * usersData.meta.pageSize, usersData.meta.totalElements)} trong tổng số {usersData.meta.totalElements} người dùng
                </div>
              </div>
            )}
          </div>
          {/* /User List */}
        </div>
      </div>
      {/* /Page Wrapper */}
      <UserModal/>
    </>
  )
}

export default UserList

