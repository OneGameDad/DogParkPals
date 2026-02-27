import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Social from '../../pages/Social';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/users/useFriends';
import { useEnemies } from '../../hooks/users/useEnemies';

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/users/useFriends');
vi.mock('../../hooks/users/useEnemies');

// Mock child components to simplify testing
vi.mock('../../components/users', () => ({
    FriendFinder: () => <div data-testid="friend-finder">Friend Finder Component</div>,
    FriendRequestList: () => <div data-testid="friend-request-list">Friend Request List Component</div>,
    DogFinder: () => <div data-testid="dog-finder">Dog Finder Component</div>
}));

describe('Social Page', () => {
    const mockUser = { id: 1, username: 'testuser' };

    beforeEach(() => {
        vi.clearAllMocks();

        (useAuth as any).mockReturnValue({
            user: mockUser,
            loading: false,
        });

        (useFriends as any).mockReturnValue({
            friends: [],
            loading: false,
            error: null,
            removeFriend: vi.fn(),
        });

        (useEnemies as any).mockReturnValue({
            enemies: [],
            loading: false,
            error: null,
            removeEnemy: vi.fn(),
        });
    });

    it('renders social page title', () => {
        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );
        expect(screen.getByText('Social')).toBeInTheDocument();
    });

    it('renders FriendFinder component', () => {
        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );
        expect(screen.getByTestId('friend-finder')).toBeInTheDocument();
    });

    it('renders DogFinder component when dogs tab is active', () => {
        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );

        // Find the button and click it, bypassing strict text matching by using regex
        const dogsTab = screen.getByText(/social\.dogs/i);
        fireEvent.click(dogsTab);

        expect(screen.getByTestId('dog-finder')).toBeInTheDocument();
    });
});
