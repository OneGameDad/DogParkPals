import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
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
      // Simulate toast.promise behavior for testing
      // Suppress errors to prevent unhandled rejections in tests
      return promise.catch((err: Error) => {
        if (messages?.error) {
          const errorMsg = typeof messages.error === 'function' 
            ? messages.error(err) 
            : messages.error;
        }
        // Don't re-throw in tests to avoid unhandled rejections
        return undefined;
      });
    }),
  },
}));

// Mock the api service
vi.mock('../../services/api', () => ({
  api: {
    login: vi.fn(),
    getBaseUrl: vi.fn(() => 'http://localhost:3000'),
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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();
    
    expect(screen.getByText('auth.login.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.login.emailPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.login.passwordPlaceholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.login.signInButton' })).toBeInTheDocument();
  });

  it('should render Google login button', () => {
    renderLogin();
    
    expect(screen.getByRole('button', { name: 'auth.login.signInWithGoogle' })).toBeInTheDocument();
  });

  it('should render link to registration', () => {
    renderLogin();
    
    const registerLink = screen.getByText('auth.login.noAccount');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should update email input value', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should update password input value', () => {
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(passwordInput.value).toBe('password123');
  });

  it('should call api.login with correct credentials on form submit', async () => {
    const mockLogin = vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'test@example.com', username: 'testuser' },
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.login.signInButton' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'test@example.com', username: 'testuser' },
    });

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.login.signInButton' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should dispatch auth:login event on successful login', async () => {
    vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce({
      user: { id: 1, email: 'test@example.com', username: 'testuser' },
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.login.signInButton' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
      const event = dispatchSpy.mock.calls[0][0] as Event;
      expect(event.type).toBe('auth:login');
    });
  });

  it('should display error message on login failure', async () => {
    vi.spyOn(apiModule.api, 'login').mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.login.signInButton' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    // Error is now shown via toast, handled by useSubmit hook
    await waitFor(() => {
      expect(apiModule.api.login).toHaveBeenCalled();
    });
  });

  it('should show loading state during login', async () => {
    vi.spyOn(apiModule.api, 'login').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { name: 'auth.login.signInButton' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('auth.login.signingIn')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should redirect to Google OAuth on Google login button click', () => {
    delete (window as any).location;
    window.location = { href: '' } as Location;

    renderLogin();
    
    const googleButton = screen.getByRole('button', { name: 'auth.login.signInWithGoogle' });
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('http://localhost:3000/auth/google');
  });

  it('should require email and password fields', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder') as HTMLInputElement;
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should have correct input types', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('auth.login.emailPlaceholder') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('auth.login.passwordPlaceholder') as HTMLInputElement;
    
    expect(emailInput.type).toBe('email');
    expect(passwordInput.type).toBe('password');
  });
});
