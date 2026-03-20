import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import NotifContainer from '../Notif';
import userEvent from '@testing-library/user-event';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
    i18n: { exists: () => true },
  })),
}));

describe('NotifContainer - Auto-Dismiss & Cleanup Fixes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Auto-dismiss timeout tracking', () => {
    it('should display notification and auto-dismiss after 5 seconds', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      containerRef.current?.addNotification('messageReceived', { name: 'John' });

      // Should display notification
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(1);

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      // Should be gone
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);
    });

    it('should handle multiple notifications with independent timeouts', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      vi.advanceTimersByTime(1000);
      containerRef.current?.addNotification('friendRequest', { name: 'Jane' });

      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(2);

      // First notification disappears after 5 seconds from creation
      vi.advanceTimersByTime(4000); // Total 5s from first
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(1);

      // Second notification disappears 1 second later
      vi.advanceTimersByTime(1000); // Total 5s from second
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);
    });

    it('should clear timeout when notification is manually closed', async () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      const closeButton = container.querySelector('button[aria-label="Close notification"]') as HTMLElement;

      const user = userEvent.setup({ delay: null });
      await user.click(closeButton);

      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);

      // Advance timers - should stay gone
      vi.advanceTimersByTime(10000);
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);
    });

    it('should cleanup all timeouts on component unmount', () => {
      const containerRef = { current: null as any };
      const { container, unmount } = render(<NotifContainer ref={containerRef} />);

      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      containerRef.current?.addNotification('friendRequest', { name: 'Jane' });

      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(2);

      unmount();

      // Should not throw when advancing timers after unmount
      expect(() => {
        vi.advanceTimersByTime(10000);
      }).not.toThrow();
    });
  });

  describe('Unique notification IDs', () => {
    it('should generate unique IDs for each notification', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      // Add same notification type multiple times
      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      containerRef.current?.addNotification('messageReceived', { name: 'John' });

      // Should have 3 separate notifications
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(3);
    });
  });

  describe('Notification display and positioning', () => {
    it('should have correct z-index for layering', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      containerRef.current?.addNotification('messageReceived', { name: 'John' });

      const wrapper = container.firstChild as HTMLElement;
      const classList = Array.from(wrapper.classList);
      expect(classList).toContain('z-50');
    });

    it('should be positioned in top-right corner', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      const wrapper = container.firstChild as HTMLElement;
      const classList = Array.from(wrapper.classList);
      expect(classList).toContain('fixed');
      expect(classList).toContain('top-4');
      expect(classList).toContain('right-4');
    });
  });

  describe('Multiple notifications lifecycle', () => {
    it('should handle rapid notifications without losing any', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      // Rapidly add 5 notifications
      for (let i = 0; i < 5; i++) {
        containerRef.current?.addNotification('messageReceived', { name: `User${i}` });
      }

      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(5);

      // All should dismiss after 5 seconds
      vi.advanceTimersByTime(5000);
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);
    });
  });

  describe('No memory leaks', () => {
    it('should not have orphaned timeouts after many cycles', () => {
      const containerRef = { current: null as any };
      const { container } = render(<NotifContainer ref={containerRef} />);

      for (let cycle = 0; cycle < 10; cycle++) {
        containerRef.current?.addNotification('messageReceived', { name: 'John' });
        vi.advanceTimersByTime(5000);
      }

      // Should still work correctly - last notification should be gone
      expect(container.querySelectorAll('.bg-pink-50')).toHaveLength(0);

      // No warnings or errors should occur
      expect(() => {
        vi.advanceTimersByTime(10000);
      }).not.toThrow();
    });
  });
});
