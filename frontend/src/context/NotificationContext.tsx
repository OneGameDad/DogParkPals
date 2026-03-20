import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import socketService from '../services/socketService';
import type { Notification } from '../services/socketService';
import NotifContainer from '../components/features/Notif';
import type { NotifContainerHandle } from '../components/features/Notif';
import { useAuth } from '../hooks';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Derive unreadCount from notifications to prevent drift
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);
  
  const notifContainerRef = useRef<NotifContainerHandle>(null);
  const { user, isAuthenticated } = useAuth();
  const handlerRef = useRef<((notification: Notification) => void) | null>(null);
  const socketConnectedRef = useRef(false);

  // Memoized handler using useCallback to ensure stable reference
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('Received notification:', notification);

    // Add to notifications list
    setNotifications((prev) => [notification, ...prev]);

    // Show visual notification using NotifContainer
    if (notifContainerRef.current) {
      notifContainerRef.current.addNotification(notification.type, notification.payload);
    }
  }, []); // No dependencies - this callback never changes

  useEffect(() => {
    // Store the handler in ref for cleanup
    handlerRef.current = handleNewNotification;
  }, [handleNewNotification]);

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!isAuthenticated || !user) {
      // Clean up on logout
      if (socketConnectedRef.current || socketService.getSocket()) {
        console.log('Cleaning up socket connection - user logged out');
        socketConnectedRef.current = false;
        if (handlerRef.current) {
          socketService.offNotification(handlerRef.current);
        }
        socketService.disconnect();
      }
      setNotifications([]);
      return;
    }

    // Initialize socket connection when user logs in
    const initSocket = async () => {
      try {
        // Ensure previous connection is fully cleaned up
        if (socketConnectedRef.current || socketService.getSocket()) {
          console.log('Previous socket connection detected, cleaning up');
          if (handlerRef.current) {
            socketService.offNotification(handlerRef.current);
          }
          socketService.disconnect();
        }

        await socketService.connect();
        const hasSocket = !!socketService.getSocket();
        const isConnected = socketService.isConnected();
        socketConnectedRef.current = hasSocket || isConnected;

        if (!socketConnectedRef.current) {
          console.warn('Socket initialization completed without an active socket');
          return;
        }
        
        // Subscribe to notifications with the stable handler reference
        if (handlerRef.current) {
          socketService.onNotification(handlerRef.current);
          console.log('Socket subscription established for user:', user.id);
        }
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        socketConnectedRef.current = false;
      }
    };

    initSocket();

    // Cleanup on unmount or when user changes
    return () => {
      console.log('NotificationProvider cleanup - user:', user.id);
      socketConnectedRef.current = false;
      // Unsubscribe with the stable function reference
      if (handlerRef.current) {
        socketService.offNotification(handlerRef.current);
      }
      socketService.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    // unreadCount is automatically derived from notifications, no manual update needed
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    // unreadCount is automatically derived from notifications, no manual update needed
  };

  const clearNotifications = () => {
    setNotifications([]);
    // unreadCount is automatically derived from notifications, no manual update needed
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotifContainer ref={notifContainerRef} />
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification context
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
