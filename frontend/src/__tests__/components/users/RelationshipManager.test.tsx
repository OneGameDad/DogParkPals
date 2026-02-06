import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RelationshipManager from '../../../components/users/RelationshipManager';

// Mock Dependencies
vi.mock('../../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    ErrorMessage: ({ message }: any) => <div>Error: {message}</div>,
    InputText: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    )
}));

vi.mock('../../../components/users/UserList', () => ({
    default: ({ users, onUserClick, emptyMessage }: any) => (
        <div data-testid="user-list">
            {users.length === 0 ? emptyMessage : (
                users.map((u: any) => (
                    <div key={u.id} onClick={() => onUserClick(u)} data-testid="user-item">
                        {u.username}
                    </div>
                ))
            )}
        </div>
    )
}));

vi.mock('../../../components/users/UserProfileModal', () => ({
    default: ({ user, onClose, onRemoveFriend, onRemoveEnemy }: any) => (
        user ? (
            <div data-testid="user-modal">
                <h2>{user.username}</h2>
                <button onClick={onClose}>Close</button>
                {onRemoveFriend && <button onClick={() => onRemoveFriend(user.id)}>Remove Friend</button>}
                {onRemoveEnemy && <button onClick={() => onRemoveEnemy(user.id)}>Remove Enemy</button>}
            </div>
        ) : null
    )
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}));

describe('RelationshipManager', () => {
    const mockUsers = [
        { id: 1, username: 'Alice', first_name: 'Alice', last_name: 'Wonder' },
        { id: 2, username: 'Bob', first_name: 'Bob', last_name: 'Builder' }
    ];
    const mockRemove = vi.fn();

    const defaultProps = {
        title: 'My Friends',
        searchPlaceholder: 'Search...',
        emptyMessage: 'No friends',
        users: mockUsers as any,
        loading: false,
        error: null,
        onRemove: mockRemove,
        type: 'friend' as const
    };

    it('renders title and search input', () => {
        render(<RelationshipManager {...defaultProps} />);
        expect(screen.getByText('My Friends')).toBeInTheDocument();
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('filters users based on search term', () => {
        render(<RelationshipManager {...defaultProps} />);
        const input = screen.getByTestId('search-input');

        fireEvent.change(input, { target: { value: 'Alice' } });

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('opens modal when user is clicked', () => {
        render(<RelationshipManager {...defaultProps} />);
        fireEvent.click(screen.getByText('Alice'));

        expect(screen.getByTestId('user-modal')).toBeInTheDocument();
        // Alice appears in the list AND the modal, so we expect multiple or restrict to modal
        expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    });

    it('calls onRemove when remove action is triggered from modal', () => {
        render(<RelationshipManager {...defaultProps} />);

        // Open modal
        fireEvent.click(screen.getByText('Alice'));

        // Click remove (it's a friend type, so Remove Friend button)
        fireEvent.click(screen.getByText('Remove Friend'));

        expect(mockRemove).toHaveBeenCalledWith(1);
    });

    it('closes modal when close button clicked', () => {
        render(<RelationshipManager {...defaultProps} />);
        fireEvent.click(screen.getByText('Alice'));
        fireEvent.click(screen.getByText('Close'));

        expect(screen.queryByTestId('user-modal')).not.toBeInTheDocument();
    });

    it('renders loading state', () => {
        render(<RelationshipManager {...defaultProps} loading={true} />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders error state', () => {
        render(<RelationshipManager {...defaultProps} error={new Error('Failed')} />);
        expect(screen.getByText('Error: Failed')).toBeInTheDocument();
    });
});
