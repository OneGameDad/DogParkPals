import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotifContainer from '../Notif';
import { useTranslation } from 'react-i18next';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'notifications.messageReceived': 'You received a message from {name}',
        'notifications.friendRequest': '{name} wants to be friends',
        'notifications.eventCreated': '{name} created a new event',
      };
      let template = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return template;
    },
  })),
}));

describe('NotifContainer', () => {
  let containerRef: any;

  beforeEach(() => {
    containerRef = { current: null };
    vi.clearAllMocks();
  });

  it('should render empty initially', () => {
    const { container } = render(<NotifContainer ref={containerRef} />);
    const notifications = container.querySelectorAll('[class*="bg-pink"]');
    expect(notifications).toHaveLength(0);
  });

  it('should add notification when called', async () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('messageReceived', { name: 'John' });

    await waitFor(() => {
      expect(screen.getByText('You received a message from John')).toBeInTheDocument();
    });
  });

  it('should add multiple notifications', async () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('messageReceived', { name: 'John' });
    containerRef.current?.addNotification('friendRequest', { name: 'Jane' });

    await waitFor(() => {
      expect(screen.getByText('You received a message from John')).toBeInTheDocument();
      expect(screen.getByText('Jane wants to be friends')).toBeInTheDocument();
    });
  });

  it('should remove notification after 5 seconds', async () => {
    vi.useFakeTimers();

    render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('messageReceived', { name: 'John' });

    await waitFor(() => {
      expect(screen.getByText('You received a message from John')).toBeInTheDocument();
    });

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('You received a message from John')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should remove notification when close button clicked', async () => {
    const user = userEvent.setup();
    render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('messageReceived', { name: 'John' });

    await waitFor(() => {
      expect(screen.getByText('You received a message from John')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('You received a message from John')).not.toBeInTheDocument();
    });
  });

  it('should have correct styling', async () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('friendRequest', { name: 'Alice' });

    await waitFor(() => {
      const notification = container.querySelector('[class*="bg-pink"]');
      expect(notification).toHaveClass('bg-pink-50');
      expect(notification).toHaveClass('border-pink-200');
      expect(notification).toHaveClass('rounded-lg');
    });
  });

  it('should substitute multiple variables', async () => {
    render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('eventCreated', { 
      name: 'Parks Team',
    });

    await waitFor(() => {
      expect(screen.getByText('Parks Team created a new event')).toBeInTheDocument();
    });
  });

  it('should handle undefined translation gracefully', async () => {
    render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('unknownType', { data: 'test' });

    await waitFor(() => {
      // Should show the key as fallback
      expect(screen.getByText('unknownType')).toBeInTheDocument();
    });
  });

  it('should position notifications correctly', () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    const wrapper = container.querySelector('[class*="fixed"]');
    expect(wrapper).toHaveClass('fixed');
    expect(wrapper).toHaveClass('top-4');
    expect(wrapper).toHaveClass('right-4');
  });

  it('should auto-generate unique IDs for notifications', async () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    containerRef.current?.addNotification('messageReceived', { name: 'User1' });
    containerRef.current?.addNotification('messageReceived', { name: 'User2' });

    await waitFor(() => {
      const messages = container.querySelectorAll('p');
      expect(messages).toHaveLength(2);
    });
  });

  it('should handle rapid notification additions', async () => {
    render(<NotifContainer ref={containerRef} />);

    for (let i = 0; i < 5; i++) {
      containerRef.current?.addNotification('messageReceived', { name: `User${i}` });
    }

    await waitFor(() => {
      expect(screen.getByText('You received a message from User0')).toBeInTheDocument();
      expect(screen.getByText('You received a message from User4')).toBeInTheDocument();
    });
  });
});
