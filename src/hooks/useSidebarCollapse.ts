import { useContext } from 'react';
import { useSidebarContext } from '@/contexts/SidebarContext';

/**
 * Hook to access sidebar collapse state
 * Uses SidebarContext for shared state across components
 */
export const useSidebarCollapse = () => {
  try {
    return useSidebarContext();
  } catch (error) {
    // Fallback if context is not available (should not happen in production)
    console.warn('SidebarContext not available, using fallback');
    return {
      isCollapsed: false,
      toggleCollapse: () => console.warn('SidebarContext not initialized'),
      setIsCollapsed: () => {},
    };
  }
};

