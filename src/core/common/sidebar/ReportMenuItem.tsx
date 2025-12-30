/**
 * Report Menu Item
 * Menu item "My Reports" cho user sidebar
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { all_routes } from '@/feature-module/router/all_routes';

export const ReportMenuItem: React.FC = () => {
  const location = useLocation();
  const routes = all_routes;
  const isActive = location.pathname === routes.myReports;

  return (
    <li className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
      <Link
        to={routes.myReports}
        className="sidebar-menu-button"
        data-bs-toggle="tooltip"
        data-bs-placement="right"
        title="My Reports"
      >
        <span className="icon-menu">
          <i className="ti ti-flag" />
        </span>
      </Link>
    </li>
  );
};

export default ReportMenuItem;

