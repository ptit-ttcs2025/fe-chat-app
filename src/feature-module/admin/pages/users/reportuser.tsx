/**
 * Report User Page (Admin) - Redesigned
 * Đồng bộ theme và layout với User List page
 */

import { useState, useMemo, useTransition } from 'react';
import ImageWithBasePath from '@/core/common/imageWithBasePath';
import { Link } from 'react-router-dom';
import Table from '../../common/dataTable/index';
import { all_routes } from '../../../router/all_routes';
import { useAdminReportList } from '@/hooks/useAdminReports';
import {
  ReportStatus,
  ViolationType,
  ViolationTypeLabels,
  ReportStatusLabels,
  type ReportListItem,
} from '@/apis/report/report.type';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReportDetailModal from '@/feature-module/admin/components/ReportDetailModal';

const Reportuser = () => {
  // Quản lý state
  const [filters, setFilters] = useState({
    status: undefined as ReportStatus | undefined,
    violationType: undefined as ViolationType | undefined,
    page: 0,
    size: 10,
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Lấy dữ liệu từ API
  const { data: response, isLoading, error, isFetching } = useAdminReportList(filters);

  // Memoize reports để tránh re-render không cần thiết
  const reports = useMemo(() => {
    return response?.data?.results || [];
  }, [response]);

  const meta = useMemo(() => {
    return response?.data?.meta;
  }, [response]);

  // Thống kê
  const stats = useMemo(() => {
    return {
      total: meta?.totalElements || 0,
      pending: reports.filter((r: ReportListItem) => r.status === ReportStatus.PENDING).length,
      resolved: reports.filter((r: ReportListItem) => r.status === ReportStatus.RESOLVED).length,
    };
  }, [reports, meta]);

  // Chuyển đổi dữ liệu API sang format bảng
  const tableData = useMemo(() => {
    return reports.map((report: ReportListItem) => ({
      key: report.id,
      id: report.id,
      reporterName: report.reporterName,
      reporterEmail: report.reporterEmail,
      reporterAvatar: report.reporterAvatar,
      targetUserName: report.targetUserName,
      targetUserEmail: report.targetUserEmail,
      targetUserAvatar: report.targetUserAvatar,
      violationType: report.violationType,
      status: report.status,
      createdAt: report.createdAt,
      description: report.description,
    }));
  }, [reports]);

  // Xử lý sự kiện
  const handleViewDetail = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedReportId(null);
  };

  const handleStatusFilter = (status: ReportStatus | undefined) => {
    startTransition(() => {
      setFilters({ ...filters, status, page: 0 });
    });
  };

  const handleViolationTypeFilter = (violationType: ViolationType | undefined) => {
    startTransition(() => {
      setFilters({ ...filters, violationType, page: 0 });
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setFilters({ status: undefined, violationType: undefined, page: 0, size: 10 });
    });
  };

  // Lớp badge
  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return 'badge-secondary';
      case ReportStatus.UNDER_REVIEW:
        return 'badge-info';
      case ReportStatus.RESOLVED:
        return 'badge-success';
      case ReportStatus.REJECTED:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getViolationBadgeClass = (type: ViolationType) => {
    switch (type) {
      case ViolationType.SPAM:
        return 'badge-warning';
      case ViolationType.SCAM:
        return 'badge-danger';
      case ViolationType.HARASSMENT:
        return 'badge-purple';
      case ViolationType.INAPPROPRIATE_CONTENT:
        return 'badge-orange';
      case ViolationType.FAKE_ACCOUNT:
        return 'badge-dark';
      default:
        return 'badge-secondary';
    }
  };

  const columns = [
    {
      title: "Người báo cáo",
      dataIndex: "reporterName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src={record.reporterAvatar || 'assets/admin/img/users/user-01.jpg'}
              className="img-fluid rounded-circle"
              alt={text}
            />
          </Link>
          <div className="ms-2 profile-name">
            <p className="text-dark mb-0">
              <Link to="#" onClick={(e) => { e.preventDefault(); handleViewDetail(record.id); }}>
                {text}
              </Link>
            </p>
            <small className="text-muted">{record.reporterEmail}</small>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.reporterName.localeCompare(b.reporterName),
    },
    {
      title: "Người bị báo cáo",
      dataIndex: "targetUserName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <ImageWithBasePath
              src={record.targetUserAvatar || 'assets/admin/img/users/user-01.jpg'}
              className="img-fluid rounded-circle"
              alt={text}
            />
          </Link>
          <div className="ms-2 profile-name">
            <p className="text-dark mb-0">
              <Link to="#">{text}</Link>
            </p>
            <small className="text-muted">{record.targetUserEmail}</small>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.targetUserName.localeCompare(b.targetUserName),
    },
    {
      title: "Loại vi phạm",
      dataIndex: "violationType",
      render: (type: ViolationType) => (
        <span className={`badge badge-sm ${getViolationBadgeClass(type)}`}>
          {ViolationTypeLabels[type]}
        </span>
      ),
      sorter: (a: any, b: any) => a.violationType.localeCompare(b.violationType),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: ReportStatus) => (
        <span className={`badge badge-sm ${getStatusBadgeClass(status)}`}>
          {ReportStatusLabels[status]}
        </span>
      ),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "createdAt",
      render: (createdAt: string) => (
        <span>{format(new Date(createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
      ),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (description: string) => (
        <div style={{ maxWidth: '200px' }}>
          <span className="text-truncate d-block" title={description}>
            {description}
          </span>
        </div>
      ),
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
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleViewDetail(record.id);
                  }}
                >
                  <i className="ti ti-eye me-2" />
                  Xem chi tiết
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  // Trạng thái đang tải
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

  // Trạng thái lỗi
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="ti ti-alert-circle me-3" style={{ fontSize: '1.5rem' }} />
            <div>
              <h5 className="alert-heading mb-1">Lỗi tải dữ liệu</h5>
              <p className="mb-0">Không thể tải danh sách báo cáo. Vui lòng thử lại sau.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Wrapper trang */}
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Header trang */}
          <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
            <div className="my-auto mb-2 mb-md-0">
              <h4 className="page-title mb-1">Báo cáo vi phạm</h4>
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
                    Báo cáo vi phạm
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
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-pdf me-1" />
                      Xuất PDF
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-xls me-1" />
                      Xuất Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* /Header trang */}

          {/* Thẻ thống kê */}
          <div className="row g-3 mb-4">
            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100" style={{ margin: 0 }}>
                <div className="card-body" style={{ padding: '1.25rem' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-2 text-muted fw-normal">Tổng báo cáo</h6>
                      <h3 className="mb-0 fw-bold">{stats.total}</h3>
                    </div>
                    <div className="avatar avatar-lg bg-primary-light rounded">
                      <i className="ti ti-flag fs-24 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100" style={{ margin: 0 }}>
                <div className="card-body" style={{ padding: '1.25rem' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-2 text-muted fw-normal">Chờ xử lý</h6>
                      <h3 className="mb-0 fw-bold">{stats.pending}</h3>
                    </div>
                    <div className="avatar avatar-lg bg-warning-light rounded">
                      <i className="ti ti-clock fs-24 text-warning" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
              <div className="card h-100" style={{ margin: 0 }}>
                <div className="card-body" style={{ padding: '1.25rem' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-2 text-muted fw-normal">Đã xử lý</h6>
                      <h3 className="mb-0 fw-bold">{stats.resolved}</h3>
                    </div>
                    <div className="avatar avatar-lg bg-success-light rounded">
                      <i className="ti ti-check fs-24 text-success" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Thẻ thống kê */}

          {/* Danh sách báo cáo */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h6 className="mb-3">
                Danh sách báo cáo {stats.total > 0 && <span className="badge badge-primary">{stats.total}</span>}
              </h6>
              <div className="d-flex align-items-center flex-wrap">
                {/* Bộ lọc trạng thái */}
                <div className="dropdown mb-3 me-2">
                  <Link
                    to="#"
                    className="btn btn-white border dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-filter me-2" />
                    {filters.status ? ReportStatusLabels[filters.status] : 'Trạng thái'}
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!filters.status ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleStatusFilter(undefined); }}
                      >
                        Tất cả trạng thái
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${filters.status === ReportStatus.PENDING ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleStatusFilter(ReportStatus.PENDING); }}
                      >
                        {ReportStatusLabels[ReportStatus.PENDING]}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${filters.status === ReportStatus.UNDER_REVIEW ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleStatusFilter(ReportStatus.UNDER_REVIEW); }}
                      >
                        {ReportStatusLabels[ReportStatus.UNDER_REVIEW]}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${filters.status === ReportStatus.RESOLVED ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleStatusFilter(ReportStatus.RESOLVED); }}
                      >
                        {ReportStatusLabels[ReportStatus.RESOLVED]}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${filters.status === ReportStatus.REJECTED ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleStatusFilter(ReportStatus.REJECTED); }}
                      >
                        {ReportStatusLabels[ReportStatus.REJECTED]}
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Bộ lọc loại vi phạm */}
                <div className="dropdown mb-3 me-2">
                  <Link
                    to="#"
                    className="btn btn-white border dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-shield-off me-2" />
                    {filters.violationType ? ViolationTypeLabels[filters.violationType] : 'Loại vi phạm'}
                  </Link>
                  <ul className="dropdown-menu p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!filters.violationType ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleViolationTypeFilter(undefined); }}
                      >
                        Tất cả loại vi phạm
                      </Link>
                    </li>
                    {Object.entries(ViolationTypeLabels).map(([key, label]) => (
                      <li key={key}>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${filters.violationType === key ? 'active' : ''}`}
                          onClick={(e) => { e.preventDefault(); handleViolationTypeFilter(key as ViolationType); }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Xóa bộ lọc */}
                {(filters.status || filters.violationType) && (
                  <button
                    className="btn btn-outline-secondary mb-3"
                    onClick={handleClearFilters}
                    disabled={isPending}
                  >
                    <i className="ti ti-x me-1" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Overlay đang tải */}
            {(isFetching || isPending) && (
              <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center" 
                style={{ 
                  zIndex: 10, 
                  background: 'rgba(255, 255, 255, 0.8)',
                  top: 0,
                  left: 0
                }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
              </div>
            )}

            {/* Bảng báo cáo */}
            <div className="card-body p-0">
              {!isFetching && !isPending && tableData.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-inbox fs-48 text-muted mb-3 d-block" />
                  <h5 className="text-muted">Không có báo cáo nào</h5>
                  <p className="text-muted">Chưa có báo cáo vi phạm nào được ghi nhận.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table columns={columns} dataSource={tableData} Selection={false} />
                </div>
              )}
            </div>

            {/* Phân trang */}
            {meta && meta.totalPages > 1 && (
              <div className="card-footer">
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${meta.pageNumber === 0 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setFilters({ ...filters, page: meta.pageNumber - 1 })}
                        disabled={meta.pageNumber === 0}
                      >
                        Trước
                      </button>
                    </li>

                    {/* Số trang */}
                    {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                      const pageNum = meta.totalPages <= 5
                        ? i
                        : Math.max(0, Math.min(meta.pageNumber - 2, meta.totalPages - 5)) + i;

                      return (
                        <li key={pageNum} className={`page-item ${meta.pageNumber === pageNum ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setFilters({ ...filters, page: pageNum })}>
                            {pageNum + 1}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${meta.pageNumber === meta.totalPages - 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setFilters({ ...filters, page: meta.pageNumber + 1 })}
                        disabled={meta.pageNumber === meta.totalPages - 1}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Thông tin trang */}
                <div className="text-center mt-2 small text-muted">
                  Hiển thị {meta.pageNumber * meta.pageSize + 1} đến {Math.min((meta.pageNumber + 1) * meta.pageSize, meta.totalElements)} trong tổng số {meta.totalElements} báo cáo
                </div>
              </div>
            )}
          </div>
          {/* /Danh sách báo cáo */}
        </div>
      </div>
      {/* /Wrapper trang */}

      {/* Modal chi tiết báo cáo */}
      {showDetailModal && selectedReportId && (
        <ReportDetailModal reportId={selectedReportId} onClose={handleCloseModal} />
      )}

      <style>{`
        /* Sửa màu badge */
        .badge-purple {
          background-color: #9d4edd;
          color: #fff;
        }
        .badge-orange {
          background-color: #f77f00;
          color: #fff;
        }
        
        /* Sửa kích thước avatar */
        .avatar-md {
          width: 40px;
          height: 40px;
        }
        
        .avatar-lg {
          width: 48px;
          height: 48px;
        }
        
        /* Chuyển động mượt mà */
        .card {
          transition: all 0.2s ease;
        }
        
        /* Sửa menu dropdown */
        .dropdown-menu {
          min-width: 200px;
        }
        
        /* Overlay đang tải */
        .position-absolute {
          border-radius: 0.375rem;
        }
        
        /* Fix padding/margin cho thẻ thống kê */
        .row.g-3 > div {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
        
        .row.g-3 > div > .card {
          margin-bottom: 0;
        }
      `}</style>
    </>
  );
};

export default Reportuser;
