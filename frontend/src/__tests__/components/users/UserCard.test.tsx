import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserCard from '../../../components/users/UserCard';

// Component uses Picture, which we should verify is used or mock if complex
vi.mock('../../../components/common', () => ({
    Picture: ({ alt }: any) => <img alt={alt} data-testid="user-picture" />
}));

vi.mock('../../../utils/formatters', () => ({
    getUserInitials: () => 'TU'
}));

describe('UserCard', () => {
    const mockUser = { id: 1, username: 'testuser', first_name: 'Test', last_name: 'User' };

    it('renders user information correctly', () => {
        render(<UserCard user={mockUser as any} />);
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByTestId('user-picture')).toBeInTheDocument();
    });

    it('handles click events when onClick is provided', () => {
        const handleClick = vi.fn();
        render(<UserCard user={mockUser as any} onClick={handleClick} />);

        fireEvent.click(screen.getByText('testuser'));
        expect(handleClick).toHaveBeenCalledWith(mockUser);
    });

    it('renders custom action content', () => {
        render(
            <UserCard
                user={mockUser as any}
                action={<button>Custom Action</button>}
            />
        );
        expect(screen.getByText('Custom Action')).toBeInTheDocument();
        expect(screen.queryByTestId('chevron-icon')).not.toBeInTheDocument();
    });

    it('renders chevron by default when no action provided', () => {
        const { container } = render(<UserCard user={mockUser as any} />); // showChevron default is true
        // SVG doesn't have a role, checking existence of SVG
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('hides chevron when showChevron is false', () => {
        const { container } = render(<UserCard user={mockUser as any} showChevron={false} />);
        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
});
