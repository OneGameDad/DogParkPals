import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditDogProfile from '../../pages/EditDogProfile';
import { api } from '../../services/api';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
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

// Mock useSubmit hook
// We'll make it simple: just call the submit function passed to it
vi.mock('../../hooks/useSubmit', () => ({
    useSubmit: ({ onSuccess }: any) => ({
        submit: async (fn: any) => {
            try {
                const result = await fn();
                onSuccess(result);
            } catch (e) {
                // ignore
            }
        },
        isSubmitting: false,
    }),
}));

// Mock API
vi.mock('../../services/api', () => ({
    api: {
        post: vi.fn(),
        put: vi.fn(),
    },
}));

describe('EditDogProfile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        mockUseParams.mockReturnValue({ id: undefined }); // Default to add mode
    });

    const renderEditDogProfile = () => {
        return render(
            <MemoryRouter>
                <EditDogProfile />
            </MemoryRouter>
        );
    };

    const mockDog = {
        id: 1,
        name: 'Buddy',
        breed: 'GOLDEN_RETRIEVER',
        gender: 'MALE',
        size: 'LARGE',
        playstyle: 'ENERGETIC',
        fixed: true,
        dateOfBirth: '2020-01-01T00:00:00.000Z',
        description: 'A good boy',
        profilePictureUrl: 'https://example.com/dog1.jpg',
    };

    it('should render Add Dog form in creation mode', () => {
        mockUseParams.mockReturnValue({ id: undefined });
        mockUseFetch.mockReturnValue({ data: null, loading: false });

        renderEditDogProfile();

        expect(screen.getByText('dogProfile.addTitle')).toBeInTheDocument();
        expect(screen.getByText('dogProfile.createDog')).toBeInTheDocument();
    });

    it('should call api.post when creating a new dog', async () => {
        mockUseParams.mockReturnValue({ id: undefined });
        mockUseFetch.mockReturnValue({ data: null, loading: false });
        (api.post as any).mockResolvedValue({ id: 123, name: 'New Dog' });

        const { container } = renderEditDogProfile();

        // Fill form - profile picture is now a file upload, not a URL text input
        const textInputs = document.querySelectorAll('input[type="text"]');
        const nameInput = textInputs[0] as HTMLInputElement; // First text input is name
        const selects = screen.getAllByRole('combobox');
        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

        fireEvent.change(nameInput, { target: { value: 'New Dog' } });
        fireEvent.change(selects[0], { target: { value: 'GERMAN_SHEPHERD_DOG' } }); // breed
        fireEvent.change(selects[1], { target: { value: 'FEMALE' } }); // gender
        fireEvent.change(selects[2], { target: { value: 'SMALL' } }); // size
        fireEvent.change(selects[3], { target: { value: 'SOCIAL' } }); // playstyle
        fireEvent.change(dateInput, { target: { value: '2023-01-01' } }); // birthdate

        // Submit via form to be safer
        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);
        else fireEvent.click(screen.getByText('dogProfile.createDog'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/dogs', expect.objectContaining({
                name: 'New Dog',
                breed: 'GERMAN_SHEPHERD_DOG',
                gender: 'FEMALE',
                size: 'SMALL',
                playstyle: 'SOCIAL',
                dateOfBirth: expect.stringContaining('2023-01-01'), // ISO conversion happens
            }));
        });
    });

    it('should render Edit Dog form in edit mode', () => {
        mockUseParams.mockReturnValue({ id: '1' }); // Edit mode
        mockUseFetch.mockReturnValue({ data: mockDog, loading: false });

        renderEditDogProfile();

        expect(screen.getByText('dogProfile.editTitle')).toBeInTheDocument();
        expect(screen.getByText('dogProfile.saveChanges')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Buddy')).toBeInTheDocument();
    });

    it('should call api.put when updating a dog', async () => {
        mockUseParams.mockReturnValue({ id: '1' });
        mockUseFetch.mockReturnValue({ data: mockDog, loading: false });
        (api.put as any).mockResolvedValue({ id: 1, name: 'Buddy Updated' });

        const { container } = renderEditDogProfile();

        // Change name
        fireEvent.change(screen.getByDisplayValue('Buddy'), { target: { value: 'Buddy Updated' } });

        // Submit
        const form = container.querySelector('form');
        if (form) fireEvent.submit(form);
        else fireEvent.click(screen.getByText('dogProfile.saveChanges'));

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/api/dogs/1', expect.objectContaining({
                name: 'Buddy Updated',
            }));
        });
    });

    it('should cancel and navigate back', () => {
        mockUseParams.mockReturnValue({ id: '1' });
        mockUseFetch.mockReturnValue({ data: mockDog, loading: false });

        renderEditDogProfile();

        const cancelButtons = screen.getAllByText('dogProfile.cancel');
        fireEvent.click(cancelButtons[0]); // Click the first cancel button (in header)

        expect(mockNavigate).toHaveBeenCalledWith('/dog/1');
    });
});

