import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FriendFinder from '../../../components/users/FriendFinder';

// Mock Hooks
const mockUseAuth = vi.fn();
const mockUseUserSearch = vi.fn();
const mockUseFriendActions = vi.fn();
const mockUseFriends = vi.fn();
const mockUseEnemies = vi.fn();

vi.mock('../../../hooks', () => ({
    useAuth: () => mockUseAuth(),
    useUserSearch: () => mockUseUserSearch(),
    useFriendActions: () => mockUseFriendActions(),
    useFriends: () => mockUseFriends(),
    useEnemies: () => mockUseEnemies()
}));

// Mock Child Components
vi.mock('../../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    ErrorMessage: () => <div>Error</div>,
    InputText: ({ value, onChange }: any) => (
        <input data-testid="search-input" value={value} onChange={e => onChange(e.target.value)} />
    )
}));

vi.mock('../../../components/users/UserList', () => ({
    default: ({ users, onUserClick }: any) => (
        <div data-testid="user-list">
            {users.map((u: any) => (
                <button key={u.id} onClick={() => onUserClick(u)} data-testid={`user-${u.id}`}>
                    {u.username}
                </button>
            ))}
        </div>
    )
}));

vi.mock('../../../components/users/UserProfileModal', () => ({
    default: ({ user, onAddFriend, onAddEnemy }: any) => (
        user ? (
            <div data-testid="user-modal">
                <span>{user.username}</span>
                {onAddFriend && <button onClick={() => onAddFriend(user.id)}>Add Friend</button>}
                {onAddEnemy && <button onClick={() => onAddEnemy(user.id)}>Add Enemy</button>}
            </div>
        ) : null
    )
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}));

describe('FriendFinder', () => {
    const mockAddFriend = vi.fn();
    const mockAddEnemy = vi.fn();
    const mockClearError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({ user: { id: 1 } });

        mockUseUserSearch.mockReturnValue({
            searchQuery: '',
            setSearchQuery: vi.fn(),
            users: [{ id: 2, username: 'stranger' }],
            loading: false,
            error: null
        });

        mockUseFriendActions.mockReturnValue({
            addFriend: mockAddFriend,
            addEnemy: mockAddEnemy,
            isRequestSent: () => false,
            actionLoading: false,
            actionError: null,
            clearError: mockClearError
        });

        mockUseFriends.mockReturnValue({ friends: [], removeFriend: vi.fn() });
        mockUseEnemies.mockReturnValue({ enemies: [], removeEnemy: vi.fn() });
    });

    it('renders search input and user list', () => {
        render(<FriendFinder />);
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('user-list')).toBeInTheDocument();
        expect(screen.getByText('stranger')).toBeInTheDocument();
    });

    it('opens modal on user click', () => {
        render(<FriendFinder />);
        fireEvent.click(screen.getByTestId('user-2'));

        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
        expect(mockClearError).toHaveBeenCalled();
    });

    it('calls addFriend when action clicked in modal', () => {
        render(<FriendFinder />);
        fireEvent.click(screen.getByTestId('user-2'));

        fireEvent.click(screen.getByText('Add Friend'));
        expect(mockAddFriend).toHaveBeenCalledWith(2);
    });

    it('calls addEnemy when action clicked in modal', () => {
        render(<FriendFinder />);
        fireEvent.click(screen.getByTestId('user-2'));

        fireEvent.click(screen.getByText('Add Enemy'));
        expect(mockAddEnemy).toHaveBeenCalledWith(2);
    });

    it('hides Add Friend button if user is already a friend', () => {
        mockUseFriends.mockReturnValue({
            friends: [{ id: 2, username: 'stranger' }], // User 2 is already a friend
            removeFriend: vi.fn()
        });

        render(<FriendFinder />);
        fireEvent.click(screen.getByTestId('user-2'));

        expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
    });

    it('shows loading state when searching', () => {
        mockUseUserSearch.mockReturnValue({
            users: [],
            loading: true, // Loading with no results = full loader
            error: null
        });
        render(<FriendFinder />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});
