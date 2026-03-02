
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrganizationProfile from '../../pages/OrganizationProfile';
import { useOrganization } from '../../hooks';
import { useParams, useNavigate } from 'react-router-dom';

// Mock hooks
vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useNavigate: vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('../../hooks', () => ({
    useOrganization: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock('../../components/organizations/OrganizationHeader', () => ({
    default: ({ organization }: any) => <div data-testid="org-header">{organization.name}</div>,
}));

vi.mock('../../components/organizations/OrganizationAbout', () => ({
    default: ({ organization }: any) => <div data-testid="org-about">{organization.description}</div>,
}));

vi.mock('../../components/organizations/OrganizationMembers', () => ({
    default: ({ members }: any) => <div data-testid="org-members">Members count: {members.length}</div>,
}));

vi.mock('../../components/organizations/OrganizationEvents', () => ({
    default: ({ organizationId }: any) => <div data-testid="org-events">Events for org: {organizationId}</div>,
}));

vi.mock('../../components/common', () => ({
    Loading: () => <div>Loading...</div>,
    ErrorMessage: ({ message }: any) => <div>Error: {message}</div>,
}));

describe('OrganizationProfile Component', () => {
    const mockOrganization = {
        id: 1,
        name: 'Test Org',
        description: 'Test Description',
        members: [{ userId: 1, role: 'OWNER' }],
        events: [{ id: 1, title: 'Event 1' }],
    };

    const mockRefresh = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useParams as any).mockReturnValue({ id: '1' });
        (useNavigate as any).mockReturnValue(vi.fn());
    });

    it('should show loading state', () => {
        (useOrganization as any).mockReturnValue({
            organization: null,
            loading: true,
            error: null,
        });

        render(<OrganizationProfile />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error state', () => {
        (useOrganization as any).mockReturnValue({
            organization: null,
            loading: false,
            error: 'Failed to fetch',
        });

        render(<OrganizationProfile />);
        expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });

    it('should show not found state', () => {
        (useOrganization as any).mockReturnValue({
            organization: null,
            loading: false,
            error: null,
        });

        render(<OrganizationProfile />);
        expect(screen.getByText('Error: Organization not found')).toBeInTheDocument();
    });

    it('should render organization details and default to About tab', () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
            canCreateEvent: true,
            canManageMembers: true,
            refresh: mockRefresh,
        });

        render(<OrganizationProfile />);

        expect(screen.getByTestId('org-header')).toHaveTextContent('Test Org');
        expect(screen.getByTestId('org-about')).toHaveTextContent('Test Description');

        // Check tabs
        expect(screen.getByText('About')).toHaveClass('border-blue-500');
    });

    it('should switch tabs correctly', () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
            canCreateEvent: true,
            canManageMembers: true,
            refresh: mockRefresh,
        });

        render(<OrganizationProfile />);

        // Click Members tab
        fireEvent.click(screen.getByText('Members'));
        expect(screen.getByTestId('org-members')).toHaveTextContent('Members count: 1');
        expect(screen.getByText('Members')).toHaveClass('border-blue-500');

        // Click Events tab
        fireEvent.click(screen.getByText('Events'));
        expect(screen.getByTestId('org-events')).toHaveTextContent('Events for org: 1');

        // Click About tab back
        fireEvent.click(screen.getByText('About'));
        expect(screen.getByTestId('org-about')).toBeInTheDocument();
    });
});
