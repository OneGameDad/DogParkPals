import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserList from '../../../components/users/UserList';

// Mock Child Component
vi.mock('../../../components/users/UserCard', () => ({
    default: ({ user, onClick }: any) => (
        <div data-testid="user-card" onClick={() => onClick && onClick(user)}>
            {user.username}
        </div>
    )
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}));

describe('UserList', () => {
    const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
    ];

    it('renders list of users', () => {
        render(<UserList users={mockUsers as any} onUserClick={vi.fn()} />);
        expect(screen.getAllByTestId('user-card')).toHaveLength(2);
        expect(screen.getByText('user1')).toBeInTheDocument();
    });

    it('filters out current user', () => {
        render(<UserList users={mockUsers as any} currentUserId={1} onUserClick={vi.fn()} />);
        expect(screen.getAllByTestId('user-card')).toHaveLength(1);
        expect(screen.getByText('user2')).toBeInTheDocument();
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
    });

    it('displays empty message when no users found', () => {
        render(<UserList users={[]} onUserClick={vi.fn()} />);
        expect(screen.getByText('findFriends.noUsersFound')).toBeInTheDocument();
    });

    it('displays custom empty message', () => {
        render(<UserList users={[]} onUserClick={vi.fn()} emptyMessage="Nothing here" />);
        expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('calls onUserClick when a user card is clicked', () => {
        const handleClick = vi.fn();
        render(<UserList users={mockUsers as any} onUserClick={handleClick} />);

        fireEvent.click(screen.getByText('user1'));
        expect(handleClick).toHaveBeenCalledWith(mockUsers[0]);
    });
});
