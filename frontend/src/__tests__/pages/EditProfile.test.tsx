import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditProfile from '../../pages/EditProfile';
import * as apiModule from '../../services/api';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    promise: vi.fn((promise, messages) => {
      return promise
        .then((result: any) => {
          if (messages?.success) {
            typeof messages.success === 'function'
              ? messages.success(result)
              : messages.success;
          }
          return result;
        })
        .catch((err: Error) => {
          if (messages?.error) {
            typeof messages.error === 'function'
              ? messages.error(err)
              : messages.error;
          }
          throw err;
        });
    }),
  },
}));

// Mock the api service
vi.mock('../../services/api', () => ({
  api: {
    patch: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('EditProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderEditProfile = () => {
    return render(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    profilePictureUrl: 'https://example.com/profile.jpg',
  };

  it('should show loading state while fetching user data', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    renderEditProfile();
    
    expect(screen.getByText('profile.loading')).toBeInTheDocument();
  });

  it('should show error message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderEditProfile();
    
    expect(screen.getByText('profile.pleaseLogin')).toBeInTheDocument();
  });

  it('should render edit profile form', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    expect(screen.getByText('profile.editProfileTitle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
  });

  it('should display current profile picture', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const profileImage = screen.getByAltText('Profile Preview');
    expect(profileImage).toBeInTheDocument();
  });

  it('should display default profile picture when user has no profile picture', () => {
    const userWithoutPicture = { ...mockUser, profilePictureUrl: null };
    mockUseAuth.mockReturnValue({ user: userWithoutPicture, loading: false });

    renderEditProfile();
    
    const profileImage = screen.getByAltText('Profile Preview');
    expect(profileImage).toHaveAttribute('src', '/imgs/exampleprofilepic.jpg');
  });

  it('should update first name input value', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    
    expect(firstNameInput.value).toBe('Jane');
  });

  it('should update last name input value', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const lastNameInput = screen.getByDisplayValue('Doe') as HTMLInputElement;
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
    
    expect(lastNameInput.value).toBe('Smith');
  });

  it('should update profile picture URL input value', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const urlInput = screen.getByDisplayValue('https://example.com/profile.jpg') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/newpic.jpg' } });
    
    expect(urlInput.value).toBe('https://example.com/newpic.jpg');
  });

  it('should call api.patch with correct data on form submit', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValueOnce({});
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const firstNameInput = screen.getByDisplayValue('John');
    const submitButton = screen.getByText('profile.saveChanges');
    
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/users/profile', {
        first_name: 'Jane',
        last_name: 'Doe',
        profilePictureUrl: 'https://example.com/profile.jpg',
      });
    });
  });

  it('should successfully submit the form', async () => {
    vi.spyOn(apiModule.api, 'patch').mockResolvedValueOnce({});
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const submitButton = screen.getByText('profile.saveChanges');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiModule.api.patch).toHaveBeenCalled();
    });
    
    // Verify the API call was successful (no errors thrown)
    expect(apiModule.api.patch).toHaveBeenCalledTimes(1);
  });

  it('should show loading state during save', async () => {
    vi.spyOn(apiModule.api, 'patch').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const submitButton = screen.getByText('profile.saveChanges');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('profile.saving')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should navigate to profile page when top cancel button is clicked', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const cancelButtons = screen.getAllByText('profile.cancel');
    fireEvent.click(cancelButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should navigate to profile page when bottom cancel button is clicked', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const cancelButtons = screen.getAllByText('profile.cancel');
    fireEvent.click(cancelButtons[1]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('should send null for empty first name', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValueOnce({});
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const firstNameInput = screen.getByDisplayValue('John');
    const submitButton = screen.getByText('profile.saveChanges');
    
    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/users/profile', {
        first_name: null,
        last_name: 'Doe',
        profilePictureUrl: 'https://example.com/profile.jpg',
      });
    });
  });

  it('should send null for empty last name', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValueOnce({});
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const lastNameInput = screen.getByDisplayValue('Doe');
    const submitButton = screen.getByText('profile.saveChanges');
    
    fireEvent.change(lastNameInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/users/profile', {
        first_name: 'John',
        last_name: null,
        profilePictureUrl: 'https://example.com/profile.jpg',
      });
    });
  });

  it('should send null for empty profile picture URL', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValueOnce({});
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const urlInput = screen.getByDisplayValue('https://example.com/profile.jpg');
    const submitButton = screen.getByText('profile.saveChanges');
    
    fireEvent.change(urlInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/users/profile', {
        first_name: 'John',
        last_name: 'Doe',
        profilePictureUrl: null,
      });
    });
  });

  it('should handle user with no first or last name', () => {
    const userWithoutNames = {
      ...mockUser,
      first_name: null,
      last_name: null,
    };
    mockUseAuth.mockReturnValue({ user: userWithoutNames, loading: false });

    renderEditProfile();
    
    // Inputs should be empty
    const inputs = screen.getAllByRole('textbox');
    const firstNameInput = inputs.find(input => 
      (input as HTMLInputElement).value === ''
    );
    expect(firstNameInput).toBeDefined();
  });

  it('should handle API error on save', async () => {
    vi.spyOn(apiModule.api, 'patch').mockRejectedValueOnce(
      new Error('Failed to update')
    );
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    const submitButton = screen.getByText('profile.saveChanges');
    fireEvent.click(submitButton);
    
    // Error is now shown via toast, handled by useSubmit hook
    await waitFor(() => {
      expect(apiModule.api.patch).toHaveBeenCalled();
    });
    
    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should render all form labels', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderEditProfile();
    
    expect(screen.getByText('profile.profilePictureUrl')).toBeInTheDocument();
    expect(screen.getByText('profile.firstName')).toBeInTheDocument();
    expect(screen.getByText('profile.lastName')).toBeInTheDocument();
  });

  it('should not submit form without user', async () => {
    // Set user to null after initial render
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    const { rerender } = renderEditProfile();
    
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    rerender(
      <BrowserRouter>
        <EditProfile />
      </BrowserRouter>
    );
    
    // Should show login message instead
    expect(screen.getByText('profile.pleaseLogin')).toBeInTheDocument();
  });
});
