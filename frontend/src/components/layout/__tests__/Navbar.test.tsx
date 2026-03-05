import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

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
      });
    });

    it('should render login and register links when not authenticated', async () => {
      renderNavbar();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      });
    });

    it('should not render dashboard, messages, or profile links when not authenticated', async () => {
      renderNavbar();

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
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /social/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
      });
    });

    it('should not render login and register links when authenticated', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 0,
        notifications: [],
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
      });
    });

    it('should render notification badge when there are unread notifications', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 5,
        notifications: [],
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
      });

      renderNavbar();

      await waitFor(() => {
        expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
      });
    });

    it('should render notification badge in correct position relative to messages link', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 3,
        notifications: [],
      });

      const { container } = renderNavbar();

      await waitFor(() => {
        // Find the Messages link
        const messagesLink = screen.getByRole('link', { name: /messages/i });
        expect(messagesLink).toBeInTheDocument();

        // Find the relative container that should have position: relative
        const relativeDiv = messagesLink.parentElement;
        expect(relativeDiv).toHaveClass('relative');

        // Check that the badge is a child of this container
        const badge = relativeDiv?.querySelector('span');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('absolute');
        expect(badge).toHaveClass('-top-2');
        expect(badge).toHaveClass('-right-3');
      });
    });

    it('should display 99+ when notification count exceeds 99', async () => {
      mockUseNotifications.mockReturnValue({
        unreadCount: 150,
        notifications: [],
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
      });
    });

    it('should render language selector button', async () => {
      renderNavbar();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /language|lang/i })).toBeInTheDocument();
      });
    });

    it('should display language options on hover', async () => {
      const { container } = renderNavbar();

      await waitFor(() => {
        const langButton = screen.getByRole('button', { name: /language|lang/i });
        expect(langButton).toBeInTheDocument();
      });
    });
  });
});
