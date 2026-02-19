
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatLayout from '../../../components/chat/ChatLayout';
import * as routerDom from 'react-router-dom';
import * as authHook from '../../../hooks/useAuth';

// Mock child components
vi.mock('../../../components/chat/ConversationList', () => ({
    default: ({ onSelectFriend }: any) => (
        <div data-testid="conversation-list">
            <button onClick={() => onSelectFriend(1)}>Select Friend 1</button>
        </div>
    )
}));

vi.mock('../../../components/chat/MessageThread', () => ({
    default: ({ friendId }: any) => <div data-testid="message-thread">Chat with {friendId}</div>
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: vi.fn(),
    };
});

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

describe('ChatLayout', () => {
    const mockSetSearchParams = vi.fn();
    const mockUser = { id: 1, username: 'testuser' };

    beforeEach(() => {
        vi.clearAllMocks();
        (authHook.useAuth as any).mockReturnValue({ user: mockUser });
        (routerDom.useSearchParams as any).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);
    });

    it('renders nothing if user is not authenticated', () => {
        (authHook.useAuth as any).mockReturnValue({ user: null });
        const { container } = render(<ChatLayout />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders conversation list and default empty state when no friend selected', () => {
        render(<ChatLayout />);

        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
        expect(screen.getByText('chat.selectConversation')).toBeInTheDocument();
        expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();
    });

    it('renders message thread when friend is selected in URL', () => {
        const params = new URLSearchParams();
        params.set('friend', '123');
        (routerDom.useSearchParams as any).mockReturnValue([params, mockSetSearchParams]);

        render(<ChatLayout />);

        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
        expect(screen.getByText('Chat with 123')).toBeInTheDocument();
    });

    it('updates URL when friend is selected', () => {
        render(<ChatLayout />);

        fireEvent.click(screen.getByText('Select Friend 1'));

        expect(mockSetSearchParams).toHaveBeenCalledWith({ friend: '1' });
    });

    it('clears URL when back button is clicked (mobile view logic)', () => {
        const params = new URLSearchParams();
        params.set('friend', '123');
        (routerDom.useSearchParams as any).mockReturnValue([params, mockSetSearchParams]);

        render(<ChatLayout />);

        // The back button is only visible on small screens (md:hidden), 
        // but it should still verify the click handler works if we can find it.
        const backButton = screen.getByText(/common.back/);
        fireEvent.click(backButton);

        expect(mockSetSearchParams).toHaveBeenCalledWith({});
    });
});
