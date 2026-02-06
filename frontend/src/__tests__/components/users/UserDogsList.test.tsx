import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserDogsList from '../../../components/users/UserDogsList';
import { useFetch } from '../../../hooks';

// Mock Hooks
vi.mock('../../../hooks', () => ({
    useFetch: vi.fn()
}));

// Mock Common
vi.mock('../../../components/common', () => ({
    Picture: ({ alt }: any) => <img alt={alt} />
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}));

describe('UserDogsList', () => {
    it('shows loading state', () => {
        (useFetch as any).mockReturnValue({ loading: true });
        render(<UserDogsList userId={1} />);
        expect(screen.getByText('profile.loading')).toBeInTheDocument();
    });

    it('shows empty message when no dogs found', () => {
        (useFetch as any).mockReturnValue({ loading: false, data: [] });
        render(<UserDogsList userId={1} />);
        expect(screen.getByText('profile.noDogs')).toBeInTheDocument();
    });

    it('renders list of dogs', () => {
        const mockDogs = [
            { id: 101, name: 'Rex', profilePictureUrl: 'rex.jpg' },
            { id: 102, name: 'Fido', profilePictureUrl: 'fido.jpg' }
        ];
        (useFetch as any).mockReturnValue({ loading: false, data: mockDogs });

        render(<UserDogsList userId={1} />);

        expect(screen.getByText('Rex')).toBeInTheDocument();
        expect(screen.getByText('Fido')).toBeInTheDocument();
        expect(screen.getByAltText('Rex')).toBeInTheDocument();
    });

    it('returns null on error', () => {
        (useFetch as any).mockReturnValue({ loading: false, error: new Error('Fail') });
        const { container } = render(<UserDogsList userId={1} />);
        expect(container).toBeEmptyDOMElement();
    });
});
