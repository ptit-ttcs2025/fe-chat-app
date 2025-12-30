import React, { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastContainer from './ToastContainer';
import { useRespondFriendRequest } from '@/apis/friend/friend.api';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { all_routes } from '@/feature-module/router/all_routes';

const NotificationToastManager: React.FC = () => {
  const { toastNotifications, dismissToast } = useNotifications();
  const respondMutation = useRespondFriendRequest();
  const queryClient = useQueryClient();
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const shownReportIdsRef = useRef<Set<string>>(new Set());

  // Handle accept friend request
  const handleAccept = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'ACCEPT'
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['searchFriends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });

      // Show success notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Đã chấp nhận lời mời!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || 'Không thể chấp nhận lời mời',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  // Handle reject friend request
  const handleReject = async (requestId: string) => {
    try {
      await respondMutation.mutateAsync({
        requestId,
        action: 'REJECT'
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestCount'] });

      // Show success notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Đã từ chối lời mời',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || 'Không thể từ chối lời mời',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  // Handle dismiss toast
  const handleDismiss = (notificationId: string) => {
    dismissToast(notificationId);
  };

  // Handle NEW_REPORT notifications with SweetAlert toast
  useEffect(() => {
    toastNotifications.forEach((notification) => {
      if (notification.type === 'NEW_REPORT' && notification.relatedId) {
        // Avoid showing duplicate toasts
        if (shownReportIdsRef.current.has(notification.relatedId)) {
          return;
        }
        shownReportIdsRef.current.add(notification.relatedId);

        const reporterName = notification.senderName || notification.senderDisplayName || 'Người dùng';
        // Extract target user name from content (format: "{reporterName} đã báo cáo {targetUserName}")
        const targetUserName = notification.content.split(' đã báo cáo ')[1] || 'người dùng';

        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Báo cáo mới',
          html: `<div style="text-align: left;">
            <p style="margin: 0; font-size: 14px;">
              <strong>${reporterName}</strong> đã báo cáo <strong>${targetUserName}</strong>
            </p>
          </div>`,
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          showClass: {
            popup: 'animate__animated animate__fadeInRight'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutRight'
          },
          didOpen: (toast) => {
            toast.addEventListener('click', () => {
              // Navigate to admin reports page
              navigate(all_routes.adminReports);
              // Note: ReportDetailModal will be opened from ReportManagement page based on URL params or state
              dismissToast(notification.id);
            });
          },
          didClose: () => {
            dismissToast(notification.id);
            // Remove from shown set after a delay to allow re-showing if needed
            setTimeout(() => {
              shownReportIdsRef.current.delete(notification.relatedId!);
            }, 10000);
          }
        });
      }
    });
  }, [toastNotifications, navigate, dismissToast, MySwal]);

  return (
    <ToastContainer
      notifications={toastNotifications.filter(n => n.type !== 'NEW_REPORT')}
      onAccept={handleAccept}
      onReject={handleReject}
      onDismiss={handleDismiss}
    />
  );
};

export default NotificationToastManager;

