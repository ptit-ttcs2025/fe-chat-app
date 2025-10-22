import { useEffect, useRef } from 'react';

/**
 * Custom hook để cleanup Bootstrap modal khi component unmount hoặc khi user navigate
 * Giải quyết vấn đề modal backdrop và body lock khi dùng back/forward button
 * 
 * @param modalId - ID của modal element (ví dụ: 'add-contact')
 * @returns ref để attach vào modal element
 */
export const useModalCleanup = (modalId: string) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modalElement = document.getElementById(modalId);
    
    if (!modalElement) {
      console.warn(`Modal with id "${modalId}" not found`);
      return;
    }

    // Cleanup function
    const cleanupModal = () => {
      try {
        // Import Bootstrap modal instance
        const bootstrap = (window as any).bootstrap;
        
        if (bootstrap && bootstrap.Modal) {
          // Get modal instance
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          
          // Hide modal if it's showing
          if (modalInstance) {
            modalInstance.hide();
          }
        }

        // Manually cleanup modal artifacts
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }

        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        
        // Reset body styles
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
      } catch (error) {
        console.error('Error cleaning up modal:', error);
      }
    };

    // Listen to popstate event (browser back/forward)
    const handlePopState = () => {
      cleanupModal();
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
      cleanupModal();
    };
  }, [modalId]);

  return modalRef;
};

