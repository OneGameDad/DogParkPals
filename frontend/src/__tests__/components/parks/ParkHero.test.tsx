import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParkHero from '../../../components/parks/ParkHero';

describe('ParkHero', () => {
  it('renders park name', () => {
    render(<ParkHero name="Sunny Dog Park" />);
    expect(screen.getByText('Sunny Dog Park')).toBeInTheDocument();
  });

  it('renders custom image when provided', () => {
    render(<ParkHero name="Test Park" imageUrl="https://example.com/custom.jpg" />);
    const image = screen.getByAltText('Test Park');
    expect(image).toHaveAttribute('src', 'https://example.com/custom.jpg');
  });

  it('renders default image when no imageUrl provided', () => {
    render(<ParkHero name="Test Park" />);
    const image = screen.getByAltText('Test Park');
    expect(image).toHaveAttribute('src', '/imgs/background.png');
  });

  it('has proper heading hierarchy', () => {
    render(<ParkHero name="My Park" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('My Park');
  });
});
