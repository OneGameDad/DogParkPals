import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DogCard from '../../../components/users/DogCard';
import type { Dog, DogBreed, DogGender, DogSize, DogPlaystyle } from '../../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('DogCard Component', () => {
    const mockDog: Dog = {
        id: 1,
        name: 'Buddy',
        breed: DogBreed.GERMAN_SHEPHERD_DOG,
        gender: DogGender.MALE,
        size: DogSize.LARGE,
        playstyle: DogPlaystyle.ENERGETIC,
        dateOfBirth: '2020-01-01',
        fixed: true,
        description: 'A good boy',
        profilePictureUrl: 'https://example.com/dog.jpg',
    };

    it('should render dog details correctly', () => {
        render(<DogCard dog={mockDog} />);

        expect(screen.getByText('Buddy')).toBeInTheDocument();
        expect(screen.getByText('GERMAN SHEPHERD DOG')).toBeInTheDocument();
        expect(screen.getByText('MALE')).toBeInTheDocument();
        expect(screen.getByText('LARGE')).toBeInTheDocument();
        const img = screen.getByAltText('Buddy') as HTMLImageElement;
        expect(img.src).toContain('https://example.com/dog.jpg');
    });

    it('should use default image if profilePictureUrl is missing', () => {
        const dogWithoutPic = { ...mockDog, profilePictureUrl: undefined };
        render(<DogCard dog={dogWithoutPic} />);

        const img = screen.getByAltText('Buddy') as HTMLImageElement;
        expect(img.src).toContain('/imgs/exampledogpic.jpg');
    });

    it('should call onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<DogCard dog={mockDog} onClick={handleClick} />);

        fireEvent.click(screen.getByText('Buddy'));
        expect(handleClick).toHaveBeenCalledWith(mockDog);
    });

    it('should not throw if onClick is undefined', () => {
        render(<DogCard dog={mockDog} />);
        fireEvent.click(screen.getByText('Buddy'));
        // Test passes if no error is thrown
    });
});
