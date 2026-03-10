
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageThread from '../../../components/chat/MessageThread';
import { messageService } from '../../../services/messageService';
import { api } from '../../../services/api';

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../../services/messageService', () => {
    const mockMessageService = {
        getConversation: vi.fn(),
        sendMessage: vi.fn(),
    };
    return {
        default: mockMessageService,
        messageService: mockMessageService,
    };
});

vi.mock('../../../services/api', () => ({
    api: {
        get: vi.fn(),
    }
}));

// Mock usePolling
vi.mock('../../../hooks/usePolling', () => ({
    usePolling: (callback: any) => {
        // We can manually trigger the callback if needed in tests, 
        // or just rely on the useEffect initial fetch in the component
    }
}));

// Mock common components
vi.mock('../../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    Button: ({ text, onClick, disabled, type }: any) => (
        <button onClick={onClick} disabled={disabled} type={type}>{text}</button>
    ),
    Picture: () => <div>FriendPicture</div>
}));

vi.mock('../../../utils/formatters', () => ({
    getUserInitials: () => 'US',
    formatTime: () => '10:00 AM'
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('MessageThread', () => {
    const mockFriend = { id: 2, username: 'friend_user', profilePictureUrl: 'url' };
    const mockMessages = [
        { id: 1, senderId: 1, content: 'Hello', sentAt: new Date().toISOString() },
        { id: 2, senderId: 2, content: 'Hi there', sentAt: new Date().toISOString() },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as any).mockResolvedValue(mockFriend);
        (messageService.getConversation as any).mockResolvedValue({ data: mockMessages });
    });

    it('renders loading state initially', () => {
        (messageService.getConversation as any).mockReturnValue(new Promise(() => { }));
        render(<MessageThread friendId={2} currentUserId={1} />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders messages and friend info after load', async () => {
        render(<MessageThread friendId={2} currentUserId={1} />);

        await waitFor(() => {
            expect(screen.getByText('friend_user')).toBeInTheDocument();
            expect(screen.getByText('Hello')).toBeInTheDocument();
            expect(screen.getByText('Hi there')).toBeInTheDocument();
        });
    });

    it('renders empty state when no messages', async () => {
        (messageService.getConversation as any).mockResolvedValue({ data: [] });
        render(<MessageThread friendId={2} currentUserId={1} />);

        await waitFor(() => {
            expect(screen.getByText('chat.noMessagesStartConversation')).toBeInTheDocument();
        });
    });

    it('sends a message', async () => {
        render(<MessageThread friendId={2} currentUserId={1} />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('chat.typeMessage')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('chat.typeMessage');
        fireEvent.change(input, { target: { value: 'New message' } });

        const sendButton = screen.getByText('common.send');

        // Mock the response logic
        const newMessage = { id: 3, senderId: 1, content: 'New message', sentAt: new Date().toISOString() };
        (messageService.sendMessage as any).mockResolvedValue(newMessage);

        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(messageService.sendMessage).toHaveBeenCalledWith(1, 2, 'New message');
            // Optimistic update or refetch check
            expect(screen.getByText('New message')).toBeInTheDocument();
            expect(input).toHaveValue('');
        });
    });

    it('disables send button when input is empty', async () => {
        render(<MessageThread friendId={2} currentUserId={1} />);

        await waitFor(() => {
            expect(screen.getByText('common.send')).toBeDisabled();
        });

        const input = screen.getByPlaceholderText('chat.typeMessage');
        fireEvent.change(input, { target: { value: ' ' } }); // whitespace

        expect(screen.getByText('common.send')).toBeDisabled();
    });
});
