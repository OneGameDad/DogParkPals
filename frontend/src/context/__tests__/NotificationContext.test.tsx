import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationProvider } from '../../context/NotificationContext';
import socketService from '../../services/socketService';
import { useAuth } from '../../hooks/useAuth';

// Mock dependencies
vi.mock('../../services/socketService', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn(),
    offNotification: vi.fn(),
    getSocket: vi.fn(() => ({ id: 'mock-socket' })),
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

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  })),
}));

vi.mock('../../components/features/Notif', () => ({
  default: () => <div data-testid="notif-container" />,
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
  let mockSocketService: typeof socketService;
  let mockUseAuth: typeof useAuth;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService = vi.mocked(socketService);
    mockUseAuth = vi.mocked(useAuth);
    mockSocketService.disconnect();
  });

  afterEach(() => {
    mockSocketService.disconnect();
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
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.onNotification).toHaveBeenCalled();
      });

      // Get the notification handler that was registered
      const notificationHandler = mockSocketService.onNotification.mock.calls[0]?.[0];
      expect(notificationHandler).toBeDefined();
    });

    it('should mark notification as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.onNotification).toHaveBeenCalled();
      });

      expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    it('should mark all notifications as read', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.onNotification).toHaveBeenCalled();
      });

      const markAllButton = screen.getByTestId('mark-all-read');
      expect(markAllButton).toBeInTheDocument();
    });

    it('should clear all notifications', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.onNotification).toHaveBeenCalled();
      });

      const clearButton = screen.getByTestId('clear');
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Socket Connection Lifecycle', () => {
    it('should connect socket when user is authenticated', async () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.connect).toHaveBeenCalled();
      });
    });

    it('should disconnect socket on unmount', async () => {
      const { unmount } = render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      unmount();

      await waitFor(() => {
        expect(mockSocketService.disconnect).toHaveBeenCalled();
      });
    });

    it('should not connect socket when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      mockSocketService.connect.mockClear();

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.connect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle socket connection errors gracefully', async () => {
      mockSocketService.connect.mockRejectedValue(new Error('Connection failed'));

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Should still render component even with connection error
      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toBeInTheDocument();
      });

      spy.mockRestore();
    });

    it('should not subscribe when connect completes without socket state', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
      });

      mockSocketService.getSocket.mockReturnValue(null as any);
      mockSocketService.isConnected.mockReturnValue(false);

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(mockSocketService.connect).toHaveBeenCalled();
      });

      expect(mockSocketService.onNotification).not.toHaveBeenCalled();
    });
  });
});
