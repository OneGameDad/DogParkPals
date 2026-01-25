import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { api } from '../../services/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as Location;

describe('ApiService with Cookie Authentication', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('request method', () => {
    it('should include credentials in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      });

      await api.get('/health');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should redirect to login on 401 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.get('/protected')).rejects.toThrow('Unauthorized - please log in again');
      expect(window.location.href).toBe('/login');
    });

    it('should handle JSON responses', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await api.get('/test');
      expect(result).toEqual(mockData);
    });

    it('should handle text responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Hello World',
      });

      const result = await api.get('/test');
      expect(result).toBe('Hello World');
    });

    it('should throw error on failed requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(api.get('/error')).rejects.toThrow('Server error');
    });
  });

  describe('login', () => {
    it('should send email and password to /auth/login', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: mockUser }),
      });

      const result = await api.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('should not store token in localStorage', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: mockUser }),
      });

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      await api.login('test@example.com', 'password123');

      expect(setItemSpy).not.toHaveBeenCalled();
      setItemSpy.mockRestore();
    });
  });

  describe('register', () => {
    it('should send username, email, and password to /users', async () => {
      const mockUser = { id: 1, email: 'new@example.com', username: 'newuser' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: mockUser }),
      });

      const result = await api.register('newuser', 'new@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
          }),
        })
      );
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('should call /auth/logout endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => '',
      });

      await api.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should not clear localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => '',
      });

      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      
      await api.logout();

      expect(removeItemSpy).not.toHaveBeenCalled();
      removeItemSpy.mockRestore();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST requests with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const data = { name: 'test' };
      await api.post('/test', data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      );
    });

    it('should make PUT requests with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const data = { name: 'updated' };
      await api.put('/test/1', data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data),
        })
      );
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await api.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should make PATCH requests with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const data = { status: 'active' };
      await api.patch('/test/1', data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      );
    });
  });

  describe('getBaseUrl', () => {
    it('should return the base URL', () => {
      const baseUrl = api.getBaseUrl();
      expect(baseUrl).toBeDefined();
      expect(typeof baseUrl).toBe('string');
    });
  });
});
