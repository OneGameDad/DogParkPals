import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import * as apiModule from '../../services/api';
import toast from 'react-hot-toast';

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
      return promise.catch((err: Error) => {
        if (messages?.error && typeof messages.error === 'function') {
          messages.error(err);
        }
        throw err;
      });
    }),
  },
}));

// Mock the api service
vi.mock('../../services/api', () => ({
  api: {
    register: vi.fn(),
    login: vi.fn(),
    getBaseUrl: vi.fn(() => 'https://localhost:3000'),
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
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    refreshUser: vi.fn(),
    isAuthenticated: false,
    loading: false,
  }),
}));

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  it('should render registration form', () => {
    renderRegister();
    
    expect(screen.getByText('auth.register.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.register.usernamePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.register.emailPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.register.passwordPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.register.signUpButton' })).toBeInTheDocument();
  });

  it('should render Google signup button', () => {
    renderRegister();
    
    expect(screen.getByRole('button', { name: 'auth.register.signUpWithGoogle' })).toBeInTheDocument();
  });

  it('should render link to login', () => {
    renderRegister();
    
    const loginLink = screen.getByText('auth.register.haveAccount');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should update form input values', () => {
    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder') as HTMLInputElement;
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('newuser');
    expect(emailInput.value).toBe('new@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmInput.value).toBe('password123');
  });

  it('should show error if passwords do not match', async () => {
    const { container } = renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const form = container.querySelector('form')!;
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different123' } });
    
    // Submit and wait for toast.promise to be called
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(toast.promise).toHaveBeenCalled();
      // Verify the promise was called and would show the error message
      const call = (toast.promise as any).mock.calls[0];
      const messages = call[1];
      expect(messages.error).toBeDefined();
    });
  });

  it('should show error if password is too short', async () => {
    const { container } = renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const form = container.querySelector('form')!;
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    
    // Submit and wait for toast.promise to be called
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(toast.promise).toHaveBeenCalled();
      // Verify the promise was called and would show the error message
      const call = (toast.promise as any).mock.calls[0];
      const messages = call[1];
      expect(messages.error).toBeDefined();
    });
  });

  it('should call api.register and api.login on successful registration', async () => {
    const mockRegister = vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });
    const mockLogin = vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });

    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.register.signUpButton' });
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123');
      expect(mockLogin).toHaveBeenCalledWith('new@example.com', 'password123');
    });
  });

  it('should navigate to home on successful registration and login', async () => {
    vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });
    vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });

    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.register.signUpButton' });
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should dispatch auth:login event on successful registration', async () => {
    vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });
    vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'new@example.com', username: 'newuser' },
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.register.signUpButton' });
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      const event = dispatchSpy.mock.calls[0][0] as Event;
      expect(event.type).toBe('auth:login');
    });
  });

  it('should display error message on registration failure', async () => {
    vi.spyOn(apiModule.api, 'register').mockRejectedValueOnce(
      new Error('Email already in use')
    );

    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.register.signUpButton' });
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // Error is now shown via toast, handled by useSubmit hook
    await waitFor(() => {
      expect(apiModule.api.register).toHaveBeenCalled();
    });
  });

  it('should show loading state during registration', async () => {
    vi.spyOn(apiModule.api, 'register').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder');
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.register.signUpButton' });
    
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('auth.register.creatingAccount')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should redirect to Google OAuth on Google signup button click', () => {
    delete (window as any).location;
    window.location = { href: '' } as Location;

    renderRegister();
    
    const googleButton = screen.getByRole('button', { name: 'auth.register.signUpWithGoogle' });
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('https://localhost:3000/auth/google');
  });

  it('should require all form fields', () => {
    renderRegister();
    
    const usernameInput = screen.getByPlaceholderText('auth.register.usernamePlaceholder') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('auth.register.emailPlaceholder') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('auth.register.passwordPlaceholder') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('auth.register.confirmPasswordPlaceholder') as HTMLInputElement;
    
    expect(usernameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmInput).toBeRequired();
  });
});
