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
    useFetch: () => mockUseFetch(),
}));

describe('DogProfile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        mockUseParams.mockReturnValue({ id: '1' });
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
        mockUseFetch.mockReturnValue({ data: null, loading: true });

        renderDogProfile();

        expect(screen.getByText('dogProfile.loading')).toBeInTheDocument();
    });

    it('should show error message when dog is not found', () => {
        mockUseFetch.mockReturnValue({ data: null, loading: false, error: 'Error' });

        renderDogProfile();

        expect(screen.getByText('dogProfile.failedToLoad')).toBeInTheDocument();
    });

    it('should render dog profile information', () => {
        mockUseFetch.mockReturnValue({ data: mockDog, loading: false });

        renderDogProfile();

        expect(screen.getByText('Buddy')).toBeInTheDocument();
        expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
        expect(screen.getByText('MALE')).toBeInTheDocument();
        expect(screen.getByText('LARGE')).toBeInTheDocument();
        expect(screen.getByText('ENERGETIC')).toBeInTheDocument();
        expect(screen.getByText('dogProfile.yes')).toBeInTheDocument(); // fixed: true
        expect(screen.getByText('A good boy')).toBeInTheDocument();
    });

    it('should navigate to edit page when Edit Profile button is clicked', () => {
        mockUseFetch.mockReturnValue({ data: mockDog, loading: false });

        renderDogProfile();

        const editButton = screen.getByText('dogProfile.editProfile');
        fireEvent.click(editButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dog/1/edit');
    });

    it('should display "No" for fixed status if false', () => {
        const dogNotFixed = { ...mockDog, fixed: false };
        mockUseFetch.mockReturnValue({ data: dogNotFixed, loading: false });

        renderDogProfile();

        expect(screen.getByText('dogProfile.no')).toBeInTheDocument();
    });
});
