import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParkAmenities from '../../../components/parks/ParkAmenities';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('ParkAmenities', () => {
  it('renders amenities heading', () => {
    render(<ParkAmenities amenities={['WATER_FOUNTAIN']} />);
    expect(screen.getByText('Amenities')).toBeInTheDocument();
  });

  it('renders formatted amenity names', () => {
    render(<ParkAmenities amenities={['WATER_FOUNTAIN', 'WASTE_BAGS', 'AGILITY_EQUIPMENT']} />);
    expect(screen.getByText('Water Fountain')).toBeInTheDocument();
    expect(screen.getByText('Waste Bags')).toBeInTheDocument();
    expect(screen.getByText('Agility Equipment')).toBeInTheDocument();
  });

  it('shows message when no amenities', () => {
    render(<ParkAmenities amenities={[]} />);
    expect(screen.getByText('No specific amenities listed.')).toBeInTheDocument();
  });

  it('shows message when amenities is undefined', () => {
    render(<ParkAmenities />);
    expect(screen.getByText('No specific amenities listed.')).toBeInTheDocument();
  });

  it('renders all provided amenities', () => {
    const amenities = ['SHADE', 'BENCHES', 'OBSTACLES', 'PARKING', 'LIGHTING'];
    render(<ParkAmenities amenities={amenities} />);
    
    amenities.forEach(amenity => {
      const formatted = amenity.split('_').map(word => 
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ');
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });
  });
});
