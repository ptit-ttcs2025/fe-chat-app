/**
 * Admin Guard
 * HOC để bảo vệ admin routes
 * Kiểm tra role ADMIN trong JWT token
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/slices/auth/reducer';
import { all_routes } from '@/feature-module/router/all_routes';
import authStorage from '@/lib/authStorage';
import type { IAuthUser } from '@/apis/auth/auth.type';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = !!authStorage.getAccessToken();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ AdminGuard: User not authenticated, redirecting to admin login');
    return <Navigate to={all_routes.login} replace />;
  }

  // Check if user has ADMIN role
  const userRole = (user as IAuthUser)?.role || 'USER';

  if (userRole !== 'ROLE_ADMIN') {
    console.log('⚠️ AdminGuard: User is not admin, redirecting to chat');
    // ✅ Redirect to chat instead of showing 403 error
    return <Navigate to={all_routes.chat} replace />;
  }

  console.log('✅ AdminGuard: Admin access granted');
  return <>{children}</>;
};


