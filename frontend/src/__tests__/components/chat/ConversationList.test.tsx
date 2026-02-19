
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConversationList from '../../../components/chat/ConversationList';
import { api } from '../../../services/api';

// Mock UserCard
vi.mock('../../../components/users/UserCard', () => ({
    default: ({ user, onClick, isActive }: any) => (
        <div
            data-testid={`user-card-${user.id}`}
            onClick={() => onClick(user)}
            className={isActive ? 'active' : ''}
        >
            {user.username}
        </div>
    )
}));

// Mock API
vi.mock('../../../services/api', () => ({
    api: {
        get: vi.fn(),
    }
}));

// Mock Loading and Error components
vi.mock('../../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    ErrorMessage: ({ message }: any) => <div>Error: {message}</div>,
    Picture: () => <div>Picture</div> // If exported from common
}));

describe('ConversationList', () => {
    const mockFriends = [
        { id: 1, username: 'friend1', profilePictureUrl: null },
        { id: 2, username: 'friend2', profilePictureUrl: null },
    ];
    const mockOnSelectFriend = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (api.get as any).mockReturnValue(new Promise(() => { })); // Never resolves
        render(<ConversationList currentUserId={1} activeFriendId={null} onSelectFriend={mockOnSelectFriend} />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders list of friends after successful fetch', async () => {
        (api.get as any).mockResolvedValue({ users: mockFriends });

        render(<ConversationList currentUserId={1} activeFriendId={null} onSelectFriend={mockOnSelectFriend} />);

        await waitFor(() => {
            expect(screen.getByText('friend1')).toBeInTheDocument();
            expect(screen.getByText('friend2')).toBeInTheDocument();
        });
    });

    it('renders error message on fetch failure', async () => {
        (api.get as any).mockRejectedValue(new Error('Fetch error'));

        render(<ConversationList currentUserId={1} activeFriendId={null} onSelectFriend={mockOnSelectFriend} />);

        await waitFor(() => {
            expect(screen.getByText(/Error:/)).toBeInTheDocument();
        });
    });

    it('renders empty state when no friends found', async () => {
        (api.get as any).mockResolvedValue({ users: [] });

        render(<ConversationList currentUserId={1} activeFriendId={null} onSelectFriend={mockOnSelectFriend} />);

        await waitFor(() => {
            expect(screen.getByText('chat.noFriends')).toBeInTheDocument();
        });
    });

    it('calls onSelectFriend when a friend is clicked', async () => {
        (api.get as any).mockResolvedValue({ users: mockFriends });

        render(<ConversationList currentUserId={1} activeFriendId={null} onSelectFriend={mockOnSelectFriend} />);

        await waitFor(() => {
            expect(screen.getByText('friend1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('friend1'));
        expect(mockOnSelectFriend).toHaveBeenCalledWith(1);
    });

    it('marks active friend correctly', async () => {
        (api.get as any).mockResolvedValue({ users: mockFriends });

        render(<ConversationList currentUserId={1} activeFriendId={2} onSelectFriend={mockOnSelectFriend} />);

        await waitFor(() => {
            const friend2Card = screen.getByTestId('user-card-2');
            expect(friend2Card).toHaveClass('active');

            const friend1Card = screen.getByTestId('user-card-1');
            expect(friend1Card).not.toHaveClass('active');
        });
    });
});
