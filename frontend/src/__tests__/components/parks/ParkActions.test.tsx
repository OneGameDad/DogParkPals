import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParkActions from '../../../components/parks/ParkActions';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('ParkActions', () => {
  const mockCheckInToggle = vi.fn();
  const mockFavoriteToggle = vi.fn();

  const defaultProps = {
    isCheckedIn: false,
    isFavorite: false,
    onCheckInToggle: mockCheckInToggle,
    onFavoriteToggle: mockFavoriteToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check in button when not checked in', () => {
    render(<ParkActions {...defaultProps} />);
    expect(screen.getByText('Check In')).toBeInTheDocument();
  });

  it('renders check out button when checked in', () => {
    render(<ParkActions {...defaultProps} isCheckedIn={true} />);
    expect(screen.getByText('Check Out')).toBeInTheDocument();
  });

  it('calls onCheckInToggle when check in button clicked', () => {
    render(<ParkActions {...defaultProps} />);
    fireEvent.click(screen.getByText('Check In'));
    expect(mockCheckInToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onFavoriteToggle when favorite button clicked', () => {
    render(<ParkActions {...defaultProps} />);
    const favoriteButton = screen.getByTitle('Add to favorites');
    fireEvent.click(favoriteButton);
    expect(mockFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  it('shows filled heart icon when favorited', () => {
    render(<ParkActions {...defaultProps} isFavorite={true} />);
    const favoriteButton = screen.getByTitle('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ParkActions {...defaultProps} loading={true} />);
    const checkInButton = screen.getByText('Check In');
    const favoriteButton = screen.getByTitle('Add to favorites');
    
    expect(checkInButton).toBeDisabled();
    expect(favoriteButton).toBeDisabled();
  });

  it('renders helper text', () => {
    render(<ParkActions {...defaultProps} />);
    expect(screen.getByText('Let others know you and your dog are visiting!')).toBeInTheDocument();
  });
});
