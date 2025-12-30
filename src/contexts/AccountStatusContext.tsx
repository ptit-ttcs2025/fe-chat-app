/**
 * Account Status Context
 * Xử lý force logout và account status changes
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import websocketService from '@/core/services/websocket.service';
import authStorage from '@/lib/authStorage';
import { useDispatch } from 'react-redux';
import { logout } from '@/slices/auth/reducer';
import { toast } from 'react-toastify';
import type {
  ForceLogoutMessage,
  AccountRestoredMessage,
} from '@/apis/report/report.type';

interface AccountStatusContextType {
  isListening: boolean;
}

const AccountStatusContext = createContext<AccountStatusContextType>({
  isListening: false,
});

export const useAccountStatus = () => useContext(AccountStatusContext);

export const AccountStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isListening, setIsListening] = React.useState(false);

  // Handle force logout
  const handleForceLogout = useCallback(
    (message: ForceLogoutMessage) => {
      console.warn('🚨 Force logout received:', message);

      // Show notification
      toast.error(message.message || 'Tài khoản của bạn đã bị khóa', {
        autoClose: 5000,
      });

      // Clear auth data
      authStorage.clearAuthData();
      dispatch(logout());

      // Disconnect WebSocket
      websocketService.disconnect();

      // Redirect to suspended/banned page based on reason
      if (message.reason?.includes('banned')) {
        navigate('/banned');
      } else {
        navigate('/suspended');
      }
    },
    [navigate, dispatch]
  );

  // Handle account restored
  const handleAccountRestored = useCallback(
    (message: AccountRestoredMessage) => {
      console.log('✅ Account restored:', message);

      toast.success(message.message || 'Tài khoản của bạn đã được khôi phục', {
        autoClose: 5000,
      });
    },
    []
  );

  // Subscribe to WebSocket events
  useEffect(() => {
    const isAuthenticated = !!authStorage.getAccessToken();
    if (!isAuthenticated) {
      setIsListening(false);
      return;
    }

    // Wait for WebSocket connection and userId
    const checkAndSubscribe = () => {
      const isConnected = websocketService.getConnectionStatus();
      const userId = websocketService.getCurrentUserId();

      if (!isConnected || !userId) {
        console.log('⏳ Waiting for WebSocket connection and userId...');
        return;
      }

      setIsListening(true);

      const unsubscribeForceLogout =
        websocketService.subscribeToForceLogout(handleForceLogout);
      const unsubscribeAccountRestored =
        websocketService.subscribeToAccountRestored(handleAccountRestored);

      console.log('✅ AccountStatusContext subscribed to force-logout and account-restored');

      return () => {
        unsubscribeForceLogout();
        unsubscribeAccountRestored();
        setIsListening(false);
      };
    };

    // Try to subscribe immediately
    const cleanup = checkAndSubscribe();

    // If WebSocket not ready, poll until it is
    if (!cleanup) {
      const interval = setInterval(() => {
        const newCleanup = checkAndSubscribe();
        if (newCleanup) {
          clearInterval(interval);
        }
      }, 500); // Check every 500ms

      return () => {
        clearInterval(interval);
      };
    }

    return cleanup;
  }, [handleForceLogout, handleAccountRestored]);

  return (
    <AccountStatusContext.Provider value={{ isListening }}>
      {children}
    </AccountStatusContext.Provider>
  );
};

