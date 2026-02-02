import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckInList from '../../../components/parks/CheckInList';
import type { CheckIn } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const mockCheckIns: CheckIn[] = [
  {
    id: 1,
    userId: 1,
    dogId: 1,
    parkId: 1,
    checkedInAt: '2026-02-02T10:00:00Z',
    checkedOutAt: null,
    user: {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      password_hash: '',
      first_name: 'John',
      last_name: 'Doe',
      profilePictureUrl: 'https://example.com/john.jpg',
      latitude: null,
      longitude: null,
      role: 'CLIENT' as const,
      resetToken: null,
      resetTokenExpiry: null,
    },
    dog: {
      id: 1,
      name: 'Buddy',
      breed: 'GOLDEN_RETRIEVER',
      dateOfBirth: '2020-01-01',
      description: 'Friendly dog',
      gender: 'MALE' as const,
      size: 'LARGE' as const,
      playstyle: 'ENERGETIC' as const,
      fixed: true,
      profilePictureUrl: null,
      vaccinationRecordUrl: null,
    },
  },
  {
    id: 2,
    userId: 2,
    dogId: null,
    parkId: 1,
    checkedInAt: '2026-02-02T10:30:00Z',
    checkedOutAt: null,
    user: {
      id: 2,
      username: 'jane_smith',
      email: 'jane@example.com',
      password_hash: '',
      first_name: 'Jane',
      last_name: 'Smith',
      profilePictureUrl: null,
      latitude: null,
      longitude: null,
      role: 'CLIENT' as const,
      resetToken: null,
      resetTokenExpiry: null,
    },
    dog: null,
  },
];

describe('CheckInList', () => {
  it('renders heading', () => {
    render(<CheckInList checkIns={[]} />);
    expect(screen.getByText("Who's here?")).toBeInTheDocument();
  });

  it('shows count of checked in users', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    expect(screen.getByText('2 visiting now')).toBeInTheDocument();
  });

  it('renders user information', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    expect(screen.getByText('john_doe')).toBeInTheDocument();
    expect(screen.getByText('jane_smith')).toBeInTheDocument();
  });

  it('shows dog name when present', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    expect(screen.getByText('with Buddy')).toBeInTheDocument();
  });

  it('shows "visiting" when no dog', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    expect(screen.getByText('visiting')).toBeInTheDocument();
  });

  it('shows empty state when no check-ins', () => {
    render(<CheckInList checkIns={[]} />);
    expect(screen.getByText('No one checked in right now. Be the first!')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    render(<CheckInList checkIns={[]} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays profile picture when available', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    const image = screen.getByAltText('john_doe');
    expect(image).toHaveAttribute('src', 'https://example.com/john.jpg');
  });

  it('displays initials when no profile picture', () => {
    render(<CheckInList checkIns={mockCheckIns} />);
    expect(screen.getByText('JA')).toBeInTheDocument(); // jane_smith initials
  });

  it('handles unknown user gracefully', () => {
    const unknownUserCheckIn: CheckIn = {
      id: 3,
      userId: 3,
      dogId: null,
      parkId: 1,
      checkedInAt: '2026-02-02T11:00:00Z',
      checkedOutAt: null,
      user: undefined as any,
      dog: null,
    };
    render(<CheckInList checkIns={[unknownUserCheckIn]} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
