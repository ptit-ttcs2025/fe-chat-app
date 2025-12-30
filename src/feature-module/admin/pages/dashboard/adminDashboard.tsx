import { useState, useMemo } from 'react'
import ImageWithBasePath from '../../../../core/common/imageWithBasePath'
import ReactApexChart from "react-apexcharts";
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import {
  useAdminDashboardStats,
  useAdminRecentUsers,
  useAdminRecentGroups,
  useAdminMonthlyAttendance
} from '@/apis/admin/admin-statistics.api';
import { formatDate } from '@/lib/formatter.helper';

export const AdminDashboard = () => {
  const routes = all_routes;

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: recentUsers = [] } = useAdminRecentUsers();
  const { data: recentGroups = [] } = useAdminRecentGroups();
  const { data: attendanceData = [] } = useAdminMonthlyAttendance(new Date().getFullYear());

  // Dynamic chart data từ backend
  const userGrowthChart = useMemo(() => ({
    chart: {
      height: 250,
      type: "area",
      offsetX: -10,
      offsetY: -10,
      toolbar: { show: false },
    },
    grid: {
      padding: { left: 0, right: 0, bottom: 0, top: 0 }
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    series: [{
      color: '#6338F6',
      name: 'Người dùng hoạt động',
      data: attendanceData?.map((d) => d.activeUserCount) || []
    }],
    xaxis: {
      categories: attendanceData?.map((d) => d.monthName) || [],
    },
  }), [attendanceData]);

  if (statsLoading) {
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

  // Đảm bảo stats không bao giờ undefined
  const safeStats = stats || {
    totalUsers: 0,
    userGrowth: '0%',
    totalGroups: 0,
    groupGrowth: '0%',
    totalChats: 0,
    chatGrowth: '0%',
    totalReports: 0,
    reportGrowth: '0%',
  };

  return (
    <>
  {/* Page Wrapper */}
  <div className="page-wrapper">
    <div className="content container-fluid">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
        <div className="my-auto">
          <h4 className="page-title mb-1">Bảng điều khiển</h4>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to={routes.dashboard}>
                  <i className="ti ti-home text-primary" />
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Bảng điều khiển
              </li>
            </ol>
          </nav>
        </div>
      </div>
      {/* Page Header */}

      {/* Statistics Cards */}
      <div className="row justify-content-center">
        {/* Total Users */}
        <div className="col-md-6 col-xl-3 d-flex">
          <div className="card total-users flex-fill">
            <div className="card-body">
              <div className="total-counts">
                <div className="d-flex align-items-center">
                  <span className="total-count-icons">
                    <i className="ti ti-user-share" />
                  </span>
                  <div>
                    <p>Tổng người dùng</p>
                    <h5>{safeStats.totalUsers}</h5>
                  </div>
                </div>
                <div className="percentage">
                  <span className={`bg-${safeStats.userGrowth?.startsWith('+') ? 'success' : safeStats.userGrowth?.startsWith('-') ? 'danger' : 'secondary'}`}>
                    {safeStats.userGrowth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Groups */}
        <div className="col-md-6 col-xl-3 d-flex">
          <div className="card total-users flex-fill">
            <div className="card-body">
              <div className="total-counts">
                <div className="d-flex align-items-center">
                  <span className="bg-dark total-count-icons">
                    <i className="ti ti-users-group" />
                  </span>
                  <div>
                    <p>Tổng nhóm</p>
                    <h5>{safeStats.totalGroups}</h5>
                  </div>
                </div>
                <div className="percentage">
                  <span className={`bg-${safeStats.groupGrowth?.startsWith('+') ? 'success' : safeStats.groupGrowth?.startsWith('-') ? 'danger' : 'secondary'}`}>
                    {safeStats.groupGrowth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Chats */}
        <div className="col-md-6 col-xl-3 d-flex">
          <div className="card total-users flex-fill">
            <div className="card-body">
              <div className="total-counts">
                <div className="d-flex align-items-center">
                  <span className="bg-purple total-count-icons">
                    <i className="ti ti-brand-hipchat" />
                  </span>
                  <div>
                    <p>Tổng cuộc trò chuyện</p>
                    <h5>{safeStats.totalChats}</h5>
                  </div>
                </div>
                <div className="percentage">
                  <span className={`bg-${safeStats.chatGrowth?.startsWith('+') ? 'success' : safeStats.chatGrowth?.startsWith('-') ? 'danger' : 'secondary'}`}>
                    {safeStats.chatGrowth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Reports */}
        <div className="col-md-6 col-xl-3 d-flex">
          <div className="card total-users flex-fill">
            <div className="card-body">
              <div className="total-counts">
                <div className="d-flex align-items-center">
                  <span className="bg-warning total-count-icons">
                    <i className="ti ti-flag" />
                  </span>
                  <div>
                    <p>Tổng báo cáo</p>
                    <h5>{safeStats.totalReports}</h5>
                  </div>
                </div>
                <div className="percentage">
                  <span className={`bg-${safeStats.reportGrowth?.startsWith('+') ? 'success' : safeStats.reportGrowth?.startsWith('-') ? 'danger' : 'secondary'}`}>
                    {safeStats.reportGrowth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-6 d-flex">
          <div className="card user-details flex-fill">
            <div className="card-header">
              <h5>Thành viên mới tham gia</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Ngày đăng ký</th>
                      <th>Lần đăng nhập cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers && recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link to={routes.users} className="avatar avatar-md">
                                <ImageWithBasePath
                                  src={user.avatarUrl || "assets/admin/img/users/user-01.jpg"}
                                  className="img-fluid rounded-circle"
                                  alt={user.fullName}
                                />
                              </Link>
                              <div className="ms-2 profile-name">
                                <p className="text-dark mb-0">
                                  <Link to={routes.users}>{user.fullName}</Link>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{formatDate(user.regDate)}</td>
                          <td>{user.lastLoginTime ? formatDate(user.lastLoginTime) : 'Chưa bao giờ'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">Không có thành viên mới</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Groups Table */}
        <div className="col-md-6 col-lg-6 d-flex">
          <div className="card user-details flex-fill">
            <div className="card-header">
              <h5>Nhóm mới tạo</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead className="thead-light">
                    <tr>
                      <th>Tên</th>
                      <th>Ngày tạo</th>
                      <th>Hoạt động cuối</th>
                      <th>Thành viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGroups && recentGroups.length > 0 ? (
                      recentGroups.map((group) => (
                        <tr key={group.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link to={routes.group} className="avatar avatar-md">
                                <ImageWithBasePath
                                  src={group.avatarUrl || "assets/admin/img/group-chat/group-01.jpg"}
                                  className="img-fluid rounded-circle"
                                  alt={group.name}
                                />
                              </Link>
                              <div className="ms-2 profile-name">
                                <p className="text-dark mb-0">
                                  <Link to={routes.group}>{group.name}</Link>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(group.createdAt)}</td>
                          <td>{formatDate(group.lastActivity)}</td>
                          <td>{group.memberCount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">Không có nhóm mới</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Chart */}
      <div className="row justify-content-center">
        <div className="col-md-12 col-lg-12 d-flex">
          <div className="card user-details flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title">Người dùng hoạt động theo tháng</h5>
              <div className="text-muted">
                <i className="ti ti-calendar-due me-1" />
                {new Date().getFullYear()}
              </div>
            </div>
            <div className="card-body pb-0">
              <div id="school-area">
                <ReactApexChart
                  options={userGrowthChart}
                  series={userGrowthChart.series}
                  type="area"
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* /Page Wrapper */}
</>

  )
}
