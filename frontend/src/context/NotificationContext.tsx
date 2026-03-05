import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import socketService, { Notification } from '../services/socketService';
import { useTranslation } from 'react-i18next';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const notifContainerRef = useRef<NotifContainerHandle>(null);
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Initialize socket connection when component mounts
    const initSocket = async () => {
      try {
        await socketService.connect();
        
        // Subscribe to notifications
        socketService.onNotification(handleNewNotification);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    // Cleanup on unmount or when user logs out
    return () => {
      socketService.offNotification(handleNewNotification);
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  // Handle incoming notifications
  const handleNewNotification = (notification: Notification) => {
    console.log('Received notification:', notification);

    // Add to notifications list
    setNotifications((prev) => [notification, ...prev]);

    // Increment unread count if not already read
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Show visual notification using NotifContainer
    showVisualNotification(notification);
  };

  // Show the notification in the UI
  const showVisualNotification = (notification: Notification) => {
    // Convert notification type to message type format expected by NotifContainer
    // e.g., MESSAGE_RECEIVED -> messageReceived
    const messageType = notification.type
      .split('_')
      .map((word, index) => 
        index === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
    
    if (notifContainerRef.current) {
      notifContainerRef.current.addNotification(messageType, notification.payload);
    }
  };

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
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
