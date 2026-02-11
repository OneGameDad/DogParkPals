
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationUpdate from '../../pages/OrganizationUpdate';
import { useOrganization } from '../../hooks';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

// Mock hooks
vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useNavigate: vi.fn(),
}));

vi.mock('../../hooks', () => ({
    useOrganization: vi.fn(),
}));

vi.mock('../../services/api', () => ({
    default: {
        put: vi.fn(),
        delete: vi.fn(),
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
vi.mock('../../components/common', () => ({
    InputText: ({ label, value, onChange, placeholder }: any) => (
        <div>
            <label>{label}</label>
            <input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid={`input-${label}`}
            />
        </div>
    ),
    Button: ({ text, onClick, type, disabled }: any) => (
        <button
            type={type || 'button'}
            onClick={onClick}
            disabled={disabled}
        >
            {text}
        </button>
    ),
    Loading: () => <div>Loading...</div>,
    ErrorMessage: ({ message }: any) => <div>Error: {message}</div>,
}));

describe('OrganizationUpdate Component', () => {
    const mockOrganization = {
        id: 1,
        name: 'Test Org',
        description: 'Test Description',
        websiteUrl: 'http://test.com',
        profilePictureUrl: null,
    };

    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useParams as any).mockReturnValue({ id: '1' });
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    it('should show loading state', () => {
        (useOrganization as any).mockReturnValue({
            organization: null,
            loading: true,
            error: null,
        });

        render(<OrganizationUpdate />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect if no permission', () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: false,
        });

        render(<OrganizationUpdate />);
        expect(mockNavigate).toHaveBeenCalledWith('/organizations/1');
    });

    it('should fill form with organization data', () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
        });

        render(<OrganizationUpdate />);

        const nameInput = screen.getByTestId('input-Organization Name') as HTMLInputElement;
        const websiteInput = screen.getByTestId('input-Website URL') as HTMLInputElement;
        const descInput = screen.getByPlaceholderText('Tell us about your organization') as HTMLTextAreaElement;

        expect(nameInput.value).toBe('Test Org');
        expect(websiteInput.value).toBe('http://test.com');
        expect(descInput.value).toBe('Test Description');
    });

    it('should handle form submission', async () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
        });

        render(<OrganizationUpdate />);

        const nameInput = screen.getByTestId('input-Organization Name');
        fireEvent.change(nameInput, { target: { value: 'Updated Org' } });

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(api.put).toHaveBeenCalledWith('/api/organizations/1', expect.objectContaining({
            name: 'Updated Org',
            description: 'Test Description',
            websiteUrl: 'http://test.com',
        }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/organizations/1');
        });
    });

    it('should show delete button for owner', () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
            isOwner: true,
        });

        render(<OrganizationUpdate />);
        expect(screen.getByText('Delete Organization')).toBeInTheDocument();
    });

    it('should handle deletion', async () => {
        (useOrganization as any).mockReturnValue({
            organization: mockOrganization,
            loading: false,
            error: null,
            canEdit: true,
            isOwner: true,
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<OrganizationUpdate />);

        const deleteButton = screen.getByText('Delete Organization');
        fireEvent.click(deleteButton);

        expect(api.delete).toHaveBeenCalledWith('/api/organizations/1');

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/organizations');
        });
    });
});
