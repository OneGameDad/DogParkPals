import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
}

/**
 * Simple notification badge that displays unread count
 * Can be used in navbar or other UI components
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span 
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}
      aria-label={`${unreadCount} unread notifications`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;
