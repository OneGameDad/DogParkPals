import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FriendFinder from '../../../components/users/FriendFinder';

// Mock Hooks
const mockUseAuth = vi.fn();
const mockUseEntitySearch = vi.fn();
const mockUseFetch = vi.fn();
const mockUseFriendActions = vi.fn();
const mockUseFriends = vi.fn();
const mockUseEnemies = vi.fn();

vi.mock('../../../hooks', () => ({
    useAuth: () => mockUseAuth(),
    useFriendActions: () => mockUseFriendActions(),
    useFriends: () => mockUseFriends(),
    useEnemies: () => mockUseEnemies(),
    useFetch: () => mockUseFetch(),
}));

vi.mock('../../../hooks/search/useEntitySearch', () => ({
    useEntitySearch: () => mockUseEntitySearch(),
}));

vi.mock('../../../hooks/search/usePagination', () => ({
    usePagination: (items: any[]) => ({ offset: 0, setOffset: vi.fn(), paginatedItems: items }),
}));

// Mock Child Components
vi.mock('../../../components/features', () => ({
    SearchBar: ({ onSearch }: any) => (
        <input data-testid="search-input" onChange={e => onSearch(e.target.value)} />
    )
}));

vi.mock('../../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    ErrorMessage: () => <div>Error</div>,
    Pagination: () => <div data-testid="pagination">Pagination</div>,
    FilterTabs: ({ tabs, onChange }: any) => (
        <div data-testid="filter-tabs">
            {tabs.map((t: any) => (
                <button key={t.id} onClick={() => onChange(t.id)}>{t.label}</button>
            ))}
        </div>
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
                <span data-testid="modal-username">{user.username}</span>
                {onAddFriend && <button onClick={() => onAddFriend(user.id)}>Add Friend</button>}
                {onAddEnemy && <button onClick={() => onAddEnemy(user.id)}>Add Enemy</button>}
            </div>
        ) : null
    )
}));

// Remove this second mock block since we added it to the main block
// vi.mock('../../../components/common/FilterTabs', () => ({
//     FilterTabs: ({ tabs, onChange }: any) => (
//         <div data-testid="filter-tabs">
//             {tabs.map((t: any) => (
//                 <button key={t.id} onClick={() => onChange(t.id)}>{t.label}</button>
//             ))}
//         </div>
//     )
// }));

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

        mockUseFetch.mockReturnValue({
            data: [{ id: 2, username: 'stranger' }],
            loading: false,
            error: null
        });

        mockUseEntitySearch.mockReturnValue({
            results: [],
            loading: false,
            error: null,
            isSearching: false
        });

        mockUseFriendActions.mockReturnValue({
            addFriend: mockAddFriend,
            addEnemy: mockAddEnemy,
            isRequestSent: () => false,
            actionLoading: false,
            actionError: null,
            clearError: mockClearError
        });

        mockUseFriends.mockReturnValue({ friends: [], removeFriend: vi.fn(), loading: false });
        mockUseEnemies.mockReturnValue({ enemies: [], removeEnemy: vi.fn(), loading: false });
    });

    it('renders search input and user list', () => {
        render(<FriendFinder />);
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('user-list')).toBeInTheDocument();
        // user array from mock data: { id: 2, username: 'stranger' }
        expect(screen.getByText('stranger')).toBeInTheDocument();
    });

    it('opens modal on user click', () => {
        render(<FriendFinder />);
        const userButton = screen.getByTestId('user-2');
        fireEvent.click(userButton);

        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
        expect(mockClearError).toHaveBeenCalled();
    });

    it('calls addFriend when action clicked in modal', () => {
        render(<FriendFinder />);
        const userButton = screen.getByTestId('user-2');
        fireEvent.click(userButton);

        const addFriendButton = screen.getByText('Add Friend');
        fireEvent.click(addFriendButton);
        expect(mockAddFriend).toHaveBeenCalledWith(2);
    });

    it('calls addEnemy when action clicked in modal', () => {
        render(<FriendFinder />);
        const userButton = screen.getByTestId('user-2');
        fireEvent.click(userButton);

        const addEnemyButton = screen.getByText('Add Enemy');
        fireEvent.click(addEnemyButton);
        expect(mockAddEnemy).toHaveBeenCalledWith(2);
    });

    it('hides Add Friend button if user is already a friend', () => {
        mockUseFriends.mockReturnValue({
            friends: [{ id: 2, username: 'stranger' }], // User 2 is already a friend
            removeFriend: vi.fn(),
            loading: false
        });

        render(<FriendFinder />);
        const userButton = screen.getByTestId('user-2');
        fireEvent.click(userButton);

        expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
    });

    it('shows loading state when searching', () => {
        mockUseEntitySearch.mockReturnValue({
            results: [],
            loading: true, // Loading with no results = full loader
            error: null,
            isSearching: true
        });
        mockUseFetch.mockReturnValue({
            data: null,
            loading: true,
            error: null
        });

        render(<FriendFinder />);

        // Use waitFor if there are asynchronous updates after rendering
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'sme' } });

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});
