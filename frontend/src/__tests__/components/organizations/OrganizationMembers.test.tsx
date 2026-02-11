
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationMembers from '../../../components/organizations/OrganizationMembers';
import { useUserSearch } from '../../../hooks';
import api from '../../../services/api';
import { OrganizationMember, OrgRole, User } from '../../../types';

// Mock hooks
vi.mock('../../../hooks', () => ({
    useUserSearch: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
    default: {
        post: vi.fn(),
        delete: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
    },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock components
vi.mock('../../../components/common', () => ({
    Picture: () => <div data-testid="picture">Picture</div>,
    Button: ({ text, onClick, variant }: any) => (
        <button onClick={onClick} data-variant={variant}>{text}</button>
    ),
}));

vi.mock('../../../components/features', () => ({
    SearchBar: ({ onSearch }: any) => (
        <input
            data-testid="search-bar"
            onChange={(e) => onSearch(e.target.value)}
        />
    ),
}));

vi.mock('../../../components/users/UserList', () => ({
    default: ({ users, onUserClick }: any) => (
        <div data-testid="user-list">
            {users.map((user: User) => (
                <div key={user.id} onClick={() => onUserClick(user)}>
                    {user.username}
                </div>
            ))}
        </div>
    ),
}));

describe('OrganizationMembers Component', () => {
    const mockMembers: OrganizationMember[] = [
        {
            userId: 1,
            organizationId: 1,
            role: OrgRole.OWNER,
            joinedAt: '2023-01-01',
            user: { id: 1, username: 'owner', profilePictureUrl: null } as User
        },
        {
            userId: 2,
            organizationId: 1,
            role: OrgRole.MEMBER,
            joinedAt: '2023-01-02',
            user: { id: 2, username: 'member', profilePictureUrl: null } as User
        }
    ];

    const mockOnMemberUpdate = vi.fn();
    const mockSetSearchQuery = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock for useUserSearch
        (useUserSearch as any).mockReturnValue({
            searchQuery: '',
            setSearchQuery: mockSetSearchQuery,
            users: [],
            loading: false,
            error: null
        });
    });

    it('should render members list', () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={false}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        expect(screen.getByText('owner')).toBeInTheDocument();
        expect(screen.getByText('member')).toBeInTheDocument();
        expect(screen.getByText('OWNER • 1/1/2023')).toBeInTheDocument();
    });

    it('should show add member button when canManageMembers is true', () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        expect(screen.getByText('Add Member')).toBeInTheDocument();
    });

    it('should not show add member button when canManageMembers is false', () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={false}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
    });

    it('should toggle search bar when Add Member is clicked', () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        fireEvent.click(screen.getByText('Add Member'));
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Done'));
        expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
    });

    it('should call setSearchQuery when typing in search bar', () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        fireEvent.click(screen.getByText('Add Member'));
        const input = screen.getByTestId('search-bar');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(mockSetSearchQuery).toHaveBeenCalledWith('test');
    });

    it('should handle adding a member', async () => {
        const mockNewUser = { id: 3, username: 'newuser' } as User;

        (useUserSearch as any).mockReturnValue({
            searchQuery: 'new',
            setSearchQuery: mockSetSearchQuery,
            users: [mockNewUser],
            loading: false,
            error: null
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        fireEvent.click(screen.getByText('Add Member'));

        // Find the user in the UserList (mocked)
        const userItem = screen.getByText('newuser');
        fireEvent.click(userItem);

        expect(api.post).toHaveBeenCalledWith('/api/organizations/1/members', {
            userId: 3,
            role: 'MEMBER'
        });

        await waitFor(() => {
            expect(mockOnMemberUpdate).toHaveBeenCalled();
            expect(mockSetSearchQuery).toHaveBeenCalledWith('');
        });
    });

    it('should handle removing a member', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        // Find remove button for the second member (index 1)
        // Note: The mocked Button component renders text. 
        // We need to target the "Remove" button specifically for the member.
        // In the component: {canManageMembers && member.role !== 'OWNER' && (...)}
        // The first member is OWNER, so only the second member has a remove button.

        const removeButtons = screen.getAllByText('Remove');
        expect(removeButtons).toHaveLength(1);

        fireEvent.click(removeButtons[0]);

        expect(api.delete).toHaveBeenCalledWith('/api/organizations/1/members/2');

        await waitFor(() => {
            expect(mockOnMemberUpdate).toHaveBeenCalled();
        });
    });

    it('should handle updating a member role', async () => {
        render(
            <OrganizationMembers
                organizationId={1}
                members={mockMembers}
                canManageMembers={true}
                onMemberUpdate={mockOnMemberUpdate}
            />
        );

        // Target the select element for the member (not owner)
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'MODERATOR' } });

        expect(api.put).toHaveBeenCalledWith('/api/organizations/1/members/2', { role: 'MODERATOR' });

        await waitFor(() => {
            expect(mockOnMemberUpdate).toHaveBeenCalled();
        });
    });
});
