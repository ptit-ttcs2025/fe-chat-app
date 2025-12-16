import React from 'react';
import ToastNotification from './ToastNotification';
import type { INotification } from '@/apis/notification/notification.type';
import './toast.scss';

interface ToastContainerProps {
  notifications: INotification[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDismiss: (notificationId: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onAccept,
  onReject,
  onDismiss,
}) => {
  return (
    <div className="toast-container">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          <ToastNotification
            notification={notification}
            onAccept={onAccept}
            onReject={onReject}
            onDismiss={onDismiss}
            autoHideDuration={10000}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

