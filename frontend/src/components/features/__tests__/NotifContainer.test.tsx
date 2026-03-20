import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import NotifContainer from '../Notif';
import { useTranslation } from 'react-i18next';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    i18n: {
      exists: () => true,
    },
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render empty initially', () => {
    const { container } = render(<NotifContainer ref={containerRef} />);
    const notifications = container.querySelectorAll('[class*="bg-pink"]');
    expect(notifications).toHaveLength(0);
  });

  it('should expose addNotification method via ref', () => {
    render(<NotifContainer ref={containerRef} />);
    expect(containerRef.current).toBeDefined();
    expect(typeof containerRef.current?.addNotification).toBe('function');
  });

  it('should have correct positioning classes', () => {
    const { container } = render(<NotifContainer ref={containerRef} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('fixed');
  });

  it('should support adding a notification via ref API', () => {
    render(<NotifContainer ref={containerRef} />);
    expect(() => {
      containerRef.current?.addNotification('messageReceived', { name: 'John' });
    }).not.toThrow();
  });

  it('should support adding multiple notifications', () => {
    render(<NotifContainer ref={containerRef} />);
    expect(() => {
      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      containerRef.current?.addNotification('friendRequest', { name: 'Jane' });
    }).not.toThrow();
  });

  it('should auto-dismiss all stacked notifications after timeout', () => {
    const { container } = render(<NotifContainer ref={containerRef} />);

    act(() => {
      containerRef.current?.addNotification('messageReceived', { name: 'John' });
      containerRef.current?.addNotification('friendRequest', { name: 'Jane' });
      containerRef.current?.addNotification('eventCreated', { name: 'Alex' });
    });

    expect(container.querySelectorAll('[class*="bg-pink"]').length).toBe(3);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(container.querySelectorAll('[class*="bg-pink"]').length).toBe(0);
  });
});
