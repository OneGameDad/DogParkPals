import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParkExplorer from '../../../components/parks/ParkExplorer';
import type { Park } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const mockUseFetch = vi.fn();
vi.mock('../../../hooks/useFetch', () => ({
  useFetch: () => mockUseFetch(),
}));

const mockParks: Park[] = [
  {
    id: 1,
    name: 'Central Dog Park',
    description: 'Great park downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Park Ave',
    profilePictureUrl: null,
    amenities: ['WATER_FOUNTAIN'],
    separateSmallDogArea: true,
  },
  {
    id: 2,
    name: 'Westside Park',
    description: 'Spacious westside location',
    latitude: 40.7580,
    longitude: -73.9855,
    address: '456 West St',
    profilePictureUrl: null,
    amenities: ['SHADE', 'BENCHES'],
    separateSmallDogArea: false,
  },
];

const renderParkExplorer = () => {
  return render(
    <BrowserRouter>
      <ParkExplorer />
    </BrowserRouter>
  );
};

describe('ParkExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderParkExplorer();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to fetch',
    });

    renderParkExplorer();
    expect(screen.getByText('parks.error')).toBeInTheDocument();
  });

  it('renders parks when loaded', () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    expect(screen.getByText('Central Dog Park')).toBeInTheDocument();
    expect(screen.getByText('Westside Park')).toBeInTheDocument();
  });

  it('renders search bar', () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    expect(screen.getByPlaceholderText('Search parks...')).toBeInTheDocument();
  });

  it('filters parks by name', async () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    const searchInput = screen.getByPlaceholderText('Search parks...');
    
    fireEvent.change(searchInput, { target: { value: 'Central' } });

    await waitFor(() => {
      expect(screen.getByText('Central Dog Park')).toBeInTheDocument();
      expect(screen.queryByText('Westside Park')).not.toBeInTheDocument();
    });
  });

  it('filters parks by description', async () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    const searchInput = screen.getByPlaceholderText('Search parks...');
    
    fireEvent.change(searchInput, { target: { value: 'Spacious' } });

    await waitFor(() => {
      expect(screen.getByText('Westside Park')).toBeInTheDocument();
      expect(screen.queryByText('Central Dog Park')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search yields nothing', async () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    const searchInput = screen.getByPlaceholderText('Search parks...');
    
    fireEvent.change(searchInput, { target: { value: 'NonexistentPark' } });

    await waitFor(() => {
      expect(screen.getByText('No parks found matching your search.')).toBeInTheDocument();
    });
  });

  it('is case insensitive when searching', async () => {
    mockUseFetch.mockReturnValue({
      data: mockParks,
      loading: false,
      error: null,
    });

    renderParkExplorer();
    const searchInput = screen.getByPlaceholderText('Search parks...');
    
    fireEvent.change(searchInput, { target: { value: 'CENTRAL' } });

    await waitFor(() => {
      expect(screen.getByText('Central Dog Park')).toBeInTheDocument();
    });
  });
});
