import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import * as AuthModule from '../../../hooks/useAuth';
import * as NotificationContextModule from '../../../context/NotificationContext';

// Mock the hooks
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('react-i18next', () => {
  const t = (key: string, defaultValue?: string) => defaultValue || key;
  return {
    useTranslation: () => ({
      t,
      i18n: {
        changeLanguage: vi.fn(),
      },
    }),
  };
});

describe('Navbar', () => {
  let mockUseAuth: any;
  let mockUseNotifications: any;

  beforeEach(() => {
    mockUseAuth = vi.mocked(AuthModule.useAuth);
    mockUseNotifications = vi.mocked(NotificationContextModule.useNotifications);
    mockUseAuth.mockClear();
    mockUseNotifications.mockClear();
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  const openHamburgerMenu = () => {
    const toggleButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleButton);
  };

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });
    });

    it('should render login and register links when not authenticated', async () => {
      renderNavbar();
      openHamburgerMenu();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /navregister|register/i })).toBeInTheDocument();
      });
    });

    it('should not render dashboard, messages, or profile links when not authenticated', async () => {
      renderNavbar();
      openHamburgerMenu();

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /messages/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', name: 'Test User' },
        loading: false,
      });
    });

    it('should render all navigation links when authenticated', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();
      openHamburgerMenu();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /social/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      });
    });

    it('should not render login and register links when authenticated', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();
      openHamburgerMenu();

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
      });
    });

    it('should render notification badge when there are unread notifications', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 5,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should not render notification badge when there are no unread notifications', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
      });
    });

    it('should display 99+ when notification count exceeds 99', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 150,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should render minimal navbar while loading', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: true,
      });
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      });
    });
  });

  describe('Language Selector', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: '1', name: 'Test User' },
        loading: false,
      });
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
        markAllAsRead: vi.fn(),
      });
    });

    it('should render language selector button', async () => {
      renderNavbar();

      await waitFor(() => {
        expect(screen.getByLabelText('Change language')).toBeInTheDocument();
      });
    });
  });
});
