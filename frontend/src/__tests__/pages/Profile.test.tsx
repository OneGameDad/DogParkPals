import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';

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

// Mock useFetch hook
const mockUseFetch = vi.fn();
vi.mock('../../hooks/useFetch', () => ({
  useFetch: () => mockUseFetch(),
}));

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    ExpPoints: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    profilePictureUrl: 'https://example.com/profile.jpg',
  };

  const mockDogs = [
    {
      id: 1,
      name: 'Buddy',
      breed: 'Golden Retriever',
      profilePictureUrl: 'https://example.com/dog1.jpg',
    },
    {
      id: 2,
      name: 'Max',
      breed: 'Labrador',
      profilePictureUrl: null,
    },
  ];

  it('should show loading state while fetching user data', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseFetch.mockReturnValue({ data: null, loading: true });

    renderProfile();
    
    expect(screen.getByText('profile.loadingProfile')).toBeInTheDocument();
  });

  it('should show error message when user is not found', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseFetch.mockReturnValue({ data: null, loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.failedToLoad')).toBeInTheDocument();
  });

  it('should render user profile information', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should display full name when first and last name are available', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display username when first or last name is missing', () => {
    const userWithoutName = { ...mockUser, first_name: null, last_name: null };
    mockUseAuth.mockReturnValue({ user: userWithoutName, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getAllByText('testuser').length).toBeGreaterThan(0);
  });

  it('should render Edit Profile button', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.editProfile')).toBeInTheDocument();
  });

  it('should navigate to edit profile page when Edit Profile button is clicked', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    const editButton = screen.getByText('profile.editProfile');
    fireEvent.click(editButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile/edit');
  });

  it('should show "No dogs added yet" message when there are no dogs', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.noDogs')).toBeInTheDocument();
  });

  it('should render list of dogs when user has dogs', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: mockDogs, loading: false });

    renderProfile();
    
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
  });

  it('should render Add Dog button', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.addDog')).toBeInTheDocument();
  });

  it('should navigate to add dog page when Add Dog button is clicked', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    const addButton = screen.getByText('profile.addDog');
    fireEvent.click(addButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dog/add');
  });

  it('should display profile picture with correct alt text', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toBeInTheDocument();
  });

  it('should display default profile picture when user has no profile picture', () => {
    const userWithoutPicture = { ...mockUser, profilePictureUrl: null };
    mockUseAuth.mockReturnValue({ user: userWithoutPicture, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toHaveAttribute('src', '/imgs/exampleprofilepic.jpg');
  });

  it('should render dog images with correct alt text', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: mockDogs, loading: false });

    renderProfile();
    
    expect(screen.getByAltText('Buddy')).toBeInTheDocument();
    expect(screen.getByAltText('Max')).toBeInTheDocument();
  });

  it('should render all user information labels', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.username:')).toBeInTheDocument();
    expect(screen.getByText('profile.email:')).toBeInTheDocument();
    expect(screen.getByText('profile.experiencePoints:')).toBeInTheDocument();
    expect(screen.getByText('memberSince:')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: [], loading: false });

    renderProfile();
    
    // The date format is locale-specific, but we can check that it's present
    const dateElements = screen.getAllByText(/January|2026/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should handle null dogs data', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ data: null, loading: false });

    renderProfile();
    
    expect(screen.getByText('profile.noDogs')).toBeInTheDocument();
  });

  it('should display error message when dogs fetch fails', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    mockUseFetch.mockReturnValue({ 
      data: null, 
      loading: false, 
      error: new Error('Failed to load dogs') 
    });

    renderProfile();
    
    expect(screen.getByText('profile.failedToLoad')).toBeInTheDocument();
  });
});
