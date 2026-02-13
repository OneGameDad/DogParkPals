import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import UserProfileModal from '../../../components/users/UserProfileModal';

// Mock Dependencies
vi.mock('../../../components/common', () => ({
    Modal: ({ isOpen, onClose, children, title }: any) => (
        isOpen ? (
            <div data-testid="modal">
                <h1>{title}</h1>
                <button onClick={onClose}>Close</button>
                {children}
            </div>
        ) : null
    ),
    Button: ({ text, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{text}</button>
    ),
    Picture: () => <img alt="profile" />
}));

vi.mock('../../../components/users/UserDogsList', () => ({
    default: () => <div data-testid="user-dogs-list">Dogs List</div>
}));

vi.mock('../../../utils/formatters', () => ({
    getUserInitials: () => 'TU'
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key })
}));

describe('UserProfileModal', () => {
    const mockUser = { id: 1, username: 'testuser', first_name: 'Test', last_name: 'User' };
    const mockClose = vi.fn();

    const renderModal = (props: any) => {
        return render(
            <BrowserRouter>
                <UserProfileModal {...props} />
            </BrowserRouter>
        );
    };

    it('renders nothing when user is null', () => {
        renderModal({ user: null, onClose: mockClose });
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders modal content when user is provided', () => {
        renderModal({ user: mockUser as any, onClose: mockClose });
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        // Username appears in title and body
        expect(screen.getAllByText('testuser').length).toBeGreaterThan(0);
        expect(screen.getByTestId('user-dogs-list')).toBeInTheDocument();
    });

    it('shows Add Friend/Enemy buttons when handlers provided', () => {
        const addFriend = vi.fn();
        const addEnemy = vi.fn();

        renderModal({
            user: mockUser as any,
            onClose: mockClose,
            onAddFriend: addFriend,
            onAddEnemy: addEnemy,
        });

        expect(screen.getByText('findFriends.addFriend')).toBeInTheDocument();
        expect(screen.getByText('findFriends.addEnemy')).toBeInTheDocument();
    });

    it('shows disabled Request Sent button when isRequestSent is true', () => {
        renderModal({
            user: mockUser as any,
            onClose: mockClose,
            onAddFriend: vi.fn(),
            onAddEnemy: vi.fn(),
            isRequestSent: true,
        });

        expect(screen.getByText('findFriends.requestSentButton')).toBeDisabled();
        expect(screen.queryByText('findFriends.addFriend')).not.toBeInTheDocument();
    });

    it('shows Remove Friend button when onRemoveFriend provided', () => {
        const removeFriend = vi.fn();
        renderModal({
            user: mockUser as any,
            onClose: mockClose,
            onRemoveFriend: removeFriend,
        });

        expect(screen.getByText('friends.remove')).toBeInTheDocument();

        fireEvent.click(screen.getByText('friends.remove'));
        expect(removeFriend).toHaveBeenCalledWith(1);
    });

    it('shows Remove Enemy button when onRemoveEnemy provided', () => {
        const removeEnemy = vi.fn();
        renderModal({
            user: mockUser as any,
            onClose: mockClose,
            onRemoveEnemy: removeEnemy,
        });

        expect(screen.getByText('enemies.remove')).toBeInTheDocument();
    });

    it('displays error message', () => {
        renderModal({
            user: mockUser as any,
            onClose: mockClose,
            error: "Something failed",
        });
        expect(screen.getByText('Something failed')).toBeInTheDocument();
    });
});
