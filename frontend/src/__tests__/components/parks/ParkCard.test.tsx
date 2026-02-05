import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ParkCard from '../../../components/parks/ParkCard';
import type { Park } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const mockPark: Park = {
  id: 1,
  name: 'Central Dog Park',
  description: 'A beautiful park for dogs',
  latitude: 40.7128,
  longitude: -74.0060,
  address: '123 Park Ave',
  profilePictureUrl: 'https://example.com/park.jpg',
  amenities: ['WATER_FOUNTAIN', 'SHADE', 'BENCHES'],
  separateSmallDogArea: true,
};

const renderParkCard = (park: Park) => {
  return render(
    <BrowserRouter>
      <ParkCard park={park} />
    </BrowserRouter>
  );
};

describe('ParkCard', () => {
  it('renders park name', () => {
    renderParkCard(mockPark);
    expect(screen.getByText('Central Dog Park')).toBeInTheDocument();
  });

  it('renders park description', () => {
    renderParkCard(mockPark);
    expect(screen.getByText('A beautiful park for dogs')).toBeInTheDocument();
  });

  it('renders default description when none provided', () => {
    const parkNoDesc = { ...mockPark, description: null };
    renderParkCard(parkNoDesc);
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('renders up to 3 amenity badges', () => {
    renderParkCard(mockPark);
    expect(screen.getByText('Water Fountain')).toBeInTheDocument();
    expect(screen.getByText('Shade')).toBeInTheDocument();
    expect(screen.getByText('Benches')).toBeInTheDocument();
  });

  it('shows +N badge when more than 3 amenities', () => {
    const parkManyAmenities = {
      ...mockPark,
      amenities: ['WATER_FOUNTAIN', 'SHADE', 'BENCHES', 'WASTE_BAGS', 'OBSTACLES'],
    };
    renderParkCard(parkManyAmenities);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('links to park details page', () => {
    renderParkCard(mockPark);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/parks/1');
  });

  it('renders park image', () => {
    renderParkCard(mockPark);
    const image = screen.getByAltText('Central Dog Park');
    expect(image).toHaveAttribute('src', 'https://example.com/park.jpg');
  });

  it('uses default image when no profile picture', () => {
    const parkNoImage = { ...mockPark, profilePictureUrl: null };
    renderParkCard(parkNoImage);
    const image = screen.getByAltText('Central Dog Park');
    expect(image).toHaveAttribute('src', '/imgs/background.png');
  });
});
