import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DogList from '../../../components/users/DogList';
import { DogBreed, DogGender, DogSize, DogPlaystyle } from '../../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock DogCard to avoid testing its internal logic again
vi.mock('../../../components/users/DogCard', () => ({
    default: ({ dog, onClick }: any) => (
        <div data-testid={`dog-card-${dog.id}`} onClick={() => onClick?.(dog)}>
            {dog.name}
        </div>
    ),
}));

describe('DogList Component', () => {
    const mockDogs = [
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
            vaccinationRecordUrl: null,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
        },
        id: 2,
        name: 'Rex',
        breed: DogBreed.GERMAN_SHEPHERD_DOG,
        gender: DogGender.MALE,
        size: DogSize.LARGE,
        playstyle: DogPlaystyle.AGGRESSIVE,
        dateOfBirth: '2019-01-01',
        fixed: false,
        description: 'A protective boy',
        profilePictureUrl: 'https://example.com/dog2.jpg',
        vaccinationRecordUrl: null,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        },
    ];

it('should render a list of dogs', () => {
    render(<DogList dogs={mockDogs} />);

    expect(screen.getByTestId('dog-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('dog-card-2')).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Rex')).toBeInTheDocument();
});

it('should render empty message when no dogs provided', () => {
    render(<DogList dogs={[]} />);
    expect(screen.getByText('dogList.noDogs')).toBeInTheDocument();
});

it('should render custom empty message', () => {
    render(<DogList dogs={[]} emptyMessage="No dogs here!" />);
    expect(screen.getByText('No dogs here!')).toBeInTheDocument();
});

it('should propagate onDogClick to DogCard', () => {
    const handleDogClick = vi.fn();
    render(<DogList dogs={mockDogs} onDogClick={handleDogClick} />);

    fireEvent.click(screen.getByTestId('dog-card-1'));
    expect(handleDogClick).toHaveBeenCalledWith(mockDogs[0]);
});
});
