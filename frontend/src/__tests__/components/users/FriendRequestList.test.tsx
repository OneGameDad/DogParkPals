import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FriendRequestList from '../../../components/users/FriendRequestList';
import { useFetch } from '../../../hooks/useFetch';
import { useFriendActions } from '../../../hooks/users/useFriendActions';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock hooks
vi.mock('../../../hooks/useFetch', () => ({
    useFetch: vi.fn(),
}));

vi.mock('../../../hooks/users/useFriendActions', () => ({
    useFriendActions: vi.fn(),
}));

// Mock child components
vi.mock('../../../components/common', () => ({
    Loading: ({ message }: any) => <div>{message}</div>,
    ErrorMessage: ({ message }: any) => <div>{message}</div>,
    Button: ({ text, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{text}</button>
    ),
    Picture: () => <div>Picture</div>,
}));

describe('FriendRequestList Component', () => {
    const mockRequests = [
        {
            id: 1,
            requesterId: 101,
            status: 'PENDING',
            requester: { id: 101, username: 'User1', profilePictureUrl: 'url1' },
            requesterDog: null,
        },
        {
            id: 2,
            requesterId: null,
            requesterDogId: 201,
            status: 'PENDING',
            requesterDog: { id: 201, name: 'Dog1', profilePictureUrl: 'url2' },
        },
    ];

    const mockRefetch = vi.fn();
    const mockAccept = vi.fn();
    const mockDecline = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useFetch as any).mockReturnValue({
            data: mockRequests,
            loading: false,
            error: null,
            refetch: mockRefetch,
        });
        (useFriendActions as any).mockReturnValue({
            acceptRequest: mockAccept,
            declineRequest: mockDecline,
            actionLoading: false,
        });
    });

    it('should render list of friend requests', () => {
        render(<FriendRequestList userId={1} />);

        expect(screen.getByText('friends.pendingRequests')).toBeInTheDocument();
        expect(screen.getByText('User1')).toBeInTheDocument();
        expect(screen.getByText('User Request')).toBeInTheDocument();
        expect(screen.getByText('Dog1')).toBeInTheDocument();
        expect(screen.getByText('Dog Request')).toBeInTheDocument();
    });

    it('should call acceptRequest when Accept button is clicked', async () => {
        mockAccept.mockResolvedValue(true);
        render(<FriendRequestList userId={1} />);

        const acceptButtons = screen.getAllByText('common.accept');
        fireEvent.click(acceptButtons[0]);

        expect(mockAccept).toHaveBeenCalledWith(1);
        await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });

    it('should call declineRequest when Decline button is clicked', async () => {
        mockDecline.mockResolvedValue(true);
        render(<FriendRequestList userId={1} />);

        const declineButtons = screen.getAllByText('common.decline');
        fireEvent.click(declineButtons[0]);

        expect(mockDecline).toHaveBeenCalledWith(1);
        await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });

    it('should show loading state', () => {
        (useFetch as any).mockReturnValue({
            data: null,
            loading: true,
            error: null,
            refetch: mockRefetch,
        });

        render(<FriendRequestList userId={1} />);
        expect(screen.getByText('common.loading')).toBeInTheDocument();
    });

    it('should show error state', () => {
        (useFetch as any).mockReturnValue({
            data: null,
            loading: false,
            error: 'Error',
            refetch: mockRefetch,
        });

        render(<FriendRequestList userId={1} />);
        expect(screen.getByText('common.error')).toBeInTheDocument();
    });

    it('should render nothing if no requests', () => {
        (useFetch as any).mockReturnValue({
            data: [],
            loading: false,
            error: null,
            refetch: mockRefetch,
        });

        const { container } = render(<FriendRequestList userId={1} />);
        expect(container).toBeEmptyDOMElement();
    });
});
