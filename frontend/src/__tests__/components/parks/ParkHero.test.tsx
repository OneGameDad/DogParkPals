import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParkHero from '../../../components/parks/ParkHero';

describe('ParkHero', () => {
  it('renders park name', () => {
    render(<ParkHero name="Sunny Dog Park" />);
    expect(screen.getByText('Sunny Dog Park')).toBeInTheDocument();
  });

  it('has proper heading hierarchy', () => {
    render(<ParkHero name="My Park" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('My Park');
  });
});
