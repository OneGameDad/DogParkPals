import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DogProfile from '../../pages/DogProfile';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
        },
    }),
}));

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams(),
    };
});

// Mock useFetch hook
const mockUseFetch = vi.fn();
vi.mock('../../hooks/useFetch', () => ({
    useFetch: (...args: any[]) => mockUseFetch(...args),
}));

// Mock useDogFriends hook
vi.mock('../../hooks/users/useDogFriends', () => ({
    useDogFriends: () => ({
        friends: [],
        loading: false,
    }),
}));

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 1 },
    }),
}));

describe('DogProfile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        mockUseParams.mockReturnValue({ id: '1' });

        // Default behavior: return mockDog for the first call (dog profile), 
        // and an empty array for the second call (user dogs)
        mockUseFetch.mockImplementation((url) => {
            if (url && url.includes('/api/dogs/owner/')) {
                return { data: [], loading: false };
            }
            if (url && url.includes('/api/dogs/')) {
                return { data: mockDog, loading: false };
            }
            return { data: null, loading: false };
        });
    });

    const renderDogProfile = () => {
        return render(
            <BrowserRouter>
                <DogProfile />
            </BrowserRouter>
        );
    };

    const mockDog = {
        id: 1,
        name: 'Buddy',
        breed: 'Golden Retriever',
        gender: 'MALE',
        size: 'LARGE',
        playstyle: 'ENERGETIC',
        fixed: true,
        dateOfBirth: '2020-01-01T00:00:00.000Z',
        description: 'A good boy',
        profilePictureUrl: 'https://example.com/dog1.jpg',
    };

    it('should show loading state while fetching dog data', () => {
        // Reset and specific mock for this test
        mockUseFetch.mockReturnValue({ data: null, loading: true });

        renderDogProfile();

        expect(screen.getByText('dogProfile.loading')).toBeInTheDocument();
    });

    it('should show error message when dog is not found', () => {
        mockUseFetch.mockReturnValue({ data: null, loading: false, error: 'Error' });

        renderDogProfile();

        expect(screen.getByText('dogProfile.failedToLoad')).toBeInTheDocument();
    });

    it('should render dog profile information', async () => {
        // Mocks set in beforeEach are sufficient for this one
        renderDogProfile();

        expect(await screen.findByText('Buddy')).toBeInTheDocument();
        expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
        expect(screen.getByText('MALE')).toBeInTheDocument();
        expect(screen.getByText('LARGE')).toBeInTheDocument();
        expect(screen.getByText('ENERGETIC')).toBeInTheDocument();
        expect(screen.getByText('dogProfile.yes')).toBeInTheDocument(); // fixed: true
        expect(screen.getByText('A good boy')).toBeInTheDocument();
    });

    it('should navigate to edit page when Edit Profile button is clicked', async () => {
        // We need to make sure isOwner is true for the button to show up
        mockUseFetch.mockImplementation((url) => {
            if (url && url.includes('/api/dogs/owner/')) {
                return { data: [mockDog], loading: false }; // User owns this dog
            }
            if (url && url.includes('/api/dogs/')) {
                return { data: mockDog, loading: false };
            }
            return { data: null, loading: false };
        });

        renderDogProfile();

        const editButton = await screen.findByText('dogProfile.editProfile');
        fireEvent.click(editButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dog/1/edit');
    });

    it('should display "No" for fixed status if false', async () => {
        const dogNotFixed = { ...mockDog, fixed: false };
        mockUseFetch.mockImplementation((url) => {
            if (url && url.includes('/api/dogs/owner/')) {
                return { data: [], loading: false };
            }
            if (url && url.includes('/api/dogs/')) {
                return { data: dogNotFixed, loading: false };
            }
            return { data: null, loading: false };
        });

        renderDogProfile();

        expect(await screen.findByText('dogProfile.no')).toBeInTheDocument();
    });
});
