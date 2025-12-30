/**
 * Simplified Admin Sidebar Data
 * Chỉ giữ lại Dashboard, Users và Reports theo yêu cầu
 */

import { all_routes } from "../../../../router/all_routes";

const route = all_routes;

export const SimplifiedSidebarData = [
  {
    label: "Chính",
    icon: "ti ti-page-break",
    submenu: true,
    showSubRoute: false,
    submenuItems: [
      {
        label: "Bảng điều khiển",
        link: route.dashboard,
        showSubRoute: false,
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Người dùng",
        icon: "ti ti-user",
        submenu: true,
        submenuItems: [
          {
            label: "Danh sách người dùng",
            link: route.users,
            icon: "ti ti-point-filled me-2",
          },
          {
            label: "Người dùng bị chặn",
            link: route.blockuser,
            icon: "ti ti-point-filled me-2",
          },
          {
            label: "Người dùng bị báo cáo",
            link: route.reportuser,
            icon: "ti ti-point-filled me-2",
          },
        ],
      },
      {
        label: "Quản lý báo cáo",
        link: route.adminReports,
        showSubRoute: false,
        icon: "ti ti-flag",
      },
    ],
  },
];

// Export SidebarData mặc định là simplified version
export const SidebarData = SimplifiedSidebarData;

