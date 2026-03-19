import { createContext, useContext, useEffect, useRef, useState, ReactNode, useMemo } from 'react';
import socketService, { Notification } from '../services/socketService';
import NotifContainer, { NotifContainerHandle } from '../components/features/Notif';
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

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Show the notification in the UI
    const showVisualNotification = (notification: Notification) => {
      if (notifContainerRef.current) {
        notifContainerRef.current.addNotification(notification.type, notification.payload);
      }
    };

    // Handle incoming notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('Received notification:', notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Show visual notification using NotifContainer
      showVisualNotification(notification);
    };

    // Initialize socket connection when component mounts
    const initSocket = async () => {
      try {
        await socketService.connect();
        
        // Subscribe to notifications with the correctly scoped handler
        socketService.onNotification(handleNewNotification);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    // Cleanup on unmount or when user logs out
    return () => {
      // Unsubscribe with the same function reference that was subscribed
      socketService.offNotification(handleNewNotification);
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

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
