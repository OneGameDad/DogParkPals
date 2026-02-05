import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserCard from '../../../components/users/UserCard';
import type { User } from '../../../types';
import { UserRole } from '../../../types';

// Mock formatters
vi.mock('../../../utils/formatters', () => ({
    getUserInitials: () => 'JD',
}));

// Mock Picture component
vi.mock('../../../components/common', () => ({
    Picture: ({ alt, initials }: any) => <div data-testid="mock-picture" title={alt}>{initials}</div>,
}));

describe('UserCard', () => {
    const mockUser: User = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        role: UserRole.CLIENT,
        first_name: 'John',
        last_name: 'Doe',
        profilePictureUrl: 'http://example.com/pic.jpg',
    };

    const mockOnClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders user information correctly', () => {
        render(<UserCard user={mockUser} onClick={mockOnClick} />);

        expect(screen.getByText('johndoe')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByTestId('mock-picture')).toBeInTheDocument();
    });

    it('render picture with correct props', () => {
        render(<UserCard user={mockUser} onClick={mockOnClick} />);

        const picture = screen.getByTestId('mock-picture');
        expect(picture).toHaveTextContent('JD');
        expect(picture).toHaveAttribute('title', 'johndoe');
    });

    it('calls onClick when clicked', () => {
        render(<UserCard user={mockUser} onClick={mockOnClick} />);

        fireEvent.click(screen.getByText('johndoe').closest('div')!.parentElement!);
        expect(mockOnClick).toHaveBeenCalledWith(mockUser);
    });

    it('renders correctly without first/last name', () => {
        const userWithoutName = { ...mockUser, first_name: undefined, last_name: undefined };
        render(<UserCard user={userWithoutName} onClick={mockOnClick} />);

        expect(screen.getByText('johndoe')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
});
