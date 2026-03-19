import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUsers from '../../../components/admin/AdminUsers';
import type { User } from '../../../types';

const mockGet = vi.fn();

vi.mock('../../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AdminUsers', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('does not render deleted_user sentinel in admin users list', async () => {
    const users = [
      {
        id: 1,
        username: 'deleted_user',
        email: 'deleted_user@dogparkpals.local',
        role: 'CLIENT',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        username: 'realuser',
        email: 'realuser@example.com',
        role: 'CLIENT',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ] as Partial<User>[];

    mockGet.mockResolvedValue(users);

    render(<AdminUsers />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/users'));

    expect(await screen.findByText('realuser')).toBeTruthy();
    expect(screen.queryByText('deleted_user')).toBeNull();
  });
});
