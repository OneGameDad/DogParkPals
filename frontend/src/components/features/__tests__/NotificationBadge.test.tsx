import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NotificationBadge from '../../components/features/NotificationBadge';

// Mock the useNotifications hook
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
}));

describe('NotificationBadge', () => {
  let mockUseNotifications: any;

  beforeEach(() => {
    const notificationContext = require('../../context/NotificationContext');
    mockUseNotifications = notificationContext.useNotifications;
    mockUseNotifications.mockClear();
  });

  it('should render badge with unread count', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 5,
      notifications: [],
    });

    render(<NotificationBadge />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should show 99+ for counts over 99', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 150,
      notifications: [],
    });

    render(<NotificationBadge />);

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  it('should not render when unread count is 0', () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
    });

    const { container } = render(<NotificationBadge />);

    expect(container.firstChild).toBeNull();
  });

  it('should have correct styling classes', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 3,
      notifications: [],
    });

    const { container } = render(<NotificationBadge />);

    await waitFor(() => {
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-red-600');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  it('should accept custom className', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 1,
      notifications: [],
    });

    const { container } = render(
      <NotificationBadge className="custom-class" />
    );

    await waitFor(() => {
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-class');
    });
  });

  it('should have correct aria-label', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 3,
      notifications: [],
    });

    render(<NotificationBadge />);

    await waitFor(() => {
      const badge = screen.getByLabelText('3 unread notifications');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should update when unread count changes', async () => {
    const { rerender } = render(<NotificationBadge />);

    mockUseNotifications.mockReturnValue({
      unreadCount: 2,
      notifications: [],
    });

    rerender(<NotificationBadge />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    mockUseNotifications.mockReturnValue({
      unreadCount: 5,
      notifications: [],
    });

    rerender(<NotificationBadge />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should hide when count goes to 0', async () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 1,
      notifications: [],
    });

    const { container, rerender } = render(<NotificationBadge />);

    expect(container.querySelector('span')).toBeInTheDocument();

    mockUseNotifications.mockReturnValue({
      unreadCount: 0,
      notifications: [],
    });

    rerender(<NotificationBadge />);

    await waitFor(() => {
      expect(container.querySelector('span')).not.toBeInTheDocument();
    });
  });
});
