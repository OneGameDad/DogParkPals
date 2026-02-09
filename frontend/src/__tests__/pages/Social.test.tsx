import { render, screen, waitFor } from '@testing-library/react';
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
    RelationshipManager: ({ title, users, type, onRemove }: any) => (
        <div data-testid={`relationship-manager-${type}`}>
            <h2>{title}</h2>
            <ul>
                {users?.map((u: any) => (
                    <li key={u.id}>
                        {u.username}
                        <button onClick={() => onRemove(u.id, type === 'friend' ? u.id : u.id)}>Remove</button>
                    </li>
                ))}
            </ul>
        </div>
    ),
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

    it('renders RelationshipManager for friends and enemies', () => {
        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );
        expect(screen.getByTestId('relationship-manager-friend')).toBeInTheDocument();
        expect(screen.getByTestId('relationship-manager-enemy')).toBeInTheDocument();
    });

    it('passes friends data to RelationshipManager', () => {
        const mockFriends = [{ id: 2, username: 'friend1' }];
        (useFriends as any).mockReturnValue({
            friends: mockFriends,
            loading: false,
            error: null,
            removeFriend: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );

        expect(screen.getByText('friend1')).toBeInTheDocument();
    });

    it('passes enemies data to RelationshipManager', () => {
        const mockEnemies = [{ id: 3, username: 'enemy1' }];
        (useEnemies as any).mockReturnValue({
            enemies: mockEnemies,
            loading: false,
            error: null,
            removeEnemy: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );

        expect(screen.getByText('enemy1')).toBeInTheDocument();
    });

    it('calls removeFriend when remove button is clicked', async () => {
        const mockRemoveFriend = vi.fn();
        const mockFriends = [{ id: 2, username: 'friend1' }];
        (useFriends as any).mockReturnValue({
            friends: mockFriends,
            loading: false,
            error: null,
            removeFriend: mockRemoveFriend,
        });

        render(
            <MemoryRouter>
                <Social />
            </MemoryRouter>
        );

        const removeButton = screen.getByText('Remove');
        removeButton.click();

        expect(mockRemoveFriend).toHaveBeenCalledWith(2, 2);
    });
});
