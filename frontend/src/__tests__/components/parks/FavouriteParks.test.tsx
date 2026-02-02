import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FavoriteParks from '../../../components/parks/FavouriteParks';
import type { Park } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const mockUseAuth = vi.fn();
const mockUseFetch = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../hooks/useFetch', () => ({
  useFetch: (endpoint: string, options?: any) => mockUseFetch(endpoint, options),
}));

const mockFavoriteParks: Park[] = [
  {
    id: 1,
    name: 'My Favorite Park',
    description: 'Best park ever',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Park Ave',
    profilePictureUrl: null,
    amenities: ['WATER_FOUNTAIN'],
    separateSmallDogArea: true,
  },
];

const renderFavoriteParks = () => {
  return render(
    <BrowserRouter>
      <FavoriteParks />
    </BrowserRouter>
  );
};

describe('FavoriteParks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseFetch.mockReturnValue({ data: null, loading: false });

    const { container } = renderFavoriteParks();
    expect(container.firstChild).toBeNull();
  });

  it('shows heading when user is logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, username: 'testuser' } });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderFavoriteParks();
    expect(screen.getByText('Favorite Parks')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, username: 'testuser' } });
    mockUseFetch.mockReturnValue({ data: null, loading: true });

    renderFavoriteParks();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no favorites', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, username: 'testuser' } });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderFavoriteParks();
    expect(screen.getByText('No favorite parks yet.')).toBeInTheDocument();
  });

  it('renders favorite parks', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, username: 'testuser' } });
    mockUseFetch.mockReturnValue({ data: mockFavoriteParks, loading: false });

    renderFavoriteParks();
    expect(screen.getByText('My Favorite Park')).toBeInTheDocument();
  });

  it('fetches favorites with correct user ID', () => {
    mockUseAuth.mockReturnValue({ user: { id: 42, username: 'testuser' } });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderFavoriteParks();
    expect(mockUseFetch).toHaveBeenCalledWith(
      '/api/parks/favorites/42',
      expect.objectContaining({ skip: false })
    );
  });

  it('skips fetch when no user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseFetch.mockReturnValue({ data: null, loading: false });

    renderFavoriteParks();
    expect(mockUseFetch).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ skip: true })
    );
  });
});
