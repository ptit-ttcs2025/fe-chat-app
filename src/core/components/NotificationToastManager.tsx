import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import ToastContainer from './ToastContainer';
import { useRespondFriendRequest } from '@/apis/friend/friend.api';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const NotificationToastManager: React.FC = () => {
  const { toastNotifications, dismissToast } = useNotifications();
  const respondMutation = useRespondFriendRequest();
  const queryClient = useQueryClient();
  const MySwal = withReactContent(Swal);

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

  return (
    <ToastContainer
      notifications={toastNotifications}
      onAccept={handleAccept}
      onReject={handleReject}
      onDismiss={handleDismiss}
    />
  );
};

export default NotificationToastManager;

