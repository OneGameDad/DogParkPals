import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserProfileModal from '../../../components/users/UserProfileModal';
import type { User } from '../../../types';
import { UserRole } from '../../../types';

// Mock useTranslation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

// Mock common components
vi.mock('../../../components/common', () => ({
    Modal: ({ children, isOpen, title, onClose }: any) => isOpen ? (
        <div data-testid="mock-modal">
            <button onClick={onClose} data-testid="close-modal">Close</button>
            <h1>{title}</h1>
            {children}
        </div>
    ) : null,
    Button: ({ text, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{text}</button>
    ),
    Picture: ({ alt, initials }: any) => <div data-testid="mock-picture" title={alt}>{initials}</div>,
}));

// Mock hooks
vi.mock('../../../components/users/UserDogsList', () => ({
    default: () => <div data-testid="mock-user-dogs-list">UserDogsList Mock</div>,
}));

// Mock hooks
vi.mock('../../../hooks', () => ({
    useFetch: vi.fn(),
}));

// Mock formatters
vi.mock('../../../utils/formatters', () => ({
    getUserInitials: () => 'JD',
}));

describe('UserProfileModal', () => {
    const mockUser: User = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        role: UserRole.CLIENT,
        first_name: 'John',
        last_name: 'Doe',
        profilePictureUrl: 'http://example.com/pic.jpg',
    };

    const mockOnClose = vi.fn();
    const mockOnAddFriend = vi.fn();
    const mockOnAddEnemy = vi.fn();
    const mockOnRemoveFriend = vi.fn();
    const mockOnRemoveEnemy = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when user is null', () => {
        render(<UserProfileModal user={null} onClose={mockOnClose} />);
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('renders user details when open', () => {
        render(<UserProfileModal user={mockUser} onClose={mockOnClose} />);

        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
        // Username appears in Modal header and body. Check for the main profile header.
        expect(screen.getByRole('heading', { level: 2, name: 'johndoe' })).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Check for specific picture by title (mock uses alt as title)
        // Note: There might be multiple pictures (user + dogs), so we ensure at least one exists with the user's name
        expect(screen.getByTitle('johndoe')).toBeInTheDocument();
    });

    it('renders "Add Friend" and "Add Enemy" buttons when provided', () => {
        render(
            <UserProfileModal
                user={mockUser}
                onClose={mockOnClose}
                onAddFriend={mockOnAddFriend}
                onAddEnemy={mockOnAddEnemy}
            />
        );

        expect(screen.getByText('findFriends.addFriend')).toBeInTheDocument();
        expect(screen.getByText('findFriends.addEnemy')).toBeInTheDocument();

        fireEvent.click(screen.getByText('findFriends.addFriend'));
        expect(mockOnAddFriend).toHaveBeenCalledWith(mockUser.id);
    });

    it('shows "Request Sent" disabled button when isRequestSent is true', () => {
        render(
            <UserProfileModal
                user={mockUser}
                onClose={mockOnClose}
                onAddFriend={mockOnAddFriend}
                onAddEnemy={mockOnAddEnemy}
                isRequestSent={true}
            />
        );

        const button = screen.getByText('findFriends.requestSentButton');
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });

    it('renders "Unfriend" button when onRemoveFriend is provided', () => {
        render(
            <UserProfileModal
                user={mockUser}
                onClose={mockOnClose}
                onRemoveFriend={mockOnRemoveFriend}
            />
        );

        const button = screen.getByText('friends.remove');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockOnRemoveFriend).toHaveBeenCalledWith(mockUser.id);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders "Remove Enemy" button when onRemoveEnemy is provided', () => {
        render(
            <UserProfileModal
                user={mockUser}
                onClose={mockOnClose}
                onRemoveEnemy={mockOnRemoveEnemy}
            />
        );

        const button = screen.getByText('enemies.remove');
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockOnRemoveEnemy).toHaveBeenCalledWith(mockUser.id);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders loading states for buttons', () => {
        render(
            <UserProfileModal
                user={mockUser}
                onClose={mockOnClose}
                onAddFriend={mockOnAddFriend}
                onAddEnemy={mockOnAddEnemy}
                loading={true}
            />
        );

        expect(screen.getAllByText('findFriends.processing')).toHaveLength(2);
    });

    it('renders UserDogsList component', () => {
        render(<UserProfileModal user={mockUser} onClose={mockOnClose} />);
        expect(screen.getByTestId('mock-user-dogs-list')).toBeInTheDocument();
    });
});
