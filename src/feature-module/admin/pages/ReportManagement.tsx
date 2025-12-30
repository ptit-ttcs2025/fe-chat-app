/**
 * Report Management (Admin) - Redesigned
 * Modern card-based layout với improved UX
 */

import React, { useState, useMemo, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { useAdminReportList } from '@/hooks/useAdminReports';
import {
  ReportStatus,
  ViolationType,
  ViolationTypeLabels,
  ReportStatusLabels,
} from '@/apis/report/report.type';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReportDetailModal from '@/feature-module/admin/components/ReportDetailModal';
import { all_routes } from '@/feature-module/router/all_routes';

const ReportManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    status: undefined as ReportStatus | undefined,
    violationType: undefined as ViolationType | undefined,
    page: 0,
    size: 20,
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { data: response, isLoading, error, isFetching } = useAdminReportList(filters);

  const reports = response?.data?.results || [];
  const meta = response?.data?.meta;

  // Statistics
  const stats = useMemo(() => {
    const statusCounts = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };
    
    reports.forEach((report) => {
      if (report.status in statusCounts) {
        statusCounts[report.status as keyof typeof statusCounts]++;
      }
    });

    return statusCounts;
  }, [reports]);

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

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      setFilters({ ...filters, page: newPage });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setFilters({
        status: undefined,
        violationType: undefined,
        page: 0,
        size: 20,
      });
    });
  };

  const isFiltering = isFetching || isPending;

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-secondary';
      case 'UNDER_REVIEW':
        return 'bg-info';
      case 'RESOLVED':
        return 'bg-success';
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getViolationBadgeClass = (type: ViolationType) => {
    switch (type) {
      case 'SPAM':
        return 'bg-warning text-dark';
      case 'SCAM':
        return 'bg-danger';
      case 'HARASSMENT':
        return 'bg-purple text-white';
      case 'INAPPROPRIATE_CONTENT':
        return 'bg-orange text-white';
      case 'FAKE_ACCOUNT':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content container-fluid">
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="ti ti-alert-circle me-3" style={{ fontSize: '1.5rem' }} />
            <div>
              <h6 className="alert-heading mb-1">Lỗi tải dữ liệu</h6>
              <p className="mb-0">Không thể tải danh sách báo cáo. Vui lòng thử lại sau.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="page-header">
            <div className="row align-items-center">
              <div className="col">
                <h3 className="page-title mb-2">
                  <i className="ti ti-flag me-2 text-danger" />
                  Quản lý báo cáo vi phạm
                </h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={all_routes.dashboard}>
                        <i className="ti ti-home text-primary" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">Báo cáo</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Quản lý báo cáo
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="col-auto">
                <div className="d-flex align-items-center gap-3">
                  <div className="badge bg-primary fs-6 px-3 py-2">
                    <i className="ti ti-list me-2" />
                    {meta?.totalElements || 0} báo cáo
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {!filters.status && !filters.violationType && (
            <div className="row g-3 mb-4">
              <div className="col-md-4 col-sm-4">
                <div className="card report-stats-card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #6c757d' }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(108, 117, 125, 0.1)'
                          }}
                        >
                          <i className="ti ti-clock text-secondary" style={{ fontSize: '1.5rem' }} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1 small">Chờ xử lý</p>
                        <h3 className="mb-0 fw-bold">{stats.PENDING}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/*<div className="col-md-3 col-sm-6">*/}
              {/*  <div className="card report-stats-card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0dcaf0' }}>*/}
              {/*    <div className="card-body p-3">*/}
              {/*      <div className="d-flex align-items-center">*/}
              {/*        <div className="flex-shrink-0">*/}
              {/*          <div */}
              {/*            className="d-flex align-items-center justify-content-center rounded-circle"*/}
              {/*            style={{*/}
              {/*              width: '48px',*/}
              {/*              height: '48px',*/}
              {/*              background: 'rgba(13, 202, 240, 0.1)'*/}
              {/*            }}*/}
              {/*          >*/}
              {/*            <i className="ti ti-eye text-info" style={{ fontSize: '1.5rem' }} />*/}
              {/*          </div>*/}
              {/*        </div>*/}
              {/*        <div className="flex-grow-1 ms-3">*/}
              {/*          <p className="text-muted mb-1 small">Đang xem xét</p>*/}
              {/*          <h3 className="mb-0 fw-bold">{stats.UNDER_REVIEW}</h3>*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</div>*/}
              <div className="col-md-4 col-sm-4">
                <div className="card report-stats-card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(25, 135, 84, 0.1)'
                          }}
                        >
                          <i className="ti ti-check text-success" style={{ fontSize: '1.5rem' }} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1 small">Đã xử lý</p>
                        <h3 className="mb-0 fw-bold">{stats.RESOLVED}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 col-sm-4">
                <div className="card report-stats-card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(220, 53, 69, 0.1)'
                          }}
                        >
                          <i className="ti ti-x text-danger" style={{ fontSize: '1.5rem' }} />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="text-muted mb-1 small">Từ chối</p>
                        <h3 className="mb-0 fw-bold">{stats.REJECTED}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="row g-4 align-items-end">
                <div className="col-lg-5 col-md-6">
                  <label className="form-label fw-semibold mb-3 d-block">
                    <i className="ti ti-filter me-2 text-primary" />
                    Lọc theo trạng thái
                  </label>
                  <div className="btn-group w-100 filter-btn-group" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${!filters.status ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleStatusFilter(undefined)}
                      disabled={isFiltering}
                    >
                      Tất cả
                    </button>
                    {Object.entries(ReportStatusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`btn btn-sm ${filters.status === key ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleStatusFilter(key as ReportStatus)}
                        disabled={isFiltering}
                        style={{ whiteSpace: 'nowrap', flex: '1 1 0' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-lg-5 col-md-6">
                  <label className="form-label fw-semibold mb-3 d-block">
                    <i className="ti ti-shield-off me-2 text-primary" />
                    Lọc theo loại vi phạm
                  </label>
                  <div className="position-relative">
                    <select
                      className="form-select"
                      value={filters.violationType || ''}
                      onChange={(e) =>
                        handleViolationTypeFilter(
                          e.target.value ? (e.target.value as ViolationType) : undefined
                        )
                      }
                      disabled={isFiltering}
                    >
                      <option value="">Tất cả loại vi phạm</option>
                      {Object.entries(ViolationTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {isFiltering && (
                      <div className="position-absolute top-50 end-0 translate-middle-y pe-3" style={{ pointerEvents: 'none' }}>
                        <span className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-lg-2 col-md-12">
                  {(filters.status || filters.violationType) && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={clearFilters}
                      disabled={isFiltering}
                    >
                      <i className="ti ti-x me-2" />
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="position-relative">
          {reports.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5">
                <div className="text-center">
                  <div className="mb-4">
                    <i className="ti ti-inbox text-muted" style={{ fontSize: '4rem', opacity: 0.3 }} />
                  </div>
                  <h5 className="text-muted mb-2">Không có báo cáo nào</h5>
                  <p className="text-muted mb-0">
                    {filters.status || filters.violationType
                      ? 'Không tìm thấy báo cáo phù hợp với bộ lọc của bạn.'
                      : 'Hiện tại chưa có báo cáo vi phạm nào trong hệ thống.'}
                  </p>
                  {(filters.status || filters.violationType) && (
                    <button
                      className="btn btn-primary mt-3"
                      onClick={clearFilters}
                    >
                      <i className="ti ti-refresh me-2" />
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Loading Overlay */}
              {isFiltering && reports.length > 0 && (
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    borderRadius: '12px',
                    backdropFilter: 'blur(2px)'
                  }}
                >
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="text-muted small mb-0">Đang lọc dữ liệu...</p>
                  </div>
                </div>
              )}

              <div className="row g-3" style={{ opacity: isFiltering && reports.length > 0 ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {reports.map((report) => (
                  <div key={report.id} className="col-12">
                    <div
                      className="card report-card border-0 shadow-sm"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: `4px solid ${
                          report.status === 'PENDING'
                            ? '#6c757d'
                            : report.status === 'UNDER_REVIEW'
                            ? '#0dcaf0'
                            : report.status === 'RESOLVED'
                            ? '#198754'
                            : '#dc3545'
                        }`,
                        borderRadius: '12px',
                      }}
                      onClick={() => handleViewDetail(report.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="row g-4">
                          {/* Left: User Info - Balanced Layout */}
                          <div className="col-lg-4 col-md-5">
                            {/* Reporter */}
                            <div className="mb-4 pb-3 border-bottom">
                              <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                    style={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      width: '48px',
                                      height: '48px',
                                      fontSize: '1.1rem',
                                    }}
                                  >
                                    {report.reporterName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                    <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                                      {report.reporterName}
                                    </span>
                                    <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.7rem', padding: '0.25em 0.5em' }}>
                                      Báo cáo
                                    </span>
                                  </div>
                                  <small className="text-muted d-block" style={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                    {report.reporterEmail}
                                  </small>
                                </div>
                              </div>
                            </div>

                            {/* Target User */}
                            <div>
                              <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                    style={{
                                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                      width: '48px',
                                      height: '48px',
                                      fontSize: '1.1rem',
                                    }}
                                  >
                                    {report.targetUserName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                    <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                                      {report.targetUserName}
                                    </span>
                                    <span className="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: '0.7rem', padding: '0.25em 0.5em' }}>
                                      Bị báo cáo
                                    </span>
                                  </div>
                                  <small className="text-muted d-block" style={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                    {report.targetUserEmail}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Report Info - Better Spacing */}
                          <div className="col-lg-8 col-md-7">
                            {/* Badges */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              <span className={`badge ${getViolationBadgeClass(report.violationType)} px-3 py-2`}>
                                <i className="ti ti-shield-off me-1" />
                                {ViolationTypeLabels[report.violationType]}
                              </span>
                              <span className={`badge ${getStatusBadgeClass(report.status)} px-3 py-2`}>
                                {ReportStatusLabels[report.status]}
                              </span>
                            </div>

                            {/* Description */}
                            <div className="mb-3">
                              <p className="text-muted mb-0" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.6',
                                minHeight: '3.2em',
                                fontSize: '0.9rem'
                              }}>
                                {report.description}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-3 border-top">
                              <div className="d-flex align-items-center gap-2 text-muted">
                                <i className="ti ti-clock" style={{ fontSize: '0.9rem' }} />
                                <small>
                                  {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                  <span className="d-none d-xl-inline ms-2">
                                    ({formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })})
                                  </span>
                                </small>
                              </div>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(report.id);
                                }}
                              >
                                <i className="ti ti-eye me-2" />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="card border-0 shadow-sm mt-3">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <small className="text-muted">
                        Hiển thị{' '}
                        <strong>
                          {filters.page * filters.size + 1} - {Math.min((filters.page + 1) * filters.size, meta.totalElements)}
                        </strong>{' '}
                        trong tổng số <strong>{meta.totalElements}</strong> báo cáo
                      </small>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${filters.page === 0 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page - 1)}
                              disabled={filters.page === 0}
                            >
                              <i className="ti ti-chevron-left" />
                            </button>
                          </li>
                          {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                            let pageNum: number;
                            if (meta.totalPages <= 7) {
                              pageNum = i;
                            } else if (filters.page < 4) {
                              pageNum = i;
                            } else if (filters.page > meta.totalPages - 5) {
                              pageNum = meta.totalPages - 7 + i;
                            } else {
                              pageNum = filters.page - 3 + i;
                            }

                            if (pageNum < 0 || pageNum >= meta.totalPages) return null;

                            return (
                              <li
                                key={pageNum}
                                className={`page-item ${filters.page === pageNum ? 'active' : ''}`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum + 1}
                                </button>
                              </li>
                            );
                          })}
                          <li
                            className={`page-item ${
                              filters.page === meta.totalPages - 1 ? 'disabled' : ''
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page + 1)}
                              disabled={filters.page === meta.totalPages - 1}
                            >
                              <i className="ti ti-chevron-right" />
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={handleCloseModal}
        />
      )}

      <style>{`
        .report-stats-card {
          transition: all 0.2s ease;
          border-radius: 8px !important;
        }
        .report-stats-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
        }
        .report-card {
          border-radius: 8px !important;
        }
        .bg-purple {
          background-color: #9d4edd !important;
        }
        .bg-orange {
          background-color: #f77f00 !important;
        }
        
        /* Fix admin theme CSS conflicts */
        .report-stats-card .card-body,
        .report-card .card-body {
          padding: 1rem !important;
        }
        
        .page-header {
          margin-bottom: 1.5rem !important;
        }
        
        /* Override admin theme button group */
        .btn-group > .btn {
          padding: 0.375rem 0.75rem !important;
        }
        
        /* Fix badge spacing */
        .badge {
          padding: 0.35em 0.65em !important;
          font-size: 0.875em !important;
        }
        
        /* Filter button group spacing */
        .filter-btn-group {
          border-radius: 8px !important;
          overflow: hidden;
        }
        
        .filter-btn-group .btn {
          border-radius: 0 !important;
        }
        
        .filter-btn-group .btn:first-child {
          border-top-left-radius: 8px !important;
          border-bottom-left-radius: 8px !important;
        }
        
        .filter-btn-group .btn:last-child {
          border-top-right-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        
        /* Smooth transitions */
        .report-card {
          opacity: 1;
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ReportManagement;
