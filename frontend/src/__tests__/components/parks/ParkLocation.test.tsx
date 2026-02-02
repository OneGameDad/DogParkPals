import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParkLocationMap from '../../../components/parks/ParkLocation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('ParkLocationMap', () => {
  const defaultProps = {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Central Park West, New York, NY',
  };

  it('renders location heading', () => {
    render(<ParkLocationMap {...defaultProps} />);
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders address', () => {
    render(<ParkLocationMap {...defaultProps} />);
    expect(screen.getByText('123 Central Park West, New York, NY')).toBeInTheDocument();
  });

  it('renders map image with correct coordinates', () => {
    render(<ParkLocationMap {...defaultProps} />);
    const mapImage = screen.getByAltText('Map location');
    expect(mapImage).toHaveAttribute('src', expect.stringContaining('-74.006,40.7128'));
  });

  it('links to Google Maps with correct coordinates', () => {
    render(<ParkLocationMap {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('40.7128,-74.006'));
  });

  it('shows directions text on hover', () => {
    render(<ParkLocationMap {...defaultProps} />);
    expect(screen.getByText(/Get Directions/)).toBeInTheDocument();
  });
});
