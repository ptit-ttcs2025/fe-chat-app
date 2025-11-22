import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook tự động cleanup TẤT CẢ các Bootstrap modal khi route thay đổi
 * Sử dụng hook này ở layout chính để áp dụng cho toàn bộ app
 */
export const useModalAutoCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    // Cleanup tất cả modal khi route thay đổi
    const cleanupAllModals = () => {
      try {
        const bootstrap = (window as any).bootstrap;
        
        if (bootstrap && bootstrap.Modal) {
          // Tìm tất cả modal đang mở
          const openModals = document.querySelectorAll('.modal.show');
          
          openModals.forEach((modalElement) => {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
              modalInstance.hide();
            }
          });
        }

        // Cleanup tất cả backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => backdrop.remove());

        // Reset body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
      } catch (error) {
        console.error('Error cleaning up modals:', error);
      }
    };

    cleanupAllModals();
  }, [location.pathname]); // Chạy mỗi khi route thay đổi
};

/**
 * Hook cleanup modal khi browser back/forward
 * Bổ sung cho useModalAutoCleanup để xử lý cả popstate event
 */
export const useModalNavigationCleanup = () => {
  useEffect(() => {
    const handlePopState = () => {
      try {
        const bootstrap = (window as any).bootstrap;
        
        if (bootstrap && bootstrap.Modal) {
          const openModals = document.querySelectorAll('.modal.show');
          
          openModals.forEach((modalElement) => {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
              modalInstance.hide();
            }
          });
        }

        // Cleanup backdrop và body
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => backdrop.remove());
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
      } catch (error) {
        console.error('Error handling popstate:', error);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
};

