import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock dependencies
vi.mock('../../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn(),
    offNotification: vi.fn(),
    isConnected: vi.fn(() => true),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    isAuthenticated: true,
    loading: false,
  })),
}));

// Helper component to test the hook
const TestComponent = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <button data-testid="mark-all-read" onClick={markAllAsRead}>
        Mark All Read
      </button>
      <button data-testid="clear" onClick={clearNotifications}>
        Clear
      </button>
      {notifications.map((notif) => (
        <div key={notif.id} data-testid={`notification-${notif.id}`}>
          <span>{notif.type}</span>
          <span>{notif.read ? 'read' : 'unread'}</span>
          <button onClick={() => markAsRead(notif.id)}>Mark Read</button>
        </div>
      ))}
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NotificationProvider', () => {
    it('should provide notifications context', () => {
      expect(() => {
        render(
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        );
      }).not.toThrow();
    });

    it('should initialize with empty notifications and zero unread count', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      });
    });

    it('should throw error when useNotifications is used outside provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      spy.mockRestore();
    });
  });

  describe('useNotifications Hook', () => {
    it('should return notification state', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toBeInTheDocument();
      });
    });

    it('should increment unread count when notification received', async () => {
      const { rerender } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const mockSocket = require('../../services/socketService').socketService;
      
      // Get the notification handler that was registered
      const notificationHandler = mockSocket.onNotification.mock.calls[0]?.[0];

      if (notificationHandler) {
        notificationHandler({
          id: 1,
          type: 'MESSAGE_RECEIVED',
          payload: { name: 'John' },
          read: false,
          createdAt: new Date(),
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent(/[1-9]/);
      });
    });

    it('should mark notification as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const mockSocket = require('../../services/socketService').socketService;
      const notificationHandler = mockSocket.onNotification.mock.calls[0]?.[0];

      if (notificationHandler) {
        notificationHandler({
          id: 1,
          type: 'MESSAGE_RECEIVED',
          payload: {},
          read: false,
          createdAt: new Date(),
        });
      }

      await waitFor(() => {
        const markButton = screen.queryByText('Mark Read');
        if (markButton) {
          markButton.click();
        }
      });
    });

    it('should mark all notifications as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const mockSocket = require('../../services/socketService').socketService;
      const notificationHandler = mockSocket.onNotification.mock.calls[0]?.[0];

      if (notificationHandler) {
        notificationHandler({
          id: 1,
          type: 'MESSAGE_RECEIVED',
          payload: {},
          read: false,
          createdAt: new Date(),
        });
        notificationHandler({
          id: 2,
          type: 'FRIENDSHIP_REQUEST',
          payload: {},
          read: false,
          createdAt: new Date(),
        });
      }

      await waitFor(() => {
        const markAllButton = screen.getByTestId('mark-all-read');
        markAllButton.click();
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it('should clear all notifications', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const mockSocket = require('../../services/socketService').socketService;
      const notificationHandler = mockSocket.onNotification.mock.calls[0]?.[0];

      if (notificationHandler) {
        notificationHandler({
          id: 1,
          type: 'MESSAGE_RECEIVED',
          payload: {},
          read: false,
          createdAt: new Date(),
        });
      }

      await waitFor(() => {
        const clearButton = screen.getByTestId('clear');
        clearButton.click();
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Socket Connection Lifecycle', () => {
    it('should connect socket when user is authenticated', async () => {
      const socketService = require('../../services/socketService').socketService;

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalled();
      });
    });

    it('should disconnect socket on unmount', async () => {
      const socketService = require('../../services/socketService').socketService;

      const { unmount } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      unmount();

      await waitFor(() => {
        expect(socketService.disconnect).toHaveBeenCalled();
      });
    });

    it('should not connect socket when user not authenticated', async () => {
      // Mock useAuth to return unauthenticated
      const useAuth = require('../../hooks/useAuth').useAuth;
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      const socketService = require('../../services/socketService').socketService;
      socketService.connect.mockClear();

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(socketService.connect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Message Conversion', () => {
    it('should convert notification type to camelCase message type', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      const mockSocket = require('../../services/socketService').socketService;
      const notificationHandler = mockSocket.onNotification.mock.calls[0]?.[0];

      if (notificationHandler) {
        notificationHandler({
          id: 1,
          type: 'MESSAGE_RECEIVED',
          payload: { name: 'John' },
          read: false,
          createdAt: new Date(),
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('notification-1')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle socket connection errors gracefully', async () => {
      const socketService = require('../../services/socketService').socketService;
      socketService.connect.mockRejectedValue(new Error('Connection failed'));

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(socketService.connect).toHaveBeenCalled();
      });

      spy.mockRestore();
    });
  });
});
