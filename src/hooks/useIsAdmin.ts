/**
 * useIsAdmin Hook
 * Check if current user has ADMIN role
 */

import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/slices/auth/reducer';

export const useIsAdmin = (): boolean => {
  const user = useSelector(selectCurrentUser);

  if (!user) return false;

  // Check if user has ADMIN role
  // Note: Backend must include 'role' field in JWT token and user object
  const userRole = (user as any)?.role || 'USER';

  return userRole === 'ROLE_ADMIN';
};

export default useIsAdmin;

