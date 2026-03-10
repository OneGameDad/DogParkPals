import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DogFinder from '../../../components/users/DogFinder';
import { useDogSearch } from '../../../hooks/users/useDogSearch';
import { DogBreed, DogGender, DogSize, DogPlaystyle } from '../../../types';
import type { Dog } from '../../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock useDogSearch hook
vi.mock('../../../hooks/users/useDogSearch', () => ({
    useDogSearch: vi.fn(),
}));

// Mock child components
vi.mock('../../../components/users/DogList', () => ({
    default: ({ dogs, onDogClick, emptyMessage }: any) => (
        <div data-testid="dog-list">
            {dogs?.map((dog: any) => (
                <button key={dog.id} onClick={() => onDogClick(dog)}>
                    {dog.name}
                </button>
            ))}
            {(!dogs || dogs.length === 0) && <div>{emptyMessage}</div>}
        </div>
    ),
}));

vi.mock('../../../components/users/DogProfileModal', () => ({
    default: ({ dog, onClose }: any) => (
        dog ? (
            <div data-testid="dog-profile-modal">
                {dog.name}
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    ),
}));

describe('DogFinder Component', () => {
    const mockDogs: Dog[] = [
        {
            id: 1,
            name: 'Buddy',
            breed: DogBreed.GERMAN_SHEPHERD_DOG,
            gender: DogGender.MALE,
            size: DogSize.LARGE,
            playstyle: DogPlaystyle.ENERGETIC,
            dateOfBirth: '2020-01-01',
            fixed: true,
            description: 'A good boy',
            profilePictureUrl: 'https://example.com/dog1.jpg',
        },
    ];

    const mockSetSearchQuery = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDogSearch as any).mockReturnValue({
            searchQuery: '',
            setSearchQuery: mockSetSearchQuery,
            dogs: mockDogs,
            loading: false,
            error: null,
        });
    });

    const renderDogFinder = () => {
        return render(
            <MemoryRouter>
                <DogFinder />
            </MemoryRouter>
        );
    };

    it('should render search input and dog list', () => {
        renderDogFinder();

        expect(screen.getByPlaceholderText('dogProfile.searchPlaceholder')).toBeInTheDocument();
        expect(screen.getByTestId('dog-list')).toBeInTheDocument();
        expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('should update search query on input change', () => {
        renderDogFinder();

        const input = screen.getByPlaceholderText('dogProfile.searchPlaceholder');
        fireEvent.change(input, { target: { value: 'Golden' } });

        expect(mockSetSearchQuery).toHaveBeenCalledWith('Golden');
    });

    it('should show loading state', () => {
        (useDogSearch as any).mockReturnValue({
            searchQuery: '',
            setSearchQuery: mockSetSearchQuery,
            dogs: null,
            loading: true,
            error: null,
        });

        renderDogFinder();
        expect(screen.getByText('common.loading')).toBeInTheDocument();
    });

    it('should show error state', () => {
        (useDogSearch as any).mockReturnValue({
            searchQuery: '',
            setSearchQuery: mockSetSearchQuery,
            dogs: null,
            loading: false,
            error: 'Error fetching dogs',
        });

        renderDogFinder();
        expect(screen.getByText('common.error')).toBeInTheDocument();
    });

    it('should open modal when a dog is clicked', () => {
        renderDogFinder();

        fireEvent.click(screen.getByText('Buddy'));
        expect(screen.getByTestId('dog-profile-modal')).toHaveTextContent('Buddy');
    });

    it('should close modal when close button is clicked', () => {
        renderDogFinder();

        // Open modal
        fireEvent.click(screen.getByText('Buddy'));
        expect(screen.getByTestId('dog-profile-modal')).toBeInTheDocument();

        // Close modal
        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('dog-profile-modal')).not.toBeInTheDocument();
    });
});
